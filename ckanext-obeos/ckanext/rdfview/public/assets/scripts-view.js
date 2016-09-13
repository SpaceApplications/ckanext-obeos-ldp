//-------------------- Toolbox  --------------------------------------
// startsWith Implementation for all browsers
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    }
};
// endWith Implementation for all browsers
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(str) {
        return this.substring(this.length - str.length, this.length) === str;
    }
};

/* Transform a camelCase string to a sentence */
/* Ex: "parentIdentifier"  -> "Parent identifier" */
function camelToSpace(str) {
    //Add space on all uppercase letters
    var result = str.replace(/([A-Z])/g, ' $1').toLowerCase();
    //Trim leading and trailing spaces
    result = result.trim();
    //Uppercase first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Extract 'identifier' in 'http://purl.org/dc/terms/stuff#item'
function extractShortName(str) {
    // Extract 'item' in 'http://purl.org/dc/terms/stuff#item'
    hash = str.split("#")[1]
    if (hash) return hash;

    // Else extract 'identifier' in 'http://purl.org/dc/terms/identifier'
    name = /[^/]*$/.exec(str)[0];
    return name;

    // Else return emtpy string
}

// Extracname space by removing the shortName from the URL
function extractNamespace(str) {
    shortName = extractShortName(str);
    // 1. Trim the shortname from the URL
    // 2. Remove the last # if present
    // 3. Add a trailing / (slash) if missing
    if (str.endsWith(shortName)) return (str.substring(0, str.length - shortName.length).replace(/#$/, "").replace(/\/?$/, '/'));

    return "str";
}

// Extract 'identifier' in 'http://purl.org/dc/terms/identifier'
function extractBeforeHash(str) {
    return str.split("#")[0]
}

// Get parameters from urlParam
// Example $.urlParam('param1'); // name
$.urlParam = function(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    } else {
        return results[1] || 0;
    }
}

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    }
};

// Return true if date is a valid date (for Moment.js)
function isValidDate(date) {
    // Check if len>4 to avoid ISO-Date false positives, such as 8456
    if (date.length > 4) {
        occurences = date.match(DATETIME_REGEX);
        isDatetime = (occurences != undefined)
        return isDatetime;
    }
    return false;
}


//-------------------- /Toolbox  -------------------------------------


//-------------------- Constants  --------------------------------------
// Set "sa_debug=true" in querystring to activate debugging
IS_STANDALONE_DEBUGGER = $.urlParam("sa_debug") === "true";
if (IS_STANDALONE_DEBUGGER) console.info("Standalone Debugger mode is activated");
// Set "traces=true" to show debug traces (It works in Standalone Debugger as well as in CKAN)
DEBUG_TRACES = $.urlParam("traces") === "true";
if (DEBUG_TRACES) console.info("Debug traces are on");
// Use noiframe=true in the querystring if you want to debug outside of an iframe (it will use a hard-coded N3)
NO_IFRAME = $.urlParam("noiframe") === "true";
if (NO_IFRAME) console.info("No iframe mode is activated");

// IS_HREF_IN_PARENT when RDF-Browser is inside an iframe, and
IS_HREF_IN_PARENT = false;
iframe = $("#navigator", window.parent.document)
if (iframe.length) {
    console.info("RDF-Viewer is inside in iFrame")
    IS_HREF_IN_PARENT = iframe.hasClass("hrefInParent");

    if (IS_HREF_IN_PARENT) console.log("RDF-Viewer href will refresh the whole page");
    else console.log("RDF-Viewer href will refresh only the iframe");
}

BASE_URL = location.protocol + "//" + location.host + "/";

// Needed to test if Literal Strings are URLs
URL_Expression = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/gi;
URL_REGEX = new RegExp(URL_Expression);
// ISO Date Time Regex
Datetime_Expression = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/i
DATETIME_REGEX = new RegExp(Datetime_Expression);

