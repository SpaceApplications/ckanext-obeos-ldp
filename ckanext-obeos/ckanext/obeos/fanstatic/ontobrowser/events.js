function Events(skosOntologies){

	this.getTopConceptsEvent = new CustomEvent('getTopConcepts');
	this.openSelectedBranchEvent = new CustomEvent('openSelectedBranch');


	this.setServerRequests = function(serverRequests){

		this.getTopConceptsEvent.serverRequests = serverRequests;


	}

	//Top Concepts event
	this.getTopConceptsEventHandler = function(e){

		skosOntologies.discoverOntologies();

		e.serverRequests.getSchemes();
		
		$('#tree').tree({
		    data: skosOntologies.ontologies_array[0].topConcepts_array
		});

		$('#tree').bind('tree.click', function(event) {
			var node = event.node;
			click_event_id = node.id;
			var concept = skosOntologies.hash_table_ids[node.id];

			displaySelectedConcept(concept, e.serverRequests);
		    }
		);

		$('#tree').bind('tree.open', function(tree_event) {

			var node = tree_event.node;
			var concept = skosOntologies.hash_table_ids[node.id];
			e.serverRequests.getNarrowerConcepts(concept);

    		    }
		);

	}

	document.addEventListener('getTopConcepts',this.getTopConceptsEventHandler,false);


	//Open selected branch event
	this.openSelectedBranchEventHandler = function(e){

		//current tab is the "concepts" tab
		if(document.getElementById("tab-Concepts").style.display == 'block'){

			var node = $('#tree').tree('getSelectedNode');
			if (node!=false){
				$('#tree').tree('removeFromSelection', node);

				var newNode = $('#tree').tree('getNodeById', selectedConcept.id);
				if (newNode!=false){
					$('#tree').tree('selectNode', newNode);
				}

				$('#tree').tree('openNode', node);
			}

		}
		else
			return;
	}

	document.addEventListener('openSelectedBranch',this.openSelectedBranchEventHandler,false);


}
