from logging import getLogger
import urllib2
import urlparse
from rdflib.exceptions import ParserError
from ckanext.lib.cache import Cache

from ckanext.lib.opensearch import Client, Query

from rdflib import Literal, URIRef
from rdflib.graph import Graph
from rdflib.namespace import Namespace, DCTERMS, DC

import ckan.lib.base as base

import endpoint

log = getLogger(__name__)

render = base.render

DCAT = Namespace('http://www.w3.org/ns/dcat#')
EO = Namespace('http://a9.com/-/opensearch/extensions/eo/1.0/')
RDFS = Namespace('http://www.w3.org/2000/01/rdf-schema#')
DCT = Namespace('http://purl.org/dc/terms/')
VOID = Namespace('http://rdfs.org/ns/void#')
ATOM = Namespace('http://www.w3.org/2005/Atom/')
ICAL = Namespace('http://www.w3.org/2002/12/cal/ical#')
MEDIA = Namespace('http://search.yahoo.com/mrss/')
OML = Namespace('http://def.seegrid.csiro.au/ontology/om/om-lite#')
OS = Namespace('http://a9.com/-/spec/opensearch/1.1/')

# cache mechansim
opensearch_description_url_by_collection_id = Cache(3600)


class FedeoEndpoint(endpoint.Endpoint):
    """Represents a FedEO endpoint with an OpenSearch interface.
    """
    def __init__(self, name, url, timeout, key_parameters):
        super(FedeoEndpoint, self).__init__(name, url, timeout, key_parameters)
        self.first_step_client = Client(url)

    def check_connectivity(self):
        """Check network connectivity with the fedeo endpoint by an empty open search request.

        :return: True if the opensearch request didn't throw any exception
        """
        try:
            self.first_step_client.search('')
        except:
            return False
        return True

    @endpoint.region.cache_on_arguments()
    def get_collections(self, query, **params):
        log.debug('get_collections parameters %s' % params)

        # Check if the template_url contains all the extracted key parameters
        template_url = self.first_step_client.description.get_url_by_type_and_rel('application/atom+xml', 'collection').template
        for key_parameter in self.key_parameters:
            if key_parameter.replace(':', '__') in params and key_parameter not in template_url:
                log.info('template does not contain key parameter %s' % key_parameter)
                return []

        # log.debug("extracted template for getting collections: %s" % template_url)

        results = self.first_step_client.search('', template_type='application/atom+xml',
                                                template_rel='collection',
                                                page_size=50,
                                                **params)

        collections = []
        result_count = 0
        for result in results:
            # log.debug('result for endpoint %s: %s' % (self.name, result))
            id = result.get('dc_identifier', None)
            if id is None:
                log.error('Could not fetch dc_identifier for a result for endpoint: ' + self.name)
            else:
                # Extract the opensearch description url for that collection (should be one occurrence so we take the first)
                opensearch_description_url = next(
                    (link['href'] for link in result['links'] if link['type'] == 'application/opensearchdescription+xml'), None)
                opensearch_description_url_by_collection_id[id] = opensearch_description_url

                collection = {'title': result['title'],
                              'description': result['summary'],
                              'id': id}
                collections.append(collection)
            result_count += 1
            if result_count > 50:
                break
        return collections

    def get_collection_datasets(self, **kwargs):
        log.debug('get_collection_datasets parameters %s' % kwargs)

        collection_id = kwargs['eo__parentIdentifier']

        # ----------------Collection----------------

        # Select the right template.
        url_collection = self.first_step_client.description.get_url_by_type_and_rel('application/rdf+xml', 'results')
        if url_collection is None:
            log.error(
                'Could not fetch the template (type: application/rdf+xml, rel: results) for collection %s and endpoint %s' % (
                collection_id, self.name))
            return None

        url_template_collection = url_collection.template

        # Getting the collection.
        q = Query(url_template_collection)
        setattr(q, 'geo__uid', collection_id)
        response = None
        try:
            response = urllib2.urlopen(q.url())
        except:
            return render('error_display_collection.html', extra_vars={
                'endpoint_name': self.name,
                'dataset_id': collection_id
            })

        rdf_xml_response = response.read()

        collection = {}

        # Parsing the RDF to a graph.
        graph = Graph()
        graph.parse(data=rdf_xml_response, format='xml')

        for s, p, o in graph.triples((None, RDFS.member, None)):
            # Extracting description.
            collection['id'] = str(graph.value(subject=o, predicate=DCT.identifier))
            collection['title'] = str(graph.value(subject=o, predicate=DCT.title))
            collection['description'] = str(graph.value(subject=o, predicate=DCT.description))
            # Extracting meta information.
            meta = {}
            for ss, pp, oo in graph.triples((o, None, None)):
                if pp.__str__() in meta:
                   # Concatenate the objects linked with the same predicate
                   meta[pp.__str__()] = "%s, %s" % (meta[pp.__str__()], oo.__str__())
                else:
                   meta[pp.__str__()] = oo.__str__()
            collection['meta'] = meta
            collection['opensearch_description_url'] = str(graph.value(subject=o, predicate=VOID.openSearchDescription))
            # Store the collection OSDD URL in the cache
            opensearch_description_url_by_collection_id[collection_id] = collection['opensearch_description_url']

        collection_opensearch_description_url = opensearch_description_url_by_collection_id[collection_id]

        # Do not get datasets if collection_opensearch_description_url is None
        if collection_opensearch_description_url is None or collection_opensearch_description_url == 'None':
            log.warning("No OpenSearch description found for collection %s" % collection_id)
            return {'collection': collection, 'datasets': []}

        log.info('Collection OSDD URL: %s' % collection_opensearch_description_url)
        opensearch_client = Client(collection_opensearch_description_url)
        # Select the right template.
        url_template_datasets = opensearch_client.description.get_url_by_type_and_rel('application/rdf+xml',
                                                                                      'results').template
        log.debug('Datasets OpenSearch template: %s' % url_template_datasets)

        # ----------------Datasets----------------

        # We circumvent the opensearch fetching mechanism. We just want the raw xml.
        q = Query(url_template_datasets)
        # Get up to 100 records. However FedEO returns at most 50 records in each response.
        setattr(q, 'count', '100')
        for k, v in kwargs.iteritems():
            setattr(q, k, v)
        try:
            log.debug('OpenSearch query: %s' % q.url())
            response = urllib2.urlopen(q.url())
        except:
            return {'collection': collection, 'datasets': []}

        rdf_xml_response = response.read()

        # Parsing the RDF to a graph.
        graph = Graph()
        graph.parse(data=rdf_xml_response, format='xml')
        for subject, total_results in graph.subject_objects(OS.totalResults):
            if total_results is None or total_results == '': total_results = '0'
            collection['total_dataset_results'] = total_results
            break

        datasets = []

        # Extract the members.
        for s, p, o in graph.triples((None, RDFS.member, None)):
            phenomenonTime_blank_node = graph.value(subject=o, predicate=OML.phenomenonTime)
            oml_result_blank_node = graph.value(subject=o, predicate=OML.result)

            dataset = {
                'id': graph.value(subject=o, predicate=DCT.identifier).__str__(),
                'icon': graph.value(subject=oml_result_blank_node, predicate=MEDIA.group).__str__(),
                'start': graph.value(subject=phenomenonTime_blank_node, predicate=ICAL.dtstart).__str__(),
                'end': graph.value(subject=phenomenonTime_blank_node, predicate=ICAL.dtend).__str__()
            }
            datasets.append(dataset)

        return {'collection': collection, 'datasets': datasets}

    def get_raw_dataset(self, collection_id, product_id, mime_type='application/rdf+xml'):
        log.debug('get_raw_dataset')
        collection_opensearch_description_url = opensearch_description_url_by_collection_id[collection_id]
        opensearch_client = Client(collection_opensearch_description_url)
        # Select the right template.
        url_template = opensearch_client.description.get_url_by_type_and_rel('application/rdf+xml', 'results').template
        log.debug('OpenSearch template: %s' % url_template)

        q = Query(url_template)
        setattr(q, 'geo__uid', product_id)
        setattr(q, 'dc__type', 'dataset')
        setattr(q, 'eo__parentIdentifier', collection_id)

        log.debug('OpenSearch query: %s' % q.url())
        response = urllib2.urlopen(q.url())

        graph = Graph()
        graph.parse(data=response.read())
        total_results = '0'
        for subject, total_results in graph.subject_objects(OS.totalResults):
            if total_results is None or total_results == '': total_results = '0'
            break

        uri = graph.value(predicate=DCTERMS.identifier, object=Literal(product_id))

        return {'subject_uri': uri, 'graph': graph.serialize(format='n3'), 'total_results': total_results}

    def get_graph(self, subject_uri):
        if subject_uri is None: return
        graph = Graph()
        # External: check subject_uri is a url, retrieve the content if it is the case.
        parts = urlparse.urlparse(subject_uri)
        if not parts.scheme or not parts.netloc:
            return

        req = urllib2.Request(subject_uri)
        req.add_header('Accept', 'application/rdf+xml')
        resp = urllib2.urlopen(req)
        resp_content = resp.read()
        # Test if request succeeded and does not send back an html
        if resp.code == 200 and resp_content[:14] != '<!DOCTYPE html':
            # If the content is RDF, then interpret it as a graph.
            try:
                graph.parse(data=resp_content, format='xml')
            except ParserError:
                log.warn('Unable to parse response from ' + subject_uri)

        else:
            log.warn('Cannot open URL: ' + subject_uri)

        # Add a triple with subject_uri as source.
        graph.add((URIRef(subject_uri), DC.source, Literal(subject_uri)))

        return graph.serialize(format='n3')
