function StrabonSearchResults(skosOntologies) {

    //this array is initialized as empty only when the user pushes the search button
    this.concepts = [];
    this.keyword = undefined;

    this.numOf_returned_results = undefined;
    this.end_index = 21;
    this.numOf_current_results = 0;
    this.more_results = false;
    this.total_pages = 0;
    this.start_index = 1;
    this.max_clicked_page = 0;
    this.searching_for_decade = 0; //the value 0 means that no search is running

    this.initializeSearchVars = function() {

        this.numOf_returned_results = undefined;
        this.end_index = 21;
        this.numOf_current_results = 0;
        this.more_results = false;
        this.total_pages = 0;
        this.start_index = 1;
        this.max_clicked_page = 0;
        this.searching_for_decade = 0;

    };

    // Copied from Gi-Sem
    this.moreSearchResults = function() {

        this.start_index = this.end_index + 1;
        this.end_index = this.end_index + 10;

        this.searching_for_decade = Math.floor(this.end_index / 10);

        var conceptReqOptions = {
            //Request all
            start: this.start_index,
            count: this.end_index,
            topLevel: false
        };

        //Get concepts that their label or description contains this keyword
        skosOntologies.serverRequests.dab.concept(this.keyword, skosOntologies.serverRequests.processResponse.searchResults(this), conceptReqOptions);

    }

    // Copied from Gi-Sem
    // Display a list of terms in the Search Results list
    // :param decade_num: The index of the page to be displayed (page of 10 items)
    // :param concepts: The list of all the concepts (in which only a part of 10 will be displayed)
    this.display_decade = function(decade_num, concepts) {
        displayLoadingAnimation(false);

        var ul = document.getElementById('search-results-list');
        ul.innerHTML = "";
        var decade = decade_num * 10;
        var start = decade - 10;
        var end = start + 10;

        if (end > concepts.length)
            end = concepts.length;

        for (var i = start; i < end; i++) {

            var concept = document.createElement('li');
            concept.appendChild(document.createTextNode(concepts[i].label));
            concept.id = concepts[i].id;

            ul.appendChild(concept);
        }

        // Triggered when one of the concept is clicked in the search-results list
        $('#search-results-list li').on('click', function(event) {
            $('#search-results-list li').removeClass('active'); // remove active class
            $(this).addClass('active'); // add active class to clicked concept

            var node_id = $(this).attr('id');
            click_event_id = node_id;
            var selected_concept = skosOntologies.hash_table_ids[node_id];

            document.getElementById('narrower_term').innerHTML = loading_child;
            displaySelectedConcept(selected_concept, skosOntologies.serverRequests);
        });

    }

    // Copied From Gi-Sem
    this.waitUntilNoSearchIsExecuted = function(num, loading) {

        var thisObject = this;
        if (this.searching_for_decade != 0) {
            setTimeout(function() {
                thisObject.waitUntilNoSearchIsExecuted(num, loading);
            }, 200);
            return;
        }

        if (loading) {

            this.display_decade(num, this.concepts);

            if (num > this.max_clicked_page) {
                this.max_clicked_page = num;

                this.waitUntilNoSearchIsExecuted(num, false);
            }

        } else {

            if (this.more_results) {
                this.moreSearchResults();
                this.more_results = false;
            }
        }

    }

    // Copied from Gi-Sem
    // Called once search-result callback has been executed
    this.createPaginationWithSearchResults = function() {

        //enable the keyword search button
        $('#search-button').disabled = false;

        var title = $('#results-title');

        // If no results
        if (this.concepts.length == 0) {
            title.innerHTML = "";
            displayLoadingAnimation(false);
            $('#search-results-list').innerHTML = "<i><br>No results found.</i>";
            return;
        }
        // Else if some results
        else {
            title.innerHTML = "<strong>Search Results</strong>";

            this.numOf_returned_results = this.concepts.length
            // alert(this.numOf_returned_results + " " + this.end_index + " " + )
            if (this.numOf_returned_results == this.end_index - this.start_index + 1)
                this.more_results = true;

            this.searching_for_decade = 0;
            this.numOf_current_results = this.numOf_current_results + this.numOf_returned_results;

            var ul = $('#search-results-list');
            var concepts = this.concepts;

            //if it's the first 10 results, just display them
            if (this.start_index == 1) {
                this.display_decade(1, this.concepts);
                this.max_clicked_page = 1;
            }

            // Number of pages
            r =  this.numOf_current_results
            this.total_pages = ( r  - r %10 ) / 10;

            var searchObject = this;


                // Update the page selector according to the total number of pages
            $('#page-selection').empty()
            $('#page-selection').bootpag({
                total: searchObject.total_pages,
                leaps: false,
                maxVisible: 5
            });

            $('#page-selection').on("page", function(event, num) {

                if (num == searchObject.searching_for_decade) {

                    console.log("IFF mesa");
                    ul.innerHTML = "";
                    displayLoadingAnimation(true);

                    searchObject.waitUntilNoSearchIsExecuted(num, true);
                } else {

                    searchObject.display_decade(num, concepts);
                    //searchObject.current_page = num;

                    if (num > searchObject.max_clicked_page) {
                        searchObject.max_clicked_page = num;

                        searchObject.waitUntilNoSearchIsExecuted(num, false);

                    }

                }
            });


            if (this.start_index == 1 && this.more_results) {
                this.moreSearchResults();
                this.more_results = false;
            }
            //this.concepts = [];

        }

    }


}

