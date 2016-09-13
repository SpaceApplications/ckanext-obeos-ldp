
Concept = Concept || function (){}
	
function Concepts() {
    
    this.conceptsDict = {};
   
    // Return false if the concept was already present in the list.
    // Return true if the concept has effectively been added in the list.
    this.add = function(concept) {
        //if (this.conceptsDict[concept.label] == undefined) {
        //   return false;
        //}
        this.conceptsDict[concept.label] = concept;
        //return true;
    };
    
    this.get = function(label) {
        return this.conceptsDict[label];
    };
    
    this.remove = function(label) {
        delete this.conceptsDict[label];
    };
    
    this.contains = function(label) {
        return this.conceptsDict[label] != undefined;
    };
    
    this.isEmpty = function() {
        // http://bencollier.net/2011/04/javascript-is-an-object-empty/
        return (Object.getOwnPropertyNames(this.conceptsDict).length === 0);
    };
    
    this.labels = function() {
        return jqRARE.map(this.conceptsDict, function(value, key) { return key; });
    };
    
    this.concepts = function() {
        return jqRARE.map(this.conceptsDict, function(value, key) { return value; });
    };
    
    // This function goes through the list of selected concepts and checks if their
    // label is still present in the input field. If not, it is removed from the list.
    // Test string: test1 "test2 test3" test4
    this.cleanup = function(query) {
        
        if (this.isEmpty()) return this;  // Nothing to do
        
        // Convert the query to remove double quotes
        // [test1 "test2a test2b" test3]   =>    [test1 test2a_test2b test3]
        var queryChars = query.toLowerCase().split('');
        var space = false, quoted = false;
        for (var i = 0; i < queryChars.length; i++) {
            if (queryChars[i] == ' ') {
                if (quoted) {               // Replace space characters in quoted multi-tokens
                    queryChars[i] = '_';
                } else {
                    space = true;           // Just remember that the previous character is a space
                };
            }
            if (queryChars[i] == '"') {     // Found a quote
            
                if (i == 0 || space) {      // First character or preceded by a space => opening quote
                    quoted = true;
                } else {
                    quoted = false;
                }
                space = false;
            };
            space = queryChars[i] == ' ';
        }
        // Build the normalized query
        var normQuery = queryChars.join('').replace(/"/g, '').split(' ');
        
        //console.debug("cleanup: query "+query+" => "+normQuery);
        console.debug("Cleanup selected concepts against normalized user query:", normQuery);
        for (label in this.conceptsDict) {
            var normLabel = label.toLowerCase().replace(/ /g, '_');
            //console.debug("Checking "+normLabel, this.conceptsDict[label]);
            if (normQuery.indexOf(normLabel) == -1) {
                this.remove(label);
            }
        }
        return this;
    };
    
};
