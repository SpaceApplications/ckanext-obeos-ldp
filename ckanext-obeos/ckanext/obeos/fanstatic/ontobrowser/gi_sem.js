function GiSemSearchResults(skosOntologies){

	//this array is initialized as empty only when the user pushes the search button
	this.concepts = [];
	this.keyword = undefined;

	this.numOf_returned_results=undefined;
	this.end_index = 21;
	this.numOf_current_results = 0;
	this.more_results = false;
	this.total_pages = 0;
	this.start_index = 1;
	this.max_clicked_page = 0;
	this.searching_for_decade = 0; //the value 0 means that no search is running

	this.initializeSearchVars = function(){

		this.numOf_returned_results=undefined;
		this.end_index = 21;
		this.numOf_current_results = 0;
		this.more_results = false;
		this.total_pages = 0;
		this.start_index = 1;
		this.max_clicked_page = 0;
		this.searching_for_decade = 0;
	}

	this.moreSearchResults = function(){

		this.start_index = this.end_index + 1;
		this.end_index = this.end_index + 10;

		this.searching_for_decade = Math.floor(this.end_index/10);

		var conceptReqOptions = {
			//Request all
			start : this.start_index,
			count : this.end_index,
			topLevel : false
		};

		//Get concepts that their label or description contains this keyword
		skosOntologies.serverRequests.dab.concept(this.keyword,skosOntologies.serverRequests.processResponse.searchResults(this), conceptReqOptions);

	}

	this.display_decade = function(decade_num, concepts){

		displayLoadingAnimation(false);

		var ul = document.getElementById('search-results-list');
		ul.innerHTML = "";
		var decade = decade_num * 10;
		var start = decade - 10 ;
		var end = start + 10;

		if (end > concepts.length)
			end = concepts.length;     

		for (var i=start; i<end; i++){

			var concept = document.createElement('li');
			concept.appendChild(document.createTextNode(concepts[i].label));
			concept.id = concepts[i].id; 

			ul.appendChild(concept);
		}

		$('#search-results-list li').on('click', function(event) {
			$('#search-results-list li').removeClass('active'); // remove active class 
			$(this).addClass('active'); // add active class to clicked concept

			var node_id = $(this).attr('id');
			click_event_id = node_id;
			var selected_concept = skosOntologies.hash_table_ids[node_id];

			document.getElementById('narrower_term').innerHTML= loading_child;
			displaySelectedConcept(selected_concept, skosOntologies.serverRequests);
		});

	}
	
	this.waitUntilNoSearchIsExecuted = function(num, loading){
	
		var thisObject = this;
		if(this.searching_for_decade != 0){
			setTimeout(function(){thisObject.waitUntilNoSearchIsExecuted(num, loading);}, 200);
			return;
		}
		
		if (loading){
		
			this.display_decade(num, this.concepts);

			if (num > this.max_clicked_page){
				this.max_clicked_page = num;

				this.waitUntilNoSearchIsExecuted(num, false);
			}	
		
		}
		else{
		
			if (this.more_results){
				this.moreSearchResults();
				this.more_results = false;
			}
		}

	}

	this.createPaginationWithSearchResults = function(){

		//enable the keyword search button
		document.getElementById('search-button').disabled=false;

	    var title = document.getElementById('results-title');
		
		if (this.concepts.length==0){
			title.innerHTML = "";
			displayLoadingAnimation(false);
			document.getElementById('search-results-list').innerHTML="<i><br>No results found.</i>";	
			return;
		}

		title.innerHTML = "<strong>Search Results</strong>";

		if(this.numOf_returned_results == this.end_index - this.start_index + 1)
			this.more_results=true;
		
		this.searching_for_decade = 0;
		this.numOf_current_results = this.numOf_current_results + this.numOf_returned_results;

		var ul = document.getElementById('search-results-list');			
		var concepts = this.concepts;

		//if it's the first 10 results, just display them
		if (this.start_index ==1){
			this.display_decade(1, this.concepts); 
			this.max_clicked_page = 1;
		}
		
		if (this.numOf_returned_results <10 )
			this.total_pages = 0;
		else
			this.total_pages = Math.floor(this.numOf_current_results/10 + 1);
		
		var searchObject = this;
						
		$('#page-selection').bootpag({
			total: searchObject.total_pages,
			leaps: false,
			maxVisible: 1});
			
		$('#page-selection').on("page", function(event, num){

				if (num==searchObject.searching_for_decade){
				 		
				 	console.log("IFF mesa");	
					ul.innerHTML = "";
					displayLoadingAnimation(true);	

					searchObject.waitUntilNoSearchIsExecuted(num, true);
				}	
				else{
				
					searchObject.display_decade(num, concepts);
					//searchObject.current_page = num;

					if (num > searchObject.max_clicked_page){
						searchObject.max_clicked_page = num;
	
						searchObject.waitUntilNoSearchIsExecuted(num, false);

					}
					
				}				
		});	
	

		if(this.start_index==1 && this.more_results){				
			this.moreSearchResults();
			this.more_results = false;
		}
	
		//this.concepts = [];

		
	}

}