function QueryBuilder() {

    this.getTopConceptsQuery = function() {

        var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?label ?concept ?narrower_label ?narrower_concept ' +
            'WHERE { ' +
            '?concept rdf:type skos:Concept. ' +
            '?concept     skos:prefLabel ?label . ' +
            '?concept    skos:narrower ?narrower_concept. ' +
            '?narrower_concept   skos:prefLabel   ?narrower_label. ' +
            'OPTIONAL {?concept skos:broader ?broader}. ' +
            'FILTER (!bound(?broader)) }' +
            'ORDER BY ?label'; // Matt: Added to order Top-Level concepts by name


        return query;

    }

    this.searchForKeywordQuery = function(keyword) {

        if (!keyword) {
            console.warn("You shall provid a keyword to be searched.")
            return null;
        }

        var query = 'PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> ' +
            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            'PREFIX dct:<http://purl.org/dc/terms/> ' +

            'SELECT distinct ?concept ?prefLabel ?definition ?altLabel ?th_uri ?thesaurus ?label ?description ?exactMatch ?narrowMatch ?closeMatch ?relatedMatch ?broadMatch ' +
            'WHERE { ' +
            '?concept rdf:type skos:Concept. ' +
            'OPTIONAL {?concept rdfs:label ?label} ' +
            'OPTIONAL {?concept skos:prefLabel ?prefLabel} ' +
            //'OPTIONAL {?concept skos:definition ?definition} ' +
            //'OPTIONAL {?concept dct:description ?description} ' +
            //'OPTIONAL {?concept skos:altLabel ?altLabel} ' +
            //'OPTIONAL {?concept skos:inScheme ?th_uri} ' +
            //'OPTIONAL {?th_uri skos:prefLabel ?thesaurus} ' +

            'FILTER ( (bound(?label) && lang(?label) = "en" ' +
            '&& regex(str(?label), "^__placeholder__$|^__placeholder__[\\\\s|,|;|:|\\\\.|(|)]|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__$|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__[\\\\s|,|;|:|\\\\.|(|)]", "i")) ' +
            '|| (bound(?prefLabel) && lang(?prefLabel) = "en" ' +
            '&& regex(str(?prefLabel), "^__placeholder__$|^__placeholder__[\\\\s|,|;|:|\\\\.|(|)]|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__$|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__[\\\\s|,|;|:|\\\\.|(|)]", "i")) ' +
            '|| (bound(?altLabel) && lang(?altLabel) = "en" ' +
            '&& regex(str(?altLabel), "^__placeholder__$|^__placeholder__[\\\\s|,|;|:|\\\\.|(|)]|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__$|[\\\\s|,|;|:|\\\\.|(|)]__placeholder__[\\\\s|,|;|:|\\\\.|(|)]", "i")) ) ' +

            //'OPTIONAL {?concept skos:exactMatch ?exactMatch} ' +
            //'OPTIONAL {?concept skos:narrowMatch ?narrowMatch} ' +
            //'OPTIONAL {?concept skos:closeMatch ?closeMatch} ' +
            //'OPTIONAL {?concept skos:relatedMatch ?relatedMatch} ' +
            //'OPTIONAL {?concept skos:broadMatch ?broadMatch} ' +
            '}';
        query = query.replace(/__placeholder__/g, keyword);

        return query;

    }

    this.getNarrowerConcept = function(concept) {

        var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?narrower_label ?narrower_concept ' +
            'WHERE { <' +
            concept + '> skos:narrower ?narrower_concept. ' +
            '?narrower_concept   skos:prefLabel   ?narrower_label. }';


        return query;

    }

    this.getDefinitionOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?definition ' +
            'WHERE { <' +
            concept + '> skos:definition ?definition. }';


        return query;
    }

    this.getNotationOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?notation ' +
            'WHERE { <' +
            concept + '> skos:notation ?notation. }';


        return query;
    }

    this.getAltLabelOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?altLabel ' +
            'WHERE { <' +
            concept + '> skos:altLabel ?altLabel. }';


        return query;
    }

    this.getNoteOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?note ' +
            'WHERE { <' +
            concept + '> skos:note ?note. }';


        return query;
    }

    this.getChangeNoteOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?note ' +
            'WHERE { <' +
            concept + '> skos:changeNote ?note. }';


        return query;
    }

    this.getScopeNoteOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?note ' +
            'WHERE { <' +
            concept + '> skos:scopeNote ?note. }';


        return query;
    }

    this.getNarrowMatchOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?match ' +
            'WHERE { <' +
            concept + '> skos:narrowMatch ?match. }';


        return query;
    }

    this.getBroadMatchOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?match ' +
            'WHERE { <' +
            concept + '> skos:broadMatch ?match. }';


        return query;
    }

    this.getExactMatchOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?match ' +
            'WHERE { <' +
            concept + '> skos:exactMatch ?match. }';


        return query;
    }

    this.getRelatedMatchOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?match ' +
            'WHERE { <' +
            concept + '> skos:relatedMatch ?match. }';


        return query;
    }

    this.getCloseMatchOf = function(concept) {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +

            'SELECT ?match ' +
            'WHERE { <' +
            concept + '> skos:closeMatch ?match. }';


        return query;
    }

    this.getSchemesQuery = function() {

        var query = 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            'SELECT ?concept ?scheme ' +
            'WHERE {  ?concept skos:inScheme ?scheme .  ' +
            'OPTIONAL {?concept skos:broader ?broader}. ' +
            'FILTER (!bound(?broader)) }';

        return query;

    }

    this.getConceptsInScheme = function(schemeURI) {

        var query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            'SELECT ?concept ?label ' +
            'WHERE { ' +
            '?concept skos:inScheme ' + schemeURI + ' ; ' +
            'rdf:type skos:Concept ; ' +
            'skos:prefLabel ?label . ';
        '} ORDER BY ?label';

        return query;

    }

}


