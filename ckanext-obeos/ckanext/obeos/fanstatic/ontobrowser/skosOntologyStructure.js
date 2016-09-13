//All classes that represent skos ontologies

function Concept(uri){

	this.uri = uri;

	this.prefLabel = undefined;     //string
	this.altLabel = [];		//array of strings
	this.hiddenLabel = [];		//array of strings

	this.definition = undefined;
	this.notation = [];	

	this.broader = undefined; 		//concept
	this.children = [];		//concepts - narrower_array, this name must not be changed

	this.related = [];			//concepts
	this.inScheme = undefined; 		//scheme
	
	//this.closeMatch = undefined;	//concept
	//this.exactMatch = undefined;	//concept

	this.note = [];			//string
	this.changeNote = [];		//string
	this.scopeNote = [];		//string

	this.narrowMatch = [];		//concept
	this.broadMatch = [];		//concept
	this.exactMatch = [];		//concept
	this.relatedMatch = [];		//concept
	this.closeMatch = [];		//concept

	this.ontology = undefined;
	//data needed for tree structure
	this.id = undefined;
	this.label = undefined;

	this.explored = false;
	this.isTopConcept = false;
	this.hasInfo = false;

	this.occurences = 1;
	this.standAlone = false;   //shows if this concept is a part of the tree hierarchy
}

function Scheme(uri){

	this.uri = uri;
	this.topConcepts_array = [];

	this.getLabel = function(){
	
		var index = this.uri.lastIndexOf("/");
		
		return this.uri.substring(index+1);
	}

	this.label = this.getLabel();

}

function Collection(uri){

	this.uri = uri;
	this.members_array = [];  	//sub-collection (ex. Supergroup) or concepts

}

function Ontology(namespace){

	this.namespace = namespace;
	this.topConcepts_array = [];
	this.schemes_array = [];

	this.getScheme = function (scheme_uri){

		for (var i=0; i<this.schemes_array.length; i++){
		
			if (scheme_uri == this.schemes_array[i].uri)
				return this.schemes_array[i];
		}

		return undefined;
	}

}


function SKOS_Ontologies(){

	this.ontologies_array = []; 	//array of ontologies
	this.uri_arrays   = [];

	this.top_concepts = [];        //concepts
	this.hash_table	  = {};		//all concepts  (map one concept uri to the concept(object)) - not unique uris
	this.hashTable_GiSem = {};
	this.hash_table_ids = {};		//unique ids
		
	this.serverRequests = undefined;

	this.setServerRequests = function(ServerRequests){

		this.serverRequests = ServerRequests;

	}


	this.getNamespace = function (uri){

		var a = $('<a>', { href:uri } )[0];

   	 	var host = a.hostname;
    		var path = a.pathname;
   
		var sub1 = path.substring(1);
		var index = sub1.indexOf("/");
		var sub2 = sub1.substring(0,index);

		var namespace = "http://" + host + "/" + sub2;

		return namespace;

	}

	this.discoverOntologies = function(){
		
		for(var i=0; i<this.top_concepts.length; i++){

			var uri = this.top_concepts[i].uri;
			var namespace = this.getNamespace(uri);

			if (jQuery.inArray(namespace, this.uri_arrays) < 0 ) {
				this.uri_arrays.push(namespace);

				//alert("Namespace: " + namespace);

				var ontology = new Ontology(namespace);	
				ontology.topConcepts_array.push(this.top_concepts[i]);

				this.top_concepts[i].ontology = ontology;

				this.ontologies_array.push(ontology);

				addOntologyToListbox(namespace);
				
			}
			else{
				
				var pos = this.uri_arrays.indexOf(namespace);
				this.ontologies_array[pos].topConcepts_array.push(this.top_concepts[i]);
				this.top_concepts[i].ontology = this.ontologies_array[pos];
			}

		}

	}


	this.addSchemes = function(hash_table_schemes){

		for(var i=0; i<this.top_concepts.length; i++){
		
			var ontology = this.top_concepts[i].ontology;

			var concept_uri = this.top_concepts[i].uri;
			var scheme_uri = hash_table_schemes[concept_uri];
		
			if (scheme_uri==undefined){    //there is no concept scheme for this top concept

				continue;
			}

			var scheme;

			if (ontology.getScheme(scheme_uri) ==undefined ){     //the first time we meet this scheme
				scheme = new Scheme(scheme_uri);
				ontology.schemes_array.push(scheme);
			} 
			else{

				scheme = ontology.getScheme(scheme_uri);
			}
			
			scheme.topConcepts_array.push(this.top_concepts[i]);	

		}


		displaySchemes(this.ontologies_array[0].schemes_array, this);

	}	

}

function OntologyBrowser(){

	this.skosOntologies = new SKOS_Ontologies();
	this.events = new Events(this.skosOntologies);

	this.setServerRequests = function(serverRequests){

		this.events.setServerRequests(serverRequests);
		this.skosOntologies.setServerRequests(serverRequests);
	}


	this.addHandlers = function(skosOntologies){

		//ListBox
		var list_box = document.getElementById("ontologies-list-box");
		var func = function(){changeOntology(skosOntologies);};
		list_box.onchange =  func;

		

	}

	var changeOntology = function(skosOntologies){


		var list_box = document.getElementById("ontologies-list-box");
		var index= list_box.selectedIndex;

		//emptySchemeInfo();
		emptyConceptInfo();

		$('.nav-tabs li').removeClass('active'); 
		$('#general_info_tab').addClass('active');		

		$('#tree').tree('loadData', skosOntologies.ontologies_array[index].topConcepts_array);
		
		//displaySchemes(skosOntologies.ontologies_array[index].schemes_array, skosOntologies);

	}


}
