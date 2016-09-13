//Global variables
var selectedConcept = undefined;
//var LOADING = "loading...";
var LOADING = "<div id=\"fountainG\" style=\"padding-left: 100px;\"><div class=\"fountainG\" id=\"fountainG_1\"></div><div class=\"fountainG\" id=\"fountainG_2\"></div><div class=\"fountainG\" id=\"fountainG_3\"></div><div class=\"fountainG\" id=\"fountainG_4\"></div><div class=\"fountainG\" id=\"fountainG_5\"></div><div class=\"fountainG\" id=\"fountainG_6\"></div><div class=\"fountainG\" id=\"fountainG_7\"></div><div class=\"fountainG\" id=\"fountainG_8\"></div></div>";

var loading_child = "loading...";
var click_event_id = undefined;
var browser;
var conceptViewerCurrentState=undefined;
var conceptViewerPreviousState=undefined;
var selectedPageId=undefined;


function activateTab(pageId) {

    click_event_id=undefined;

    if (pageId=="tab-Concepts" && selectedPageId==undefined){
    return;
   }

   var tabCtrl = document.getElementById('tab-container');
   var pageToActivate = document.getElementById(pageId);
   for (var i = 0; i < tabCtrl.childNodes.length; i++) {
     var node = tabCtrl.childNodes[i];
     if (node.nodeType == 1) { /* Element */
       node.style.display = (node == pageToActivate) ? 'block' : 'none';
     }
   }

   if (pageId!=selectedPageId){
                  //GI-sem case
     if (document.getElementById('ontologies-list-box').disabled==false)
       document.getElementById('ontologies-list-box').disabled=true;
     else
       document.getElementById('ontologies-list-box').disabled=false;

     var previousState = conceptViewerCurrentState;

     displaySelectedConcept(conceptViewerPreviousState, browser.skosOntologies.serverRequests);

     conceptViewerPreviousState=previousState;

  }

  selectedPageId =  pageId;

}


function activateConceptViewerTab(pageId) {
  var tabCtrl = document.getElementById('tab-content');
  var pageToActivate = document.getElementById(pageId);
  for (var i = 0; i < tabCtrl.childNodes.length; i++) {
    var node = tabCtrl.childNodes[i];
    if (node.nodeType == 1) { /* Element */
      node.style.display = (node == pageToActivate) ? 'block' : 'none';
    }
  }
}

var removeLastPart = function(url) {
    var lastSlashIndex = url.lastIndexOf("/");
    if (lastSlashIndex > url.indexOf("/") + 1) { // if not in http://
        return url.substr(0, lastSlashIndex); // cut it off
    } else {
        return url;
    }
}

function sortOn(property){
    return function(a, b){
        if(a[property] < b[property]){
            return -1;
        }else if(a[property] > b[property]){
            return 1;
        }else{
            return 0;
        }
    }
}


function displayDefinitionOf(concept){

  if (concept.definition!=undefined)
    document.getElementById('definition').innerHTML=concept.definition;
  else{
    document.getElementById('definition').innerHTML="";
  }
}