ICONS_LOOK_UP = {
    "types": {
        "http://www.opengis.net/eop/2.1#creationDate": "DateTime",
        "http://www.opengis.net/eop/2.1#modificationDate": "DateTime",
        "http://def.seegrid.csiro.au/ontology/om/om-lite#phenomenonTime": "DateTime",
        "http://www.w3.org/2002/12/cal/ical#dtstart": "DateTime",
        "http://www.w3.org/2002/12/cal/ical#dtend": "DateTime",
        "http://purl.org/dc/terms/modified": "DateTime",
        "http://www.opengis.net/eop/2.1#platform": "Platform",
        "http://www.opengis.net/eop/2.1#instrument": "Instrument",
        "http://www.opengis.net/eop/2.1#acquisitionStation": "Station"
    },
    "icons": {
        "DateTime": "icon-time",
        "Platform": "icon-plane",
        "Instrument": "icon-camera",
        "Station": "icon-cloud-download"
    }
}

NAMESPACE_LOOKUP = {
    "http://www.w3.org/2005/Atom/": "atom",
    "http://purl.org/dc/elements/1.1/": "dc",
    "http://purl.org/dc/terms/": "dct",
    "http://purl.org/dc/dcmitype/": "dcmitype",
    "http://www.w3.org/ns/dcat#": "dcat",
    "http://usefulinc.com/ns/doap#": "doap (TBC)",
    "http://www.opengis.net/eop/2.0/": "eop20",
    "http://www.opengis.net/eop/2.1/": "eop21",
    "http://xmlns.com/foaf/0.1/ (TBC)": "foaf",
    "http://www.opengis.net/ont/geosparql#": "geo",
    "http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#": "gemet-schema",
    "http://www.eionet.europa.eu/gemet/concept/": "gemet-concept",
    "http://www.eionet.europa.eu/gemet/theme/": "gemet-theme",
    "http://www.eionet.europa.eu/gemet/group/": "gemet-group",
    "http://geojson.org/vocab#": "gj",
    "http://www.w3.org/2002/12/cal/ical#": "ical",
    "http://search.yahoo.com/mrss/": "media",
    "http://def.seegrid.csiro.au/ontology/om/om-lite/": "oml",
    "http://www.opengis.net/opt/2.1/": "opt",
    "http://www.w3.org/ns/org#": "org",
    "http://a9.com/-/spec/opensearch/1.1/": "os",
    "http://www.w3.org/2002/07/owl#": "owl",
    "http://www.w3.org/ns/prov#": "prov",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf",
    "http://www.w3.org/2000/01/rdf-schema#": "rdfs",
    "http://www.opengis.net/sar/2.1/": "sar",
    "http://schema.org/": "schema",
    "http://www.w3.org/2004/02/skos/core#": "skos",
    "http://purl.oclc.org/NET/ssnx/ssn/": "ssn",
    "http://www.w3.org/2006/vcard/ns#": "vcard",
    "http://rdfs.org/ns/void#": "void",
    "http://www.w3.org/2001/XMLSchema-datatypes#": "xs",
    "http://www.w3.org/2001/XMLSchema#": "xsd"
}

TEST_N3 = {}
    // DEBUG
