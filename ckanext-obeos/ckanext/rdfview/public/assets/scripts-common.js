window.ViewerCommon = window.ViewerCommon || {}

// Remove all the blanknodes from the store that are no bound to children
ViewerCommon.removeUnboundBlankNodes = function(store) {
  if(store)
  {
    var all_triples = store.find(null, null, null);
    all_triples.forEach(function(triple) {
      if( N3.Util.isBlank(triple.object) ){
        blankNode = triple.object;
        var all_triples_with_blank_as_subject = store.find(blankNode, null, null);
        // Remove the blank node from the store if it has no children
        if(all_triples_with_blank_as_subject.length == 0){
          console.debug("Removing unbound anonymous node:"+blankNode)
          store.removeTriple(triple);
        }
      }
  });

  }
}