function GiSemProcessResponse(ontologyBrowser){
	
	var removeFakeChild = function(concept){

		var fake_node = $('#tree').tree('getNodeById', concept.id + "/fake_child");
		if (fake_node!=undefined)	//if the tree contains this ontology at the moment
			$('#tree').tree( 'removeNode', fake_node);

		concept.children.splice(0,1);
	}

	var addSubTree = function(broader_concept, concept){

		var node = $('#tree').tree('getNodeById', broader_concept.id);
		if (node!=undefined)
			$('#tree').tree( 'appendNode', concept, node);
		concept.standAlone = false;

		for (var i=0; i<concept.children.length; i++){
			
			addSubTree(concept, concept.children[i]);
		}
		
		if(concept.children.length==0){

			
			var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
			if (gisem_concept.maxExtensionSize(GIAPI.Relation.NARROWER)>0){

				var fake_child = new Object();
				fake_child.id = concept.id + "/fake_child";
				fake_child.label = loading_child;
				concept.children.push(fake_child);

				var narrower_node = $('#tree').tree('getNodeById', concept.id);
				if (narrower_node!=undefined)
					$('#tree').tree( 'appendNode', fake_child, narrower_node);
			}
		}

	}

	var checkForThisConcept = function(uri, giSem_concept, variable){

		var existing_concept = ontologyBrowser.skosOntologies.hash_table[uri];
		//this concept hasn't been explored before
		if (existing_concept==undefined){

			var namespace = ontologyBrowser.skosOntologies.getNamespace(uri);
			var pos = ontologyBrowser.skosOntologies.uri_arrays.indexOf(namespace);
			if (pos==-1){  //this concept is not one from the stored ontologies
				var concept = new Concept(uri);
				concept.standAlone = true;
				variable.push(concept);  //just add a new concept with this uri
			}
			else{

				//alert("new concept for this ontology");
				var concept = new Concept(uri);
				concept.standAlone = true;
				concept.id = concept.uri;

				var label = giSem_concept.label();
				if (label!=undefined){
					concept.prefLabel = label;
					concept.label = concept.prefLabel;
				}

				ontologyBrowser.skosOntologies.hash_table[concept.uri]=concept;
				ontologyBrowser.skosOntologies.hash_table_ids[concept.id]=concept;
				ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri]=giSem_concept;

				variable.push(concept);

			}
		}
		else{
			//alert("this concept already exists");
			variable.push(existing_concept);
		}


	}

	var NarrowerConcepts = function(broader_concept, display){
		
		return function(results, error){

			if(error){
	       			alert('Error occurred: '+ error);
	       			return;
	  		 }
			

			//the node belongs to the tree
			//so it has a fake child
			if (broader_concept.children.length > 0 && broader_concept.children[0].label==loading_child){

				//remove the first element (fake child)
				removeFakeChild(broader_concept);
			}
			
			for (var i=0; i<results.length; i++){

				var narrower_uri = results[i].uri();
				if(narrower_uri!=broader_concept.uri){

					var narrower_concept;

					var existing_concept = ontologyBrowser.skosOntologies.hash_table[narrower_uri];

					//the broader belongs to the tree
					if (broader_concept.standAlone==false){
					
						if(existing_concept!=undefined){	

							narrower_concept = existing_concept;
		
							if(narrower_concept.broader==broader_concept){
								continue;
							}	
					
							if(narrower_concept.standAlone==true){

								narrower_concept.broader = broader_concept;
								broader_concept.children.push(narrower_concept);
								narrower_concept.standAlone = false;
							}
							else{  //the concept uri exists but it is for another branch, so I create a new concept 
			
								narrower_concept = new Concept(narrower_uri);
								var narrower_label = results[i].label();
								if (narrower_label!=undefined){
									narrower_concept.prefLabel = narrower_label[0];
									narrower_concept.label = narrower_concept.prefLabel;
								}
								var number = existing_concept.occurences + 1;
								existing_concept.occurences  = existing_concept.occurences + 1;
								var id = narrower_uri + "_" + number;
								narrower_concept.id = id;
								ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id]=narrower_concept;

								narrower_concept.broader = broader_concept;
								broader_concept.children.push(narrower_concept);
					

							}
							

						}
						else{  //the concept does not exist

							//create new concept
							narrower_concept = new Concept(narrower_uri);
							var narrower_label = results[i].label();
							if (narrower_label!=undefined){
								narrower_concept.prefLabel = narrower_label[0];
								narrower_concept.label = narrower_concept.prefLabel;
							}
							narrower_concept.id = narrower_uri;
							ontologyBrowser.skosOntologies.hash_table[narrower_uri]=narrower_concept;
							ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id]=narrower_concept;
							ontologyBrowser.skosOntologies.hashTable_GiSem[narrower_uri]=results[i];

							narrower_concept.broader = broader_concept;
							broader_concept.children.push(narrower_concept);

						}

					}
					else{  //the broader does not belong to the tree


						if(existing_concept!=undefined){	

							narrower_concept = existing_concept;
		
							if(narrower_concept.broader==broader_concept){
								continue;
							}	
					
							if(narrower_concept.standAlone==true){

								narrower_concept.broader = broader_concept;
								broader_concept.children.push(narrower_concept);
							}
							else{  //the concept uri exists but it is for another branch, so I create a new concept 
			
								narrower_concept = new Concept(narrower_uri);
								var narrower_label = results[i].label();
								if (narrower_label!=undefined){
									narrower_concept.prefLabel = narrower_label[0];
									narrower_concept.label = narrower_concept.prefLabel;
								}
								narrower_concept.standAlone=true;
								var number = existing_concept.occurences + 1;
								existing_concept.occurences  = existing_concept.occurences + 1;
								var id = narrower_uri + "_" + number;
								narrower_concept.id = id;
								ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id]=narrower_concept;

								narrower_concept.broader = broader_concept;
								broader_concept.children.push(narrower_concept);

							}
							

						}
						else{  //the concept does not exist

							//create new concept
							narrower_concept = new Concept(narrower_uri);
							var narrower_label = results[i].label();
							if (narrower_label!=undefined){
								narrower_concept.prefLabel = narrower_label[0];
								narrower_concept.label = narrower_concept.prefLabel;
							}
							narrower_concept.id = narrower_uri;
							narrower_concept.standAlone=true;
							ontologyBrowser.skosOntologies.hash_table[narrower_uri]=narrower_concept;
							ontologyBrowser.skosOntologies.hash_table_ids[narrower_concept.id]=narrower_concept;
							ontologyBrowser.skosOntologies.hashTable_GiSem[narrower_uri]=results[i];

							narrower_concept.broader = broader_concept;
							broader_concept.children.push(narrower_concept);


						}

					}

				}	
		
			}


			broader_concept.children.sort(sortOn("label"));		

			for (var i=0; i<broader_concept.children.length; i++){

				var narrower_concept = broader_concept.children[i];
				//this means that this concept is not yet part of the tree, so the following code must not be executed
				if (broader_concept.standAlone==false){
			
					addSubTree(broader_concept, narrower_concept);					
				}
	
			}


			if (display==true || document.getElementById('narrower_term').innerHTML==LOADING){

				if (click_event_id == broader_concept.id){

					displayNarrowerConcepts(broader_concept, ontologyBrowser.skosOntologies.serverRequests);

				}
			}

		}

	}

	this.narrowerConcepts = NarrowerConcepts;

	this.broaderConcepts = function(narrower_concept){

		return function(results, error){

			if(error){
	       			alert('[Broader Terms] Error occurred: '+ error);
	       			return;
	  		 }
			
			//if the narrower is part of the tree,
			//then this function should not be called
			if(narrower_concept.standAlone==false ){
				alert("Extend broader [1]: Something went wrong..");
				return;
			}

			var broader_concept;
			
			for (var i=0; i<results.length; i++){

				var broader_uri = results[i].uri();
				if(broader_uri!=narrower_concept.uri){
				
					var existing_concept = ontologyBrowser.skosOntologies.hash_table[broader_uri];
					if(existing_concept!=undefined){

						broader_concept = existing_concept;
								
						//the broader belongs to the tree
						if(broader_concept.standAlone==false){

							if(broader_concept.children.length==0){
								alert("Extend broader [2]: Something went wrong..");
								return;
							}

							if(broader_concept.children[0].label == loading_child){
				
								removeFakeChild(broader_concept);
							}
						}

					}
					else{

						broader_concept = new Concept(broader_uri);
						var broader_label = results[i].label();
						if (broader_label!=undefined){
							broader_concept.prefLabel = broader_label[0];
							broader_concept.label = broader_concept.prefLabel;
						}
						
						broader_concept.id = broader_uri;
						broader_concept.standAlone = true;
						
						ontologyBrowser.skosOntologies.hash_table[broader_uri]=broader_concept;
						ontologyBrowser.skosOntologies.hash_table_ids[broader_concept.id]=broader_concept;
						ontologyBrowser.skosOntologies.hashTable_GiSem[broader_uri]=results[i];

					}

					//add the child
					broader_concept.children.push(narrower_concept);
					narrower_concept.broader = broader_concept;

				}
			
			}

			if(broader_concept.standAlone==false){

				//broader_concept.children.sort(sortOn("label"));
				addSubTree(broader_concept, narrower_concept);		

			}
		
			displayBroaderConcept(narrower_concept,  ontologyBrowser.skosOntologies.serverRequests);			

		}

	}

	this.topConcepts = function(results,error){

		if(error){
       			alert('[Top Concepts] Error occurred: '+ error);
       			return;
  		 }

		//alert("top concepts: " + results.length);

		for (var i=0; i<results.length; i++){

     			var con = results[i];

       			var uri = con.uri();   //string

			//if (uri.indexOf("GEOSS")!=-1)
			//	continue;

      			var label = con.label();     //array

			var concept = new Concept(uri);
			concept.id = concept.uri;
			if (label!=undefined){
				concept.prefLabel = label[0];
				//alert(JSON.stringify(results[i]));
				concept.label = concept.prefLabel;
			}

			concept.isTopConcept = true;
			
			ontologyBrowser.skosOntologies.top_concepts.push(concept);
			ontologyBrowser.skosOntologies.hash_table[concept.uri]=concept;
			ontologyBrowser.skosOntologies.hash_table_ids[concept.id]=concept;
			ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri]=results[i];

			if (con.maxExtensionSize(GIAPI.Relation.NARROWER)>0) {	
			
				var fake_child = new Object();
				fake_child.id = concept.id + "/fake_child";
				fake_child.label = loading_child;
				concept.children.push(fake_child);

			}
			else{
				concept.explored = true;
			}

    		}


		ontologyBrowser.skosOntologies.top_concepts.sort(sortOn("label"));
		document.dispatchEvent(ontologyBrowser.events.getTopConceptsEvent);

	}

	this.relatedConcepts = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Related Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayRelatedOf(concept);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){

					checkForThisConcept(uri, results[i], concept.related);
				}
							
			}

			if (click_event_id == concept.id)			
				displayRelatedOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}

	this.closeMatch = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Close Match Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayCloseMatchOf(concept);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){
					checkForThisConcept(uri, results[i], concept.closeMatch);
				}
							
			}

			if (click_event_id == concept.id)			
				displayCloseMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}

	this.relatedMatch = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Related Match Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayRelatedMatchOf(concept);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){
					checkForThisConcept(uri, results[i], concept.relatedMatch);
				}
							
			}

			if (click_event_id == concept.id)			
				displayRelatedMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}

	this.narrowMatch = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Narrow Match Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayNarrowMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){
					checkForThisConcept(uri, results[i], concept.narrowMatch);
				}
							
			}

			if (click_event_id == concept.id)
				displayNarrowMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}

	this.broadMatch = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Broad Match Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayBroadMatchOf(concept,  ontologyBrowser.skosOntologies.serverRequests);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){
					checkForThisConcept(uri, results[i], concept.broadMatch);
				}
							
			}

			if (click_event_id == concept.id)
				displayBroadMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}

	this.exactMatch = function(concept){

		return function(results, error){

			if(error){
	       			alert('[Exact Match Concepts] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayExactMatchOf(concept);
	       			return;
	  		 }

			for (var i=0; i<results.length; i++){

				var con = results[i];
				var uri = con.uri();

				if(uri!=concept.uri){
					checkForThisConcept(uri, results[i], concept.exactMatch);
				}
							
			}

			if (click_event_id == concept.id)
				displayExactMatchOf(concept, ontologyBrowser.skosOntologies.serverRequests);

		}

	}


	this.altLabel = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Alt Label] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayAltLabelOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayAltLabelOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.altLabel.push(property.values[i]);

			}
	
			if (click_event_id == concept.id)
				displayAltLabelOf(concept);
		}
		

	}

	this.hiddenLabel = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Hidden Label] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayHiddenLabelOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayHiddenLabelOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.hiddenLabel.push(property.values[i]);

			}
	
			if (click_event_id == concept.id)
				displayHiddenLabelOf(concept);
		}
		

	}

	this.scopeNote = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Scope Note] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayScopeNoteOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayScopeNoteOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.scopeNote.push(property.values[i]);

			}

			if (click_event_id == concept.id)
				displayScopeNoteOf(concept);
		}
		

	}

	this.changeNote = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Change Note] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayChangeNoteOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayChangeNoteOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.changeNote.push(property.values[i]);

			}

			if (click_event_id == concept.id)
				displayChangeNoteOf(concept);
		}
		

	}

	this.note = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Note] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayNoteOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayNoteOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.note.push(property.values[i]);

			}

			if (click_event_id == concept.id)
				displayNoteOf(concept);
		}
		

	}

	this.notation = function(concept){

		return function(property, error){

			if(error){
	       			alert('[Notation] Error occurred: '+ error);
				if (click_event_id == concept.id)
					displayNotationOf(concept);
	       			return;
	  		 }

			if (property==undefined){
				displayNotationOf(concept);
				return;
			}

			for (var i=0; i<property.values.length; i++){
				concept.notation.push(property.values[i]);

			}

			if (click_event_id == concept.id)
				displayNotationOf(concept);
		}
		

	}

	this.searchResults = function(searchResults){ 


		return function(results, error){

			if(error){
	       			alert('[Keyword Search] Error occurred: '+ error);
	       			return;
	  		 }


			searchResults.numOf_returned_results = results.length;
			
			//alert("returned results:" + searchResults.numOf_returned_results);

			for (var i=0; i<results.length; i++){

				var con = results[i];
	       		var uri = con.uri();   //string
	       			
	       			//console.log("Result " + con.label() );

				var existing_concept = ontologyBrowser.skosOntologies.hash_table[uri];
				//this concept hasn't been explored before
				if (existing_concept==undefined){

					var concept = new Concept(uri);
					concept.standAlone = true;
					concept.id = concept.uri;
					
					var label_array = con.label();
					var label = label_array[0];
					//alert("New concept: " + label);
					if (label!=undefined){
						concept.prefLabel = label;
						concept.label = concept.prefLabel;
					}

					ontologyBrowser.skosOntologies.hash_table[concept.uri]=concept;
					ontologyBrowser.skosOntologies.hash_table_ids[concept.id]=concept;
					ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri]=con;

					ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.push(concept);
						
				}
				else{

					//alert(existing_concept.label);
					ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.push(existing_concept);			
				}
		
			}

		//	ontologyBrowser.skosOntologies.serverRequests.searchResults.concepts.sort(sortOn("label"));
			ontologyBrowser.skosOntologies.serverRequests.searchResults.createPaginationWithSearchResults();
		

		}

	}

}