TEST_N3 = "<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> a <http://www.w3.org/ns/dcat#Dataset> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/identifier> 'L1GT'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/title> 'LANDSAT-8 Level 1Gt (systematically terrain corrected - ETM+ only)'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/description> 'The Level 1Gt (L1Gt) data product provides systematic radiometric and geometric accuracy, while also employing a Digital Elevation Model (DEM) for topographic accuracy. Topographic accuracy of the product depends on the resolution of the DEM used.'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/spatial> 'POLYGON((-180.0 -80.0, -180.0 80.0, 180.0 80.0, 180.0 -80.0, -180.0 -80.0))'^^<http://www.opengis.net/ont/geosparql#wktLiteral> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://www.w3.org/2002/12/cal/ical#dtstart> '2013-02-11T00:00:00Z'^^<http://www.w3.org/2001/XMLSchema#dateTime> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://www.w3.org/2002/12/cal/ical#dtend> '2016-12-12T00:00:00Z'^^<http://www.w3.org/2001/XMLSchema#dateTime> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://www.opengis.net/eop/2.1#platform> <http://gcmdservices.gsfc.nasa.gov/kms/concept/13e3a08a-0d28-4e3f-a306-a20d9fb4fff8> . \
<http://gcmdservices.gsfc.nasa.gov/kms/concept/13e3a08a-0d28-4e3f-a306-a20d9fb4fff8> <http://www.w3.org/2004/02/skos/core#prefLabel> 'LANDSAT-8'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://www.opengis.net/eop/2.1#instrument> <http://gcmdservices.gsfc.nasa.gov/kms/concept/e8a6f9ad-e376-495c-869e-3467526b49ec> . \
<http://gcmdservices.gsfc.nasa.gov/kms/concept/e8a6f9ad-e376-495c-869e-3467526b49ec> <http://www.w3.org/2004/02/skos/core#prefLabel> 'OLI_TIRS'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://www.w3.org/ns/dcat#keyword> 'land cover'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/theme> <http://www.eionet.europa.eu/gemet/concept/4612/> . \
<http://www.eionet.europa.eu/gemet/concept/4612/> <http://www.w3.org/2004/02/skos/core#prefLabel> 'land cover'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> <http://purl.org/dc/terms/language> <http://id.loc.gov/vocabulary/iso639-2/eng> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860742015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> . \
<http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860752015182LGN00> <http://www.opengis.net/eop/2.1#parentIdentifier> <http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT> ;	<http://purl.org/dc/terms/identifier> 'LC80860752015182LGN00'^^<http://www.w3.org/2001/XMLSchema#string> ."


DEBUG_1 = null;

var app = angular.module('myApp', []);

app.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
}]);

