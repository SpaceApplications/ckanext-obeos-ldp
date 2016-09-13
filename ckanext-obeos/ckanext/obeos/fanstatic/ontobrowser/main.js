var ServerRequestsFactory = {

  makeServerRequests: function(feature, ontologyBrowser) {

    switch(feature) {
      case 'strabon':
        return new StrabonRequests(ontologyBrowser);
      case 'gi_sem':
        return new GiSemRequests(ontologyBrowser);
      break;
    }
  }
}


function main() {

  var ontologyBrowser = new OntologyBrowser();
  ontologyBrowser.addHandlers(ontologyBrowser.skosOntologies);
  browser = ontologyBrowser;

  //var serverRequests = ServerRequestsFactory.makeServerRequests('gi_sem', ontologyBrowser);
  var serverRequests = ServerRequestsFactory.makeServerRequests('strabon', ontologyBrowser);
  ontologyBrowser.setServerRequests(serverRequests);

  serverRequests.getTopConcepts();
}

main();