function GiSemRequests(ontologyBrowser){

	this.name = 'gisem';
	//this.url = 'http://development.eurogeoss-broker.eu/dab-api-demo';
	//this.url ='http://santoro.essi-lab.eu:8082/gi-cat/';
	//this.url = 'http://23.21.170.207/prodtreesDAB/';
	this.url = 'http://dev.essi-lab.eu/prodtreesDAB_v9/';
	//this.url = 'http://nike.essi-lab.eu/prodtreesDAB_v7/';
	this.dab = GIAPI.DAB(this.url);
	this.searchResults = new GiSemSearchResults(ontologyBrowser.skosOntologies);

        this.processResponse = new GiSemProcessResponse(ontologyBrowser);

	this.getTopConcepts = function(){

		var conceptReqOptions = {
			//Request all
			start : 1,
			count : -1,

			//Request top level only
			topLevel : true
		};

		//Get top concepts
		this.dab.concept('',this.processResponse.topConcepts, conceptReqOptions);
			
	}

	this.searchForKeyword = function (keyword){

		this.searchResults.keyword = keyword;

		//console.log("Psaxnw apo " + this.searchResults.start_index + " mexri " + this.searchResults.end_index);

		var conceptReqOptions = {
			start : this.searchResults.start_index,
			count : this.searchResults.end_index,
			topLevel : false
		};

		//Get concepts that their label or description contains this keyword
		this.dab.concept(keyword,this.processResponse.searchResults(this.searchResults), conceptReqOptions);

	}

	this.getSchemes = function(){

		console.log('Gi-Sem - getSchemes');	
	}

	this.getConcepts = function(){
	
		console.log('Gi-Sem - getConcepts');	
	}

	this.getNarrowerConcepts = function (broaderConcept, display){

		if (broaderConcept.explored==true)
			return;

		broaderConcept.explored = true;

		var options = {
			//Request all
			start : 1,
			count : -1,
		};

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[broaderConcept.uri];
		//alert("Epekteinw " + gisem_concept.label());
		gisem_concept.extend(this.processResponse.narrowerConcepts(broaderConcept , display),[GIAPI.Relation.NARROWER.value], options);

	}

	this.getBroaderConcepts = function (narrowerConcept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[narrowerConcept.uri];
		if (gisem_concept.maxExtensionSize(GIAPI.Relation.BROADER)>0){
		
			gisem_concept.extend(this.processResponse.broaderConcepts(narrowerConcept),[GIAPI.Relation.BROADER.value]);
		}

	}

	this.getDefinitionOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		var def = gisem_concept.description();
		if (def!=undefined){
			concept.definition = def[0];
		}

		displayDefinitionOf(concept);
	}


	this.getRelatedOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.relatedConcepts(concept ),[GIAPI.Relation.RELATED.value]);

	}

	this.getCloseMatchOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.closeMatch(concept ),[GIAPI.Relation.CLOSE_MATCH.value]);

	}

	this.getRelatedMatchOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.relatedMatch(concept ),[GIAPI.Relation.RELATED_MATCH.value]);

	}

	this.getNarrowMatchOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.narrowMatch(concept ),[GIAPI.Relation.NARROW_MATCH.value]);

	}

	this.getBroadMatchOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.broadMatch(concept ),[GIAPI.Relation.BROAD_MATCH.value]);

	}


	this.getExactMatchOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.extend(this.processResponse.exactMatch(concept ),[GIAPI.Relation.EXACT_MATCH.value]);

	}

	this.getAltLabelOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.altLabel(concept), GIAPI.PropertyName.ALT_LABEL);

	}

	this.getHiddenLabelOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.hiddenLabel(concept), "skos%3AhiddenLabel");

	}

	this.getScopeNoteOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.scopeNote(concept), GIAPI.PropertyName.SCOPE_NOTE);

	}

	this.getChangeNoteOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.changeNote(concept), GIAPI.PropertyName.CHANGE_NOTE);

	}

	this.getNoteOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.note(concept), GIAPI.PropertyName.NOTE);

	}

	this.getNotationOf = function(concept){

		var gisem_concept = ontologyBrowser.skosOntologies.hashTable_GiSem[concept.uri];
		gisem_concept.property(this.processResponse.notation(concept), GIAPI.PropertyName.NOTATION);

	}		

	this.getConceptInfo = function(concept){

		concept.hasInfo = true;

		this.displayLoading();

		this.getDefinitionOf(concept);
		this.getAltLabelOf(concept);
		this.getHiddenLabelOf(concept);
		this.getRelatedOf(concept);
		this.getNotationOf(concept);
		
		this.getNoteOf(concept);
		this.getChangeNoteOf(concept);
		this.getScopeNoteOf(concept);
		this.getNarrowMatchOf(concept);
		this.getBroadMatchOf(concept);
		this.getExactMatchOf(concept);
		this.getRelatedMatchOf(concept);
		this.getCloseMatchOf(concept);
	
	}

	this.displayLoading = function(){

		document.getElementById('relatedTerms').innerHTML=LOADING;
		document.getElementById('notation').innerHTML=LOADING;
		document.getElementById('note').innerHTML=LOADING;
		document.getElementById('changeNote').innerHTML=LOADING;
		document.getElementById('scopeNote').innerHTML=LOADING;
		document.getElementById('narrowMatch').innerHTML=LOADING;
		document.getElementById('broadMatch').innerHTML=LOADING;
		document.getElementById('exactMatch').innerHTML=LOADING;
		document.getElementById('relatedMatch').innerHTML=LOADING;
		document.getElementById('closeMatch').innerHTML=LOADING;
		document.getElementById('altLabel').innerHTML=LOADING;

	}
}