// Angular Controller
app.controller('myCtrl', function($scope, $http) {
    $scope.IS_HREF_IN_PARENT = IS_HREF_IN_PARENT;

    $scope.N3Util = N3.Util; //To be used in HTML
    $scope.RDFStore = null;

    // These 2 variables shall be provided by the frame outside of the viewer
    $scope.SELECTED_SUBJECT = null; // The subject of the View
    $scope.N3Code = null; // The N3 document
    $scope.ENDPOINT_NAME = null;

    // Bugfix the moment.locale();  -> "zh-tw"
    moment.locale("en");

    // Parse a N3 a put it into a store
    $scope.parseN3 = function(n3) {
        var parser = N3.Parser();
        $scope.RDFStore = N3.Store();

        parser.parse(n3,
            function(error, triple, prefixes) {
                if (triple) {
                    // Add triple to the Store (to be queried further on)
                    $scope.RDFStore.addTriple(triple.subject, triple.predicate, triple.object);
                } else {
                    $scope.RDFStore.addPrefixes(prefixes);
                    // Remove Blank nodes that have no children
                    ViewerCommon.removeUnboundBlankNodes($scope.RDFStore);
                    allTriples = $scope.RDFStore.find(null, null, null);

                    console.log($scope.RDFStore)

                    $scope.done();
                }
            });
    }

    // Watch subject change
    $scope.$watchCollection('N3Code', function(newValue, oldValue) {
        if (!$scope.SELECTED_SUBJECT) {
            console.info("Won't parse N3Code, because no subject is defined");
        } else {
            console.info("Parsing new N3Code");
            $scope.parseN3(newValue);
        }
    });

    // Watch subject change
    $scope.$watchCollection('SELECTED_SUBJECT', function(newValue, oldValue) {
        console.debug("New SELECTED_SUBJECT");
        console.debug(newValue);
    });

    $scope.$watchCollection('ENDPOINT_NAME', function(newValue, oldValue) {
        console.debug("New ENDPOINT_NAME");
    });

    //------------------ Catching value from CKAN template ------------------------------//
    if (!IS_STANDALONE_DEBUGGER) // Needed because if(ckan_templates_variable) returns 'ReferenceError' in standalone debugger
    {
        if (endpoint_name) $scope.ENDPOINT_NAME = endpoint_name;
        if (selected_subject_from_parent) $scope.SELECTED_SUBJECT = selected_subject_from_parent;
        if (n3_from_parent) $scope.N3Code = n3_from_parent;
    }
    //------------------ /Catching value from CKAN template ------------------------------//

    // Parse a N3 a put it into a store
    $scope.parseN3 = function(n3) {
        var parser = N3.Parser();
        $scope.RDFStore = N3.Store();

        parser.parse(n3,
            function(error, triple, prefixes) {
                if (triple) {
                    // Add triple to the Store (to be queried further on)
                    $scope.RDFStore.addTriple(triple.subject, triple.predicate, triple.object);
                } else {
                    $scope.RDFStore.addPrefixes(prefixes);
                    // Remove Blank nodes that have no children
                    ViewerCommon.removeUnboundBlankNodes($scope.RDFStore);
                    allTriples = $scope.RDFStore.find(null, null, null);

                    if (DEBUG_TRACES)
                        $scope.buildD3();

                    $scope.done();
                }
            });

        // Content is loaded,
        $("#please-wait").hide();
    }

    //------------------ DEBUG ------------------------------//
    // Fetching N3 outside of the iFrame
    // N3FromDebugger = parent.angular.element($('[ng-controller=myHyperCtrl]', window.parent.document)).scope().N3Code
    // $scope.N3 = N3FromDebugger;

    // Hard-coded N3
    //$scope.N3 = TEST_N3; // DEBUG TEST
    //------------------ /DEBUG ------------------------------//


    // Called when N3Code has been parsed
    $scope.done = function() {
        $scope.$apply();
    }


    $scope.rawLabelFromIRI = function(IRI) {
        return extractShortName(IRI);
        // If predicate label is a #hash
        // if (extractHash(IRI))
        //   return extractHash(IRI);
        // // If predicate label is a /word
        // else
        //   return extractLastPart(IRI);
    }

    // Transform CamelCase to Sentence
    // Ex: "http://www.w3.org/2004/02/skos/core#prefLabel" -> "Pref Label"
    $scope.humanReadableLabelFromIRI = function(IRI) {
        return camelToSpace($scope.rawLabelFromIRI(IRI));
    }

    // Display a Literal Value the best way possible.
    // Display it as a date if so.
    $scope.displayPrettyLiteral = function(literal) {
        // Return a formatted date: Ex: Wed Jul 01 2015 16:38:00 GMT+0200 (CEST)
        if (isValidDate(literal))
            return moment(literal).format("ddd MMM D YYYY HH:mm:ss [GMT]Z [(CEST)]");

        return (literal)
    }


    $scope.machineLabel = function(IRI) {
        return ($scope.rawLabelFromIRI(IRI));
    }

    $scope.shortNamespaceFromIRI = function(IRI) {
        // Remove hash #
        var cleanURL = extractNamespace(IRI);
        var shortNamespace = NAMESPACE_LOOKUP[cleanURL];
        if (shortNamespace) return shortNamespace;
        return cleanURL;
        //shortNamespace ? (return shortNamespace) : (return IRI);
    }

    // Return an array of triples for 'subject'
    $scope.triplesForSubject = function(subject) {
        var triples = $scope.RDFStore.find(subject, null, null);
        return triples;
    }

    // Return a unique list of backward predicates for object "object"
    $scope.backwardPredicates = function(object) {
        var list = _.uniq(_.pluck($scope.getTriples(null, null, object), 'predicate'))
        return list;
    }

    // Return a unique list of forward predicates for object "object"
    $scope.forwardPredicates = function(subject) {
        var list = _.uniq(_.pluck($scope.getTriples(subject, null, null), 'predicate'))
        return list;
    }

    // Remove all back links to the main subject in a list of triples
    // i.e.: Remove all s,p,o where (o == SELECTED_SUBJECT) in a list of triples
    $scope.removeBacklinksToMainsubject = function(triples) {
        var newArr = triples.filter(function(e) {
            return e.object !== $scope.SELECTED_SUBJECT;
        });
        return (newArr);
    }

    // Watch subject change
    // $scope.$watchCollection('SELECTED_SUBJECT', function(newValue, oldValue) {
    //   if(newValue){        // Empty the views
    //     $('#forwardPropertiesContainer').empty();
    //     $('#backwardPropertiesContainer').empty();
    //   }
    //   console.debug("CLEAN CONTAINERS")
    // });

    // Return a Bootstarp icon class for a given IRI
    $scope.getIcon = function(IRI) {
        return ICONS_LOOK_UP.icons[ICONS_LOOK_UP.types[IRI]];
    }

    // Build an URL for internal navigation
    $scope.buildInternalNavURL = function(subject) {
        NAV_URL = BASE_URL + "endpoint/" + $scope.ENDPOINT_NAME + "/navigator?is_standalone=True&subject_uri="
        var url = NAV_URL + encodeURIComponent(subject);
        return url;
    }

    // Direct call to the local triple store
    $scope.getTriples = function(subject, predicate, object) {
        if ($scope.RDFStore) {
            //console.log("GetTriple:"+subject+" - "+predicate+" - "+object)
            var triples = $scope.RDFStore.find(subject, predicate, object);
            return triples;
        }
        return null;
    }

    // Return true if file string represents an image
    $scope.isImage = function(file) {
        if (file) {
            occurences = file.match(/\.(jpg|jpeg|png|gif)$/);
            isImage = (occurences != undefined)
            return isImage;
        }
        return false;
    }

    // Return true if string is an URL
    $scope.isURL = function(string) {
        if (string) {
            occurences = string.match(URL_REGEX);
            isURL = (occurences != undefined)
            return isURL;
        }
        return false;
    }

    // Build  an hyperlink from a string
    $scope.buildHyperlink = function(string) {
        // If string is a simple URL, then it is manager by OBEOS Server
        // So we will display an internal link
        if ($scope.isURL(string)) {
            url = $scope.buildInternalNavURL(string)
            return url;
        } else if ($scope.N3Util.isLiteral(string) && $scope.N3Util.getLiteralType() == "string") {
            $scope.N3Util.getLiteralValue(string)
            return href;
        } else {
            console.error("string is not a link!");
            return "Error: This is not a link";
        }
    }

    // Return true on CKAN "Resource" pages, so that it open the link in the _parent page (and not in _self)
    //Return false on CKAN other pages
    $scope.getHyperLinkTarget = function() {
        target = IS_HREF_IN_PARENT ? "_parent" : "_self";
        return target;
    }


    // Return true if string is a WKT
    $scope.isWKT = function(val, typ) {
        if (typ && typ.endsWith("wktLiteral")) {
            return true;
        }
        if (val) {
            return (val.startsWith("POLYGON") || val.startsWith("MULTIPOLYGON"));
        }
        return false;
    }

    // Prevent display of cyclic links like S1->p1->o2->p2->S1
    // Return true if the object of ( subject, predicate ) is the current selected subject.
    // For the moment this doesnt take into account the case of N ( subject, predicate ) links, where only one or several of them are cyclic.
    $scope.isRedudantPredicate = function(subject, predicate) {
        if (!$scope.SELECTED_SUBJECT) {
            console.warn("isRedudantPredicate: Can't check redundancy because selectedIRI is undefined!")
        }
        var triples = $scope.RDFStore.find(subject, predicate, null);
        if (triples && triples[0]) {
            var isRedundant = (triples[0].object == $scope.SELECTED_SUBJECT);
            return isRedundant;
        }
        return false;
    }

    $scope.hasBackwardLinks = function(subject) {
        if ($scope.RDFStore) {
            var triples = $scope.RDFStore.find(null, null, subject);
            if (triples && triples.length > 0) return true;
        }
        return false;
    }

    $scope.hasForwardLinks = function(subject) {
        if ($scope.RDFStore) {
            var triples = $scope.RDFStore.find(subject, null, null);
            if (triples && triples.length > 0) return true;
        }
        return false;
    }



    //
    $scope.convertN3toD3_Basic = function(p_RDFStore) {
        d3Data = {
            "nodes": [],
            "links": []
        }

        var triples = p_RDFStore.find(null, null, null)

        var subjectsUniq = _.uniq(_.pluck(p_RDFStore.find(null, null, null), 'subject'))
        var objectsUniq = _.uniq(_.pluck(p_RDFStore.find(null, null, null), 'object'))
        var entities = []
            //Get all entities
        for (s in subjectsUniq) {
            if (s !== "><")
                entities.push({
                    "name": subjectsUniq[s],
                    "group": 1
                })
        }
        for (o in objectsUniq) {
            if (o !== "><")
                entities.push({
                    "name": objectsUniq[o],
                    "group": 1
                })
        }
        // Remove all duplicates
        d3Data.nodes = _.uniq(entities, function(item, key, name) {
            return item.name;
        });

        // Create links
        for (i = 0; i < d3Data.nodes.length; i++) {
            subjectName = d3Data.nodes[i].name;
            subjectIndex = i;

            links = $scope.RDFStore.find(subjectName, null, null);
            if (links.length != 0) {
                for (l in links) {
                    triple = links[l];
                    //console.log(triple.object)
                    if (triple.subject && triple.object) {
                        var objectIndex = _.findIndex(d3Data.nodes, function(item) {
                            return item.name == triple.object
                        })
                        d3Data.links.push({
                            "source": subjectIndex,
                            "target": objectIndex,
                            "value": 1
                        })
                    }
                }
            }
        }

        return d3Data;
    }

    //
    $scope.convertN3toD3_Advanced = function(p_RDFStore) {
        d3Data = {
            "nodes": [],
            "links": []
        }

        var triples = p_RDFStore.find(null, null, null)

        for (i in triples) {
            t = triples[i]
                // 1. Add subject and object entities to d3Data.nodes if not existing yet
                // Subject Entity Index in d3Data.nodes (=-1 if not exsiting yet)
            var subIdx = _.findIndex(d3Data.nodes, function(item) {
                return item.name == t.subject
            });
            // Add it if not existing
            if (subIdx == -1) {
                d3Data.nodes.push({
                    "name": t.subject,
                    "group": 1,
                    "label": N3.Util.isLiteral(t.subject) ? N3.Util.getLiteralValue(t.subject) : extractShortName(t.subject)
                })
                subIdx = d3Data.nodes.length - 1;
            }
            // Object Entity Index in d3Data.nodes (=-1 if not exsiting yet)
            var objIdx = _.findIndex(d3Data.nodes, function(item) {
                return item.name == t.object
            });
            // Add it if not existing
            if (objIdx == -1) {
                d3Data.nodes.push({
                    "name": t.object,
                    "group": 1,
                    "label": N3.Util.isLiteral(t.object) ? N3.Util.getLiteralValue(t.object) : extractShortName(t.object)
                })
                objIdx = d3Data.nodes.length - 1;
            }
            // 2. Add relation nodes if not existing yet
            // Subject-Predicate Entity Index in d3Data.nodes (=-1 if not exsiting yet)
            // var predIdx = _.findIndex(d3Data.nodes, function(item) {
            //   return ( (item.subject + item.predicate) == (t.subject + t.predicate) )
            // });
            // if(predIdx == -1){
            d3Data.nodes.push({
                "name": t.predicate,
                "group": 2,
                "label": extractShortName(t.predicate)
            })
            predIdx = d3Data.nodes.length - 1;
            // }
            // var spIdx = _.findIndex(d3Data.nodes, function(item) {
            //   return ( (item.subject + item.predicate) == (t.subject + t.predicate) )
            // });
            // if(spIdx == -1){
            //       d3Data.nodes.push({
            //         "name": t.predicate,
            //         "group": 2,
            //         "subject": t.subject,
            //         "predicate": t.predicate
            //       })
            //       spIdx = d3Data.nodes.length - 1;
            // }
            // // Predicate-Object Entity Index in d3Data.nodes (=-1 if not exsiting yet)
            // var poIdx = _.findIndex(d3Data.nodes, function(item) {
            //   return ( (item.predicate + item.object) == (t.predicate + t.object) )
            // });
            // if(poIdx == -1){
            //       d3Data.nodes.push({
            //         "name": t.predicate,
            //         "group": 2,
            //         "predicate": t.predicate,
            //         "object": t.object
            //       })
            //       poIdx = d3Data.nodes.length - 1;
            // }


            // 3. Add links
            // Add subject->predicate link
            d3Data.links.push({
                    "source": subIdx,
                    "target": predIdx,
                    "value": 1
                })
                // Add predicate->object link
            d3Data.links.push({
                "source": predIdx,
                "target": objIdx,
                "value": 1
            })
        }

        return (d3Data)
    }

    // Flag is set to true once D3 Graph has been built on the first time
    D3BuildFlag = false;

    $scope.buildD3 = function() {

        if (!D3BuildFlag) {
            $.getScript('/static/bower_components/d3/d3.min.js', function() {
                //Stuff to do after someScript has loaded
                // angular.element($('[ng-app=myApp]')).scope().buildD3();
                D3BuildFlag = true;
            });
        }

        //d3Data = $scope.convertN3toD3_Basic($scope.RDFStore);
        d3Data = $scope.convertN3toD3_Advanced($scope.RDFStore);

        var width = 960,
            height = 500;

        var color = d3.scale.category20();

        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        var svg = d3.select("#N3-graph").append("svg")
            .attr("width", width)
            .attr("height", height);


        force
            .nodes(d3Data.nodes)
            .links(d3Data.links)
            .start();

        var link = svg.selectAll(".link")
            .data(d3Data.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function(d) {
                return Math.sqrt(d.value);
            });

        var node = svg.selectAll(".node")
            .data(d3Data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", function(d) {
                return (10 / (1 + d.group / 2));
            })
            .style("fill", function(d) {
                return color(d.group);
            })
            .call(force.drag);

        node.append("title")
            .text(function(d) {
                return d.label;
            });

        force.on("tick", function() {
            link.attr("x1", function(d) {
                    return d.source.x;
                })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", function(d) {
                    return d.target.x;
                })
                .attr("y2", function(d) {
                    return d.target.y;
                });

            node.attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                });
        });
    }

    //------------------ For Standalone Debugging ------------------------------//

    if (IS_STANDALONE_DEBUGGER) {
        // Debugging from = http://local.obeos/rdf_view.html?sa_debug=true&traces=true&noiframe=true&subject_uri=http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8_L1GT
        if (NO_IFRAME) {
            $scope.SELECTED_SUBJECT = $.urlParam("subject_uri")
            console.info("Selected subject is:" + $scope.SELECTED_SUBJECT)
                // Hard-coded N3Code
            $scope.N3Code = TEST_N3; // DEBUG TEST
        }
        // Debugging from hyperpage.html
        else {
            // Fetching N3Code outside of the iFrame
            if (parent.angular.element($('[ng-controller=myHyperCtrl]', window.parent.document))) {
                parentCtrlr = parent.angular.element($('[ng-controller=myHyperCtrl]', window.parent.document));
                if (parentCtrlr.scope()) {
                    $scope.SELECTED_SUBJECT = parent.angular.element($('[ng-controller=myHyperCtrl]', window.parent.document)).scope().selectedIRI;
                    $scope.N3Code = parent.angular.element($('[ng-controller=myHyperCtrl]', window.parent.document)).scope().N3Code;
                }
            }
        }

    }

    //------------------ /For Standalone Debugging ------------------------------//

}).directive('rdfLoaded', function() {

    return function(scope, element, attrs) {
        angular.element(document).ready(function() {
                $('#please-wait-rdf').hide()
                $('#rdf-viewer-content').show()
        });
    };

});