function HttpRequest() {

    this.send = function(URL, query, processResponseFunction, args) {

        //var encQuery = encodeURIComponent(query);

        $.ajax({
                url: URL,
                type: 'POST',
                contentType: 'application/x-www-form-urlencoded',
                headers: {
                    accept: 'application/xml'
                },
                crossDomain: true,
                /* SA: For Debug */
                //data : { query : encQuery },
                data: {
                    query: query
                },
                dataType: 'text'
            })
            .done(function(response) {

                processResponseFunction(response, args);

            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                alert('Error while sending http request.');
                console.log(textStatus);
                console.log(errorThrown);
                console.log(jqXHR);
                return undefined;
            });


    }
}

function Variable() {

    this.value = "";
}

function StrabonProcessResponse(ontologyBrowser) {

    var getValuesFromVariables = function(binding_array, concept, concept_label, narrower_concept, narrower_label) {

        for (var i = 0; i < binding_array.length; i++) {

            switch (binding_array[i].name) {
                case 'concept':
                    concept.value = binding_array[i].uri;
                    break;
                case 'label':
                    concept_label.value = binding_array[i].literal;
                    break;
                case 'narrower_concept':
                    narrower_concept.value = binding_array[i].uri;
                    break;
                case 'narrower_label':
                    narrower_label.value = binding_array[i].literal;
                    break;
            }
        }

    }

    this.topConcepts = function(response) { //get Top Concepts and the first level of narrower

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        var num_results = json.results.result.length;
        for (var i = 0; i < num_results; i++) {

            //var uri = json.results.result[i].binding[1].uri;
            var uri = new Variable();
            var label = new Variable();
            var narrower_concept = new Variable();
            var narrower_label = new Variable();

            getValuesFromVariables(json.results.result[i].binding, uri, label, narrower_concept, narrower_label);

            var concept = undefined;
            if (ontologyBrowser.skosOntologies.hash_table[uri.value] == undefined) {

                concept = new Concept(uri.value);
                //concept.prefLabel = json.results.result[i].binding[0].literal;
                concept.prefLabel = label.value;
                concept.id = uri.value;
                concept.label = concept.prefLabel;

                ontologyBrowser.skosOntologies.top_concepts.push(concept);
                ontologyBrowser.skosOntologies.hash_table[uri.value] = concept;
                ontologyBrowser.skosOntologies.hash_table_ids[concept.id] = concept;

            } else {

                concept = ontologyBrowser.skosOntologies.hash_table[uri.value]; //each top concept is unique
            }

            //var narrower_uri = json.results.result[i].binding[3].uri;
            var narrower_uri = narrower_concept.value;
            var narrower_concept = new Concept(narrower_uri);
            //narrower_concept.prefLabel = json.results.result[i].binding[2].literal;
            narrower_concept.prefLabel = narrower_label.value;
            narrower_concept.label = narrower_concept.prefLabel;
            narrower_concept.broader = concept;

            var existing_concept = ontologyBrowser.skosOntologies.hash_table[narrower_uri];
            if (existing_concept == undefined) {
                narrower_concept.id = narrower_uri;
                ontologyBrowser.skosOntologies.hash_table[narrower_uri] = narrower_concept;
                ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id] = narrower_concept;
            } else {
                var number = existing_concept.occurences + 1;
                existing_concept.occurences = existing_concept.occurences + 1;
                var id = narrower_uri + "_" + number;
                narrower_concept.id = id;
                ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id] = narrower_concept;
            }
            //ontologyBrowser.skosOntologies.top_concepts.push(narrower_concept);


            concept.children.push(narrower_concept);

        }

        document.dispatchEvent(ontologyBrowser.events.getTopConceptsEvent);
    }


    // Callback fired when "Search Concepts" button is clicked
    this.searchResultsCallback = function(results) {
        console.debug("Passing through Strabon 'searchResults function")

        var json = $.xml2json(results);
        searchResults = {}
        searchResults.numOf_returned_results = 0;

        if (json.results.result) {
            resultsArray = json.results.result;
            searchResults.numOf_returned_results = resultsArray.length;

            for (var i = 0; i < resultsArray.length; i++) {
                var element = resultsArray[i].binding;

                // Get the URI from the Concept JsonObject from the property table
                var uri = null;
                var uriElement = element.filter(function(obj) {
                    return obj.name == 'concept';
                });
                if (uriElement && uriElement[0] && uriElement[0].uri) {
                    uri = uriElement[0].uri;
                } else {
                    console.info("No URI Element!");
                    return;
                }

                // Get the Label from the Concept JsonObject from the property table
                var label = "no_label";
                var prefLabelElement = element.filter(function(obj) {
                    return obj.name == 'prefLabel';
                });
                if (prefLabelElement && prefLabelElement[0] && prefLabelElement[0].literal)
                    label = prefLabelElement[0].literal;


                var existing_concept = ontologyBrowser.skosOntologies.hash_table[uri];
                //this concept hasn't been explored before
                if (existing_concept == undefined) {
                    console.info("This concept hasn't been explored before")

                    var concept = new Concept(uri);
                    concept.standAlone = true;
                    concept.id = concept.uri;

                    if (label != undefined) {
                        concept.prefLabel = label;
                        concept.label = concept.prefLabel;
                    }

                    ontologyBrowser.skosOntologies.hash_table[concept.uri] = concept;
                    ontologyBrowser.skosOntologies.hash_table_ids[concept.id] = concept;
                    // ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri] = con;  //Matt:Desactivated

                    ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.push(concept);

                } else {
                    console.info("Concept exists and its label is:" + existing_concept.label)

                    //alert(existing_concept.label);
                    ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.push(existing_concept);
                }

                // Sort results by alphabetical order
                ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.sort(function(a, b) {
                    var textA = a.label.toUpperCase();
                    var textB = b.label.toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
            }

        }

        //	ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.sort(sortOn("label"));
        ontologyBrowser.skosOntologies.serverRequests.searchResults.createPaginationWithSearchResults();


    }


    this.narrowerConcepts = function(response, concept_id) {

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        if (json.results.result == undefined) { //There are not narrower concepts
            return;
        }

        var num_results = json.results.result.length;
        for (var i = 0; i < num_results; i++) {

            var broader_concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

            var narrower_uri = json.results.result[i].binding[1].uri;
            var narrower_concept = new Concept(narrower_uri);
            narrower_concept.prefLabel = json.results.result[i].binding[0].literal;
            narrower_concept.label = narrower_concept.prefLabel;
            narrower_concept.broader = broader_concept;
            narrower_concept.ontology = broader_concept.ontology;

            var existing_concept = ontologyBrowser.skosOntologies.hash_table[narrower_uri];
            if (existing_concept == undefined) {
                narrower_concept.id = narrower_uri;
                ontologyBrowser.skosOntologies.hash_table[narrower_uri] = narrower_concept;
                ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id] = narrower_concept;
            } else {
                var number = existing_concept.occurences + 1;
                existing_concept.occurences = existing_concept.occurences + 1;
                var id = narrower_uri + "_" + number;
                narrower_concept.id = id;
                //alert("SAME " + id);
                ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id] = narrower_concept;
            }

            broader_concept.children.push(narrower_concept);

            var node = $('#tree').tree('getNodeById', broader_concept.id);
            $('#tree').tree('appendNode', narrower_concept, node);

            var node = $('#concepts-tree').tree('getNodeById', broader_concept.id);
            $('#concepts-tree').tree('appendNode', narrower_concept, node);
            //alert(node);
        }
    }

    this.definition = function(response, concept_id) {

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayDefinitionOf(concept);
            return;
        }

        concept.definition = json.results.result.binding.literal;

        displayDefinitionOf(concept);
    }

    this.notation = function(response, concept_id) {

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) {
            displayNotationOf(concept); //No results
            return;
        }

        concept.notation.push(json.results.result.binding.literal);

        displayNotationOf(concept);
    }

    this.altLabel = function(response, concept_id) { //mporei na exw polla altLabels

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayAltLabelOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.altLabel.push(json.results.result[i].binding.literal);
            }
        } else //has one result
            concept.altLabel.push(json.results.result.binding.literal);

        displayAltLabelOf(concept);

    }

    this.note = function(response, concept_id) {

        var json = $.xml2json(response);

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) {
            displayNoteOf(concept); //No results
            return;

        }


        concept.note.push(json.results.result.binding.literal);

        displayNoteOf(concept);
    }

    this.changeNote = function(response, concept_id) {

        var json = $.xml2json(response);

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayChangeNoteOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.changeNote.push(json.results.result[i].binding.literal);
            }
        } else //has one result
            concept.changeNote.push(json.results.result.binding.literal);

        displayChangeNoteOf(concept);
    }

    this.scopeNote = function(response, concept_id) {

        var json = $.xml2json(response);

        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayScopeNoteOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.scopeNote.push(json.results.result[i].binding.literal);
            }
        } else //has one result
            concept.scopeNote.push(json.results.result.binding.literal);

        displayScopeNoteOf(concept);
    }

    this.narrowMatch = function(response, concept_id) {

        var json = $.xml2json(response);

        //alert(JSON.stringify(json));
        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayNarrowMatchOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.narrowMatch.push(json.results.result[i].binding.uri);
            }
        } else //has one result
            concept.narrowMatch.push(json.results.result.binding.uri);

        displayNarrowMatchOf(concept);
    }

    this.broadMatch = function(response, concept_id) {

        var json = $.xml2json(response);

        //alert(JSON.stringify(json));
        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayBroadMatchOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.broadMatch.push(json.results.result[i].binding.uri);
            }
        } else //has one result
            concept.broadMatch.push(json.results.result.binding.uri);

        displayBroadMatchOf(concept);
    }

    this.exactMatch = function(response, concept_id) {

        var json = $.xml2json(response);

        //alert(JSON.stringify(json));
        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayExactMatchOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.exactMatch.push(json.results.result[i].binding.uri);
            }
        } else //has one result
            concept.exactMatch.push(json.results.result.binding.uri);

        displayExactMatchOf(concept);
    }

    this.relatedMatch = function(response, concept_id) {

        var json = $.xml2json(response);

        //alert(JSON.stringify(json));
        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayRelatedMatchOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.relatedMatch.push(json.results.result[i].binding.uri);
            }
        } else //has one result
            concept.relatedMatch.push(json.results.result.binding.uri);

        displayRelatedMatchOf(concept);
    }

    this.closeMatch = function(response, concept_id) {

        var json = $.xml2json(response);

        //alert(JSON.stringify(json));
        var concept = ontologyBrowser.skosOntologies.hash_table_ids[concept_id];

        if (json.results.result == undefined) { //No results
            displayCloseMatchOf(concept);
            return;
        }

        if (json.results.result.binding == undefined) { //has many results
            for (var i = 0; i < json.results.result.length; i++) {
                concept.closeMatch.push(json.results.result[i].binding.uri);
            }
        } else //has one result
            concept.closeMatch.push(json.results.result.binding.uri);

        displayCloseMatchOf(concept);
    }

    ////////////////////////

    this.schemes = function(response) {

        var json = $.xml2json(response);
        //alert(JSON.stringify(json));

        var hash_table = {};

        var num_results = json.results.result.length;
        for (var i = 0; i < num_results; i++) {

            var scheme_uri = json.results.result[i].binding[0].uri;
            var concept_uri = json.results.result[i].binding[1].uri;

            hash_table[concept_uri] = scheme_uri;

        }


        ontologyBrowser.skosOntologies.addSchemes(hash_table);

        $('#concepts-tree').tree({
            data: []
        });


    }

}