function displayRelatedOf(concept, serverRequests){

  var html="";
  if (concept.related.length==1){

    if (concept.related[0].prefLabel==undefined)
      html= concept.related[0].uri;
    else
      html="<a id=\"related_concept_link_0\" href=\"javascript:void(0);\">" + concept.related[0].prefLabel + "</a>";

  }
  else if (concept.related.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.related.length; i++){
      var li;
      if (concept.related[i].prefLabel==undefined)
        li= "<li>" + concept.related[i].uri + "</li>";
      else
        li="<li><a id=\"related_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.related[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('relatedTerms').innerHTML=html;

  var related = [];
  for(var i=0; i<concept.related.length; i++){

    related.push(concept.related[i]);

    if (concept.related[i].prefLabel!=undefined){
      $( "#related_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = related[event.data.value].id;
        displaySelectedConcept(related[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayNotationOf(concept){

  var html="";
  if(concept.notation.length==1){

    html = concept.notation[0];
  }
  else if(concept.notation.length>1){
    html = "<ul>";
    for (var i=0; i<concept.notation.length; i++){
      var li = "<li>" + concept.notation[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('notation').innerHTML=html;
}

function displayNoteOf(concept){

  var html="";
  if(concept.note.length==1){

    html = concept.note[0];
  }
  else if(concept.note.length>1){
    html = "<ul>";
    for (var i=0; i<concept.note.length; i++){
      var li = "<li>" + concept.note[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('note').innerHTML=html;
}


function displayChangeNoteOf(concept){

  var html="";
  if(concept.changeNote.length==1){

    html = concept.changeNote[0];
  }
  else if(concept.changeNote.length>1){
    html = "<ul>";
    for (var i=0; i<concept.changeNote.length; i++){
      var li = "<li>" + concept.changeNote[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('changeNote').innerHTML=html;
}

function displayScopeNoteOf(concept){

  var html ="";
  if(concept.scopeNote.length==1){
    html = concept.scopeNote[0];
  }
  else if(concept.scopeNote.length>1){
    html = "<ul>";
    for (var i=0; i<concept.scopeNote.length; i++){
      var li = "<li>" + concept.scopeNote[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('scopeNote').innerHTML=html;
}

function displayNarrowMatchOf(concept, serverRequests){

  var html="";
  if (concept.narrowMatch.length==1){

    if (concept.narrowMatch[0].prefLabel==undefined)
      html= concept.narrowMatch[0].uri;
    else
      html="<a id=\"narrowMatch_concept_link_0\" href=\"javascript:void(0);\">" + concept.narrowMatch[0].prefLabel + "</a>";

  }
  else if (concept.narrowMatch.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.narrowMatch.length; i++){
      var li;
      if (concept.narrowMatch[i].prefLabel==undefined)
        li= "<li>" + concept.narrowMatch[i].uri + "</li>";
      else
        li="<li><a id=\"narrowMatch_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.narrowMatch[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('narrowMatch').innerHTML=html;

  var narrowMatch = [];
  for(var i=0; i<concept.narrowMatch.length; i++){

    narrowMatch.push(concept.narrowMatch[i]);

    if (concept.narrowMatch[i].prefLabel!=undefined){
      $( "#narrowMatch_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = narrowMatch[event.data.value].id;
        displaySelectedConcept(narrowMatch[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayBroadMatchOf(concept, serverRequests){

  var html="";
  if (concept.broadMatch.length==1){

    if (concept.broadMatch[0].prefLabel==undefined)
      html= concept.broadMatch[0].uri;
    else
      html="<a id=\"broadMatch_concept_link_0\" href=\"javascript:void(0);\">" + concept.broadMatch[0].prefLabel + "</a>";

  }
  else if (concept.broadMatch.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.broadMatch.length; i++){
      var li;
      if (concept.broadMatch[i].prefLabel==undefined)
        li= "<li>" + concept.broadMatch[i].uri + "</li>";
      else
        li="<li><a id=\"broadMatch_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.broadMatch[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('broadMatch').innerHTML=html;

  var broadMatch = [];
  for(var i=0; i<concept.broadMatch.length; i++){

    broadMatch.push(concept.broadMatch[i]);

    if (concept.broadMatch[i].prefLabel!=undefined){
      $( "#broadMatch_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = broadMatch[event.data.value].id;
        displaySelectedConcept(broadMatch[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayExactMatchOf(concept, serverRequests){

  /*var html="";
  if (concept.exactMatch.length==1){

    html=concept.exactMatch[0];
  }
  else if(concept.exactMatch.length>1){
    html = "<ul>";
    for (var i=0; i<concept.exactMatch.length; i++){
      var li = "<li>" + concept.exactMatch[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('exactMatch').innerHTML=html;*/

  var html="";
  if (concept.exactMatch.length==1){

    if (concept.exactMatch[0].prefLabel==undefined)
      html= concept.exactMatch[0].uri;
    else
      html="<a id=\"exactMatch_concept_link_0\" href=\"javascript:void(0);\">" + concept.exactMatch[0].prefLabel + "</a>";

  }
  else if (concept.exactMatch.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.exactMatch.length; i++){
      var li;
      if (concept.exactMatch[i].prefLabel==undefined)
        li= "<li>" + concept.exactMatch[i].uri + "</li>";
      else
        li="<li><a id=\"exactMatch_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.exactMatch[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('exactMatch').innerHTML=html;

  var exactMatch = [];
  for(var i=0; i<concept.exactMatch.length; i++){

    exactMatch.push(concept.exactMatch[i]);

    if (concept.exactMatch[i].prefLabel!=undefined){
      $( "#exactMatch_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = exactMatch[event.data.value].id;
        displaySelectedConcept(exactMatch[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayRelatedMatchOf(concept){

  var html="";
  if (concept.relatedMatch.length==1){

    if (concept.relatedMatch[0].prefLabel==undefined)
      html= concept.relatedMatch[0].uri;
    else
      html="<a id=\"relatedMatch_concept_link_0\" href=\"javascript:void(0);\">" + concept.relatedMatch[0].prefLabel + "</a>";

  }
  else if (concept.relatedMatch.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.relatedMatch.length; i++){
      var li;
      if (concept.relatedMatch[i].prefLabel==undefined)
        li= "<li>" + concept.relatedMatch[i].uri + "</li>";
      else
        li="<li><a id=\"relatedMatch_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.relatedMatch[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('relatedMatch').innerHTML=html;

  var relatedMatch = [];
  for(var i=0; i<concept.relatedMatch.length; i++){

    relatedMatch.push(concept.relatedMatch[i]);

    if (concept.relatedMatch[i].prefLabel!=undefined){
      $( "#relatedMatch_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = relatedMatch[event.data.value].id;
        displaySelectedConcept(relatedMatch[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayCloseMatchOf(concept){

  var html="";
  if (concept.closeMatch.length==1){

    if (concept.closeMatch[0].prefLabel==undefined)
      html= concept.closeMatch[0].uri;
    else
      html="<a id=\"closeMatch_concept_link_0\" href=\"javascript:void(0);\">" + concept.closeMatch[0].prefLabel + "</a>";

  }
  else if (concept.closeMatch.length>1) {
    html = "<ul>";
    for (var i=0; i<concept.closeMatch.length; i++){
      var li;
      if (concept.closeMatch[i].prefLabel==undefined)
        li= "<li>" + concept.closeMatch[i].uri + "</li>";
      else
        li="<li><a id=\"closeMatch_concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.closeMatch[i].prefLabel + "</a></li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('closeMatch').innerHTML=html;

  var closeMatch = [];
  for(var i=0; i<concept.closeMatch.length; i++){

    closeMatch.push(concept.closeMatch[i]);

    if (concept.closeMatch[i].prefLabel!=undefined){
      $( "#closeMatch_concept_link_" + i).on( "click", { value: i }, function( event ) {
        click_event_id = closeMatch[event.data.value].id;
        displaySelectedConcept(closeMatch[event.data.value], serverRequests);
        removeFromSelection();
      });
    }

  }
}

function displayAltLabelOf(concept){

  var html="";
  if (concept.altLabel.length==1){
    html = concept.altLabel[0];
  }
  else if (concept.altLabel.length>1){
    html = "<ul>";
    for (var i=0; i<concept.altLabel.length; i++){
      var li = "<li>" + concept.altLabel[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('altLabel').innerHTML=html;
}

function displayHiddenLabelOf(concept){

  var html="";
  if (concept.hiddenLabel.length==1){
    html = concept.hiddenLabel[0];
  }
  else if (concept.hiddenLabel.length>1){
    html = "<ul>";
    for (var i=0; i<concept.hiddenLabel.length; i++){
      var li = "<li>" + concept.hiddenLabel[i] + "</li>";
      html +=  li;
    }
    html = html + "</ul>";
  }
  document.getElementById('hiddenLabel').innerHTML=html;
}

function displayConceptInfo(concept, serverRequests){

  displayDefinitionOf(concept);
  displayRelatedOf(concept, serverRequests);
  displayNotationOf(concept);
  displayAltLabelOf(concept);
  displayHiddenLabelOf(concept);
  displayNoteOf(concept);
  displayChangeNoteOf(concept);
  displayScopeNoteOf(concept);
  displayNarrowMatchOf(concept, serverRequests);
  displayBroadMatchOf(concept, serverRequests);
  displayExactMatchOf(concept, serverRequests);
  displayRelatedMatchOf(concept, serverRequests);
  displayCloseMatchOf(concept, serverRequests);
}

function emptyConceptInfo(){

  document.getElementById('concept-id').innerHTML="";
  document.getElementById('prefLabel').innerHTML="";
  document.getElementById('concept_uri').innerHTML="";
  document.getElementById('broader_term').innerHTML="";
  document.getElementById('narrower_term').innerHTML="";

  document.getElementById('definition').innerHTML="";
  document.getElementById('relatedTerms').innerHTML="";
  document.getElementById('notation').innerHTML="";
  document.getElementById('note').innerHTML="";
  document.getElementById('changeNote').innerHTML="";
  document.getElementById('scopeNote').innerHTML="";
  document.getElementById('narrowMatch').innerHTML="";
  document.getElementById('broadMatch').innerHTML="";
  document.getElementById('exactMatch').innerHTML="";
  document.getElementById('relatedMatch').innerHTML="";
  document.getElementById('closeMatch').innerHTML="";
  document.getElementById('altLabel').innerHTML="";
  document.getElementById('hiddenLabel').innerHTML="";

  conceptViewerCurrentState=undefined;
}


function removeFromSelection(){

  //current tab is the "concepts" tab
  if(document.getElementById("tab-Concepts").style.display == 'block'){
    var node = $('#tree').tree('getSelectedNode');
    if (node!=false)
      $('#tree').tree('removeFromSelection', node);
  } //current tab is the "keyword search" tab
  else
    $('#search-results-list li').removeClass('active'); // remove active class

}


function displayNarrowerConcepts(concept, serverRequests){

  var html = "<ul>";
  for (var i=0; i<concept.children.length; i++){
    var li = "<li><a id=\"concept_link_" + i +"\" href=\"javascript:void(0);\">" + concept.children[i].prefLabel + "</a></li>";
    html +=  li;
  }
  html = html + "</ul>";
  document.getElementById('narrower_term').innerHTML=html;

  var childs = [];
  for(var i=0; i<concept.children.length; i++){

    childs.push(concept.children[i]);

    $( "#concept_link_" + i).on( "click", { value: i }, function( event ) {
      click_event_id = childs[event.data.value].id;
      displaySelectedConcept(childs[event.data.value], serverRequests);
      document.dispatchEvent(browser.events.openSelectedBranchEvent);
    });

  }
}

function displayBroaderConcept(concept, serverRequests){

  var broader = concept.broader;
  if(broader){  // debug
    document.getElementById('broader_term').innerHTML="<a id=\"concept_link\" href=\"javascript:void(0);\">" + broader.prefLabel + "</a>";

    var a = document.getElementById("concept_link");
    a.onclick = function(){
      click_event_id = broader.id;
      displaySelectedConcept(broader, serverRequests);
      removeFromSelection();
      var broaderNode = $('#tree').tree('getNodeById', broader.id);
      if (broaderNode!=false){
        $('#tree').tree('selectNode', broaderNode);
      }
    };
  }

}

function displayGeneralInfoTab(){

  $('.nav-tabs li').removeClass('active'); // remove active class from tabs
  $('#general_info_tab').addClass('active');

  activateConceptViewerTab('main');

}

function displaySelectedConcept(concept, serverRequests){

  if(concept==undefined){
    emptyConceptInfo();
    return;
  }

  displayGeneralInfoTab();

  selectedConcept = concept;
  document.getElementById('add-to-search-button').innerHTML="<button>Add to search</button>";

  //Label
  document.getElementById('concept-id').innerHTML=concept.prefLabel;
  document.getElementById('prefLabel').innerHTML=concept.prefLabel;

  //URI
  document.getElementById('concept_uri').innerHTML=concept.uri;

  //Broader
  if (concept.isTopConcept){
    document.getElementById('broader_term').innerHTML="<b>Top Concept</b>";
  }
  else if(concept.broader==undefined){
    //document.getElementById('broader_term').innerHTML=LOADING;   //Matt: Removed this loader because its hidding the result
    //serverRequests.getBroaderConcepts(concept);
    displayBroaderConcept(concept, serverRequests);  //DEBUG
  }
  else{
    displayBroaderConcept(concept, serverRequests);
  }

  //Narrower
  /*Only for Gi-sem case*/
  if (concept.children.length==0){

    var gisem_concept = browser.skosOntologies.hashTable_GiSem[concept.uri];
    if(gisem_concept){
      if (gisem_concept.maxExtensionSize(GIAPI.Relation.NARROWER)>0){
        serverRequests.getNarrowerConcepts(concept, true);
      }
    }
    else
      document.getElementById('narrower_term').innerHTML="";

  }
  else if(concept.children.length==1){
    if (concept.children[0].label==loading_child)
      document.getElementById('narrower_term').innerHTML=LOADING;
    else
      displayNarrowerConcepts(concept, serverRequests);

  }
  else{ //if there are no children, then nothing will be displayed, I need to call this
    // to remove any previous children

    displayNarrowerConcepts(concept, serverRequests);
  }

  if (concept.explored==false){
    //document.getElementById('narrower_term').innerHTML=LOADING;     //Matt: Removed this loader because its hidding the result
    serverRequests.getNarrowerConcepts(concept, true);

  }

  if (concept.hasInfo==false)
    serverRequests.getConceptInfo(concept);
  else{
    displayConceptInfo(concept, serverRequests);
  }

  conceptViewerCurrentState=concept;

}

function addOntologyToListbox(namespace){

  var list_box = document.getElementById("ontologies-list-box");

      var option = document.createElement("option");
  option.text = namespace;
  option.value = namespace;

   try {
        list_box.add(option, null); //Standard
      }catch(error) {
          list_box.add(option); // IE only
      }
}


function displaySchemes(schemes_array, skosOntologies){

  var html = "<ul>";

  for (var i=0; i<schemes_array.length; i++){

    html+="<li>" + schemes_array[i].label + "</li>";


  }
  html+="</ul>";

  //alert(html);

  document.getElementById('schemes-list').innerHTML=html;

  //Schemes
  $('#schemes-list li').on('click',  { skosOnto: skosOntologies }, function(event) {

    var scheme_label = $( this ).text() ;
    for (var i=0; i<schemes_array.length; i++){

      if (scheme_label==schemes_array[i].label)
        displaySchemeInfo(schemes_array[i], event.data.skosOnto);

    }
  });
}


function displaySchemeInfo(scheme, skosOntologies){

  document.getElementById('scheme-id').innerHTML=scheme.label;
  document.getElementById('scheme-uri').innerHTML=scheme.uri;

  /*$('#concepts-tree').tree({
        data: scheme.topConcepts_array
    });*/

  $('#concepts-tree').tree('loadData', scheme.topConcepts_array);

  $('#concepts-tree').bind('tree.open',  { skosOnto: skosOntologies }, function(tree_event) {

    var node = tree_event.node;
    var concept = tree_event.data.skosOnto.hash_table_ids[node.id];
    tree_event.data.skosOnto.serverRequests.getNarrowerConcepts(concept);

          }
  );

}

function emptySchemeInfo(){

  document.getElementById('scheme-id').innerHTML="";
  document.getElementById('scheme-uri').innerHTML="";
  $('#concepts-tree').tree('loadData', []);

}

function displayLoadingAnimation(boolean){

  var animation = document.getElementById("loading_animation");

  if (boolean ==true)
    animation.style.display = "block";
  else if(boolean == false)
    animation.style.display = "none";
}

$(document).ready(function(){

  $('.nav-tabs li').on('click', function(event) {
    $('.nav-tabs li').removeClass('active'); // remove active class from tabs
    $(this).addClass('active'); // add active class to clicked tab
  });

  $('#navigation li').on('click', function(event) {
    $('#navigation li').removeClass('active'); // remove active class from tabs
    $(this).addClass('active'); // add active class to clicked tab
  });

  $('#add-to-search-button').on('click', function(event) {

    //alert("The concept \"" +  selectedConcept.prefLabel + "\" added to search query.");
  });

  $('#keyword-search-button').on('click', function(event) {

    document.getElementById('search-button').disabled=true;
    document.getElementById('search-results-list').innerHTML = "";

    //Remove all the previous results
    if(browser.skosOntologies.serverRequests.searchResults && browser.skosOntologies.serverRequests.searchResults.concepts)
      browser.skosOntologies.serverRequests.searchResults.concepts = [];

    browser.skosOntologies.serverRequests.searchResults.initializeSearchVars();

    var keyword = document.getElementById("search-box").value;
    browser.skosOntologies.serverRequests.searchForKeyword(keyword);

    displayLoadingAnimation(true);

    document.getElementById('results-title').innerHTML="";
    document.getElementById('search-results-list').innerHTML="";
  });


  document.getElementById('ontologies-list-box').disabled=false;

});



// Desactivate the "Search Concept" button when no-text is entered
$(document).ready(function() {
  $('#search-button').attr('disabled', true);
  $('#search-box').on('keyup',function() {
      var text_value = $('#search-box').val();
      if(text_value != '') {
          $('#search-button').attr('disabled' , false);
      }else{
          $('#search-button').attr('disabled' , true);
      }
  });
});