// The OpenLayer Controller.
// Fill a: <div id="map_" current-polygon="WKTpoly"></div> with OpenLayer map
app.value('MapCounter', {
        counter: 0
    })
    .controller('openlayerController', ['$scope', function($scope) {
        // $scope.WKTpoly = '';
    }])
    .directive('currentPolygon', ['$interval', 'MapCounter', function($interval, MapCounter) {

        function link(scope, element, attrs) {

            var WKTpoly; // Ex: POLYGON((1 1,5 1,5 5,1 5,1 1))

            // Create an openLayer map, and return the name of the 'id' to be assigned to the div that will embedd this map
            // :param mapName: Then name of the map, that shall be already assinged to a div so OpenLayer can generate the map in it.
            function initMapFromWKT(wkt, mapName) {

                console.debug("Creating map from:" + wkt + " and called " + mapName)
                if (!wkt) {
                    console.debug("Need a valid WKT!")
                    return;
                }
                // Clean string if of type:
                // POLYGON((158.62491 -20.62025,160.42562 -20.99163,160.02802 -22.72609,158.20548 -22.34984,158.62491 -20.62025));<http://www.opengis.net/def/crs/EPSG/0/4326>
                // Remove everything after the ;
                if (wkt.indexOf(';') !== -1) {
                    wkt = wkt.substring(0, wkt.indexOf(';'));
                }
                // Clean string if of type:
                // <http://www.opengis.net/def/crs/EPSG/0/4326> MULTIPOLYGON (((52.6654 12.6407, 52.6845 16.0123, 50.6998 15.9689, 50.6819 12.7416, 52.6654 12.6407)))
                // Remove everything before the >
                if (wkt.indexOf('>') !== -1) {
                    wkt = wkt.substring(wkt.indexOf('>') + 1);
                }

                var raster = new ol.layer.Tile({
                    source: new ol.source.OSM()
                });

                var format = new ol.format.WKT();

                var feature = format.readFeature(wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });

                var vector = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: [feature]
                    })
                });

                var view = new ol.View({
                    center: [0, 0],
                    zoom: 1
                });

                var map = new ol.Map({
                    layers: [raster, vector],
                    target: mapName,
                    view: view
                });

                var polygon = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
                var size = /** @type {ol.Size} */ (map.getSize());
                view.fit(
                    polygon,
                    size, {
                        padding: [50, 50, 50, 50],
                        constrainResolution: false
                    }
                );

            }

            scope.$watch(attrs.currentPolygon, function(value) {
                WKTpoly = value
                element[0].id = element[0].id + MapCounter.counter++

                    initMapFromWKT(WKTpoly, element[0].id)
            });
        }

        return {
            link: link
        };
    }]);

//------------------ For Debug Traces ------------------------------//
//------------------ Activable in URL with: ....&traces=true



showDebugInfos = function(b) {
    if (b) {
        $(".debugLabel").toggle(b);
        $(".debugBox").toggle(b);

    }
}

showDebugInfos(DEBUG_TRACES);
//------------------ /For Debug Traces ------------------------------//