function StrabonRequests(ontologyBrowser) {

    this.name = 'strabon';
    //this.url = 'http://sextant.di.uoa.gr:8080/prodtrees/Query';
    //this.url = 'http://obeos.spaceapplications.com/ontologies/Query';
    //this.url = 'http://localhost:8080/prodtrees/Query';

    // ONTOLOGY_SERVICE_URL is provided by the CKAN html template
    this.url = ONTOLOGY_SERVICE_URL + '/Query'

    this.queryBuilder = new QueryBuilder();
    this.httpRequest = new HttpRequest();
    this.processResponse = new StrabonProcessResponse(ontologyBrowser);

    // Matt: Added that line
    this.searchResults = new StrabonSearchResults(ontologyBrowser.skosOntologies);

    this.getTopConcepts = function() {

        var query = this.queryBuilder.getTopConceptsQuery();
        var response = this.httpRequest.send(this.url, query, this.processResponse.topConcepts);

    }

    // Matt: Add this from GISem
    this.searchForKeyword = function(keyword) {

        this.searchResults.keyword = keyword;

        var query = this.queryBuilder.searchForKeywordQuery(keyword);
        // var response = this.httpRequest.send(this.url, query, this.processResponse.searchResults(this.searchResults));
        var response = this.httpRequest.send(this.url, query, this.processResponse.searchResultsCallback);

        //console.log("Psaxnw apo " + this.searchResults.start_index + " mexri " + this.searchResults.end_index);

        // var conceptReqOptions = {
        //   start: this.searchResults.start_index,
        //   count: this.searchResults.end_index,
        //   topLevel: false
        // };
        //
        // //Get concepts that their label or description contains this keyword
        // this.dab.concept(keyword, this.processResponse.searchResults(this.searchResults), conceptReqOptions);

    }


    this.getNarrowerConcepts = function(mostBroaderConcept) {

        if (mostBroaderConcept.explored == true)
            return;

        mostBroaderConcept.explored = true;

        var children_num = mostBroaderConcept.children.length;

        for (var i = 0; i < children_num; i++) {

            var concept = mostBroaderConcept.children[i];

            var query = this.queryBuilder.getNarrowerConcept(concept.uri);
            var response = this.httpRequest.send(this.url, query, this.processResponse.narrowerConcepts, concept.id);

        }
    }

    this.getDefinitionOf = function(concept) {

        var query = this.queryBuilder.getDefinitionOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.definition, concept.id);

    }

    this.getNotationOf = function(concept) {

        var query = this.queryBuilder.getNotationOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.notation, concept.id);

    }

    this.getAltLabelOf = function(concept) {

        var query = this.queryBuilder.getAltLabelOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.altLabel, concept.id);

    }

    this.getNoteOf = function(concept) {

        var query = this.queryBuilder.getNoteOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.note, concept.id);

    }

    this.getChangeNoteOf = function(concept) {

        var query = this.queryBuilder.getChangeNoteOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.changeNote, concept.id);

    }

    this.getScopeNoteOf = function(concept) {

        var query = this.queryBuilder.getScopeNoteOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.scopeNote, concept.id);

    }

    this.getNarrowMatchOf = function(concept) {

        var query = this.queryBuilder.getNarrowMatchOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.narrowMatch, concept.id);

    }

    this.getBroadMatchOf = function(concept) {

        var query = this.queryBuilder.getBroadMatchOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.broadMatch, concept.id);

    }

    this.getExactMatchOf = function(concept) {

        var query = this.queryBuilder.getExactMatchOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.exactMatch, concept.id);

    }

    this.getRelatedMatchOf = function(concept) {

        var query = this.queryBuilder.getRelatedMatchOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.relatedMatch, concept.id);

    }

    this.getCloseMatchOf = function(concept) {

        var query = this.queryBuilder.getCloseMatchOf(concept.uri);
        this.httpRequest.send(this.url, query, this.processResponse.closeMatch, concept.id);

    }

    this.getConceptInfo = function(concept) {

        concept.hasInfo = true;

        this.getDefinitionOf(concept);
        this.getNotationOf(concept);
        this.getAltLabelOf(concept);
        this.getNoteOf(concept);
        this.getChangeNoteOf(concept);
        this.getScopeNoteOf(concept);
        this.getNarrowMatchOf(concept);
        this.getBroadMatchOf(concept);
        this.getExactMatchOf(concept);
        this.getRelatedMatchOf(concept);
        this.getCloseMatchOf(concept);

    }

    this.getSchemes = function() {

        var query = this.queryBuilder.getSchemesQuery();
        var response = this.httpRequest.send(this.url, query, this.processResponse.schemes);
    }


}
