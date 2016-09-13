// Enable JavaScript's strict mode. Strict mode catches some common
// programming errors and throws exceptions, prevents some unsafe actions from
// being taken, and disables some confusing and bad JavaScript features.
"use strict";

var selectedConcepts = new Concepts();

var insert_selected_concept = function(event) {
  var concept = selectedConcept;
  console.debug('Insert selected concept:', concept);

  if (concept == undefined || concept == null) {
    return;
  }

  //console.debug("Selected concepts:", selectedConcepts);

  if (selectedConcepts.contains(concept.label)) {
     console.debug("Concept already selected. Skipping.");
     return;
  }

  var input = $(".search-giant input[name=q]");

  if (input == undefined || input == null) {
     console.err("Input field not found in search form");
     return;
  }

  // Insert the selected concept in the query string
  if (concept.label.indexOf(' ') != -1) {
    input.val(input.val().trim(' ')+' "'+concept.label+'"');
  } else {
    input.val(input.val().trim(' ')+' '+concept.label);
  }
  input.val(input.val().trim(' '));

  // Remember the newly selected concept
  selectedConcepts.add(concept2JSON(concept));
} 

function getFirstInArray(input) {
    if (Array.isArray(input)) {
        if (input.length > 0) {
            return input[0];
        } else {
            return undefined;
        }
    }
    return input;
}

function getLength(input) {
    if (input == undefined || input == null) {
       return 0;
    }
    return input.length;
}

function concept2JSON (concept, type) {
    
    console.log('concept2JSON ('+type+')', concept);
    
    var ontologyNamespaces = {
        'http://www.earthobservations.org/GEOSS' : 'GEOSS',
        'http://thesauri.esa.int/MultiDomain_Thesaurus' : 'CSCDA',
        'http://gcmdservices.gsfc.nasa.gov/kms' : 'GCMD',
        'http://www.eionet.europa.eu/gemet' : 'GEMET'
    };
    
    if (concept == undefined || concept == null || concept == []) {
        return null;
    }
    
    var res = {
        'id': concept.id,
        'uri': concept.uri,
        'label': getFirstInArray(concept.label),
        'prefLabel': getFirstInArray(concept.prefLabel),
        'altLabel': concept.altLabel,
        
        'definition': concept.definition,
        'notation': concept.notation, 
        
        'broader': concept2JSON(concept.broader, "broader"),
        //'children': concept.children,     //concepts - narrower_array, concept name must not be changed
        //'related': concept.related, // = []
        //'inScheme': concept.inScheme,      //scheme
        
        'note': concept.note,                   //string
        'changeNote': concept.changeNote,       //string
        'scopeNote':  concept.scopeNote,        //string

        'broadMatch':   [],      //string (uri)
        'narrowMatch':  [],      //string (uri)
        'exactMatch':   [],      //string (uri)
        'relatedMatch': [],      //string (uri)
        'closeMatch':   [],      //string (uri)
        
        'ontologyName' : '',
        'ontologyNamespace' : '',
        
        'explored': concept.explored,
        'hasInfo': concept.hasInfo,
        
        'occurrences': concept.occurences
    };
    
    for (var idx = 0; idx < getLength(concept.exactMatch); idx++) {
        res.exactMatch[idx] = concept2JSON(concept.exactMatch[idx], "exact match");
    }
    
    for (var idx = 0; idx < getLength(concept.broadMatch); idx++) {
        res.broadMatch[idx] = concept2JSON(concept.broadMatch[idx], "broad match");
    }
    
    for (var idx = 0; idx < getLength(concept.narrowMatch); idx++) {
        res.narrowMatch[idx] = concept2JSON(concept.narrowMatch[idx], "narrow match");
    }
    
    for (var idx = 0; idx < getLength(concept.relatedMatch); idx++) {
        res.relatedMatch[idx] = concept2JSON(concept.relatedMatch[idx], "related match");
    }
    
    for (var idx = 0; idx < getLength(concept.closeMatch); idx++) {
        res.closeMatch[idx] = concept2JSON(concept.closeMatch[idx], "close match");
    }
    
    if (concept.ontology && concept.ontology.namespace) {
        res['ontologyNamespace'] = concept.ontology.namespace;
        if (ontologyNamespaces[concept.ontology.namespace] != undefined) {
            res['ontologyName'] = ontologyNamespaces[concept.ontology.namespace];
        }
    } else if (concept.id) {
        // Try to identify the ontology using the concept ID
        var prefix = concept.id.substring(0, concept.id.lastIndexOf('/'));
        console.debug("Concept ID prefix: "+prefix);
        if (ontologyNamespaces[prefix] != undefined) {
            res['ontologyNamespace'] = prefix;
            res['ontologyName'] = ontologyNamespaces[prefix];
        } else {
            res['ontologyNamespace'] = null;
            res['ontologyName'] = null;
            
            for (var namespace in ontologyNamespaces) {
                if (ontologyNamespaces.hasOwnProperty(namespace)) {
                    if (concept.uri.startsWith(namespace)) {
                        console.log("Found ontology for concept: "+concept.uri+" => "+ontologyNamespaces[namespace]);
                        res['ontologyNamespace'] = namespace;
                        res['ontologyName'] = ontologyNamespaces[namespace];
                        break;
                    }
                }
            }
        }
    }
    
    return res;
}

ckan.module('obeos_cross_ontology_browser', function ($, _) {
  return {
    initialize: function () {
      //$.proxyAll(this, /_on/);

      $("#add-to-search-button").on("click", insert_selected_concept);

      console.log("Module 'obeos_cross_ontology_browser' initialized with element: ", this.el);
    },

/*    _onClick: function(event) {
        console.log("Clicked!", event);
        $("#obeos-ontobrowser-module").toggle(400);
        //$("#obeos-ontobrowser-module").toggle("blind", {}, 400);
      //$("#obeos-ontobrowser-container").hide();
      //this.el.hide();
      //this.el.on("click", this._onClick);
        event.preventDefault();
        event.stopPropagation();
        return false;
    } */
  }
});