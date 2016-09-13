# -*- coding: utf8 -*-
from __future__ import unicode_literals

import codecs
from logging import getLogger
import os
from threading import Thread
import urllib2
import urlparse

from jinja2 import Template
from rdflib import Literal, URIRef
from rdflib.exceptions import ParserError
from rdflib.graph import Graph
from rdflib.namespace import RDF, Namespace, DCTERMS, XSD, DC
import requests
from requests import ConnectionError
from requests_futures.sessions import FuturesSession

import endpoint

__author__ = 'jgl'

log = getLogger(__name__)

COLLECTIONS = os.path.join(os.path.dirname(__file__), 'collections.sparql')
DATASETS = os.path.join(os.path.dirname(__file__), 'datasets.sparql')
DATASET = os.path.join(os.path.dirname(__file__), 'dataset.sparql')
GENERIC = os.path.join(os.path.dirname(__file__), 'generic.sparql')

with codecs.open(COLLECTIONS, 'r', encoding='utf-8') as f:
    template_collections = Template(f.read())
with codecs.open(DATASETS, 'r', encoding='utf-8') as f:
    template_datasets = Template(f.read())
with codecs.open(DATASET, 'r', encoding='utf-8') as f:
    template_dataset = Template(f.read())
with codecs.open(GENERIC, 'r', encoding='utf-8') as f:
    template_generic = Template(f.read())

DCAT = Namespace('http://www.w3.org/ns/dcat#')
ICAL = Namespace('http://www.w3.org/2002/12/cal/ical#')
OML  = Namespace('http://def.seegrid.csiro.au/ontology/om/om-lite#')
ATOM = Namespace('http://www.w3.org/2005/Atom/')
ICAL = Namespace('http://www.w3.org/2002/12/cal/ical#')
CO   = Namespace('http://purl.org/ontology/co/core#')


class StrabonEndpoint(endpoint.Endpoint):
    """Represents a strabon RDF database endpoint.
    """
    def __init__(self, name, url, timeout, key_parameters):
        """Create an Endpoint instance responsible for handling request/responses from a Strabon endpoint.

        :param name: the name of the endpoint, should be unique
        :param url: The url of the Strabon endpoint. e.g.: 'http://leo.spaceapplications.com/endpoint1/Query'
        :param timeout: timeout in seconds for any requests to the endpoint, used to limit execution time of thread involving the endpoint
        """
        super(StrabonEndpoint, self).__init__(name, url, timeout, key_parameters)
        self.sparql_template_collections = template_collections
        self.sparql_template_datasets = template_datasets
        self.sparql_template_dataset = template_dataset
        self.sparql_template_generic = template_generic

    def check_connectivity(self):
        """Check network connectivity with the strabon endpoint by sending a simple DESCRIBE SPARQL request.

        :return: True if HTTP status code is 200, False otherwise
        """
        query = 'DESCRIBE <http://example.org/>'
        headers = {'Accept': 'application/rdf+xml'}
        params = {'query': query}

        try:
            status_code = requests.post(self.url, data=params, headers=headers).status_code
        except requests.exceptions.ConnectionError as e:
            log.error(e.message)
            log.error('Connection error on endpoint : %s (%s). This endpoint will not be used.' %(self.name, self.url) )
            return False

        return status_code == 200

    def _request(self, query, mime_type='application/rdf+xml'):
        """Querying the strabon endpoint. Send multiple async requests.

        :param query: the SPARQL query
        :param mime_type: the format in which to return the graph
        :return: a formatted RDF graph
        """
        headers = {'Accept': mime_type}
        session = FuturesSession()

        # Execute requests
        return session.post(self.url, data={'query': query}, headers=headers).result().content

    @endpoint.region.cache_on_arguments()
    def get_collections(self, query, **kwargs):

        query = self.sparql_template_collections.render(**kwargs)

        try:
            xml_response = self._request(query)
        except ConnectionError:
            log.info('ConnectionError on Strabon. Could not execute query')
            return []

        collections = []

        graph = Graph()

        # Removing rdf prefix in rdf:about prevents an error from rdflib.
        graph.parse(data=xml_response.replace('rdf:about>', 'about>'), format='xml')

        for s in graph.subjects(predicate=RDF.type, object=DCAT.Dataset):
            collection = {'title': str(graph.value(subject=s, predicate=DCTERMS.title).__str__()),
                          'description': graph.value(subject=s, predicate=DCTERMS.description).__str__(),
                          'id': graph.value(subject=s, predicate=DCTERMS.identifier).__str__()}
            collections.append(collection)

        return collections

    def get_collection_datasets(self, **kwargs):
        """Returns the collection corresponding to the given id and the associated datasets.

        This method is in two steps:
        - first step is retrieving the collection (predicate dcat:Dataset) and extracting all its metadata
        - second step is retrieving the associated datasets

        :param kwargs: the query parameters (eo__parentIdentifier paramter to pass the id of the collection)
        :return: {'collection': [collection], 'datasets': [datasets]}
        where collection is the dataset series structured as a CKAN package and
        where datsets is a list of associated datasets structured as CKAN resources.
        """
        #print 'request parameters to Strabon', kwargs

        query = self.sparql_template_datasets.render(**kwargs)

        xml_response = self._request(query)

        datasets = []

        graph = Graph()

        # Removing rdf prefix in rdf:about prevents an error from rdflib.
        graph.parse(data=xml_response.replace('rdf:about', 'about'), format='xml')

        # Extracting collection
        collection_s = graph.value(predicate=RDF.type, object=DCAT.Dataset)
        collection = {
            'title': graph.value(subject=collection_s, predicate=DCTERMS.title).__str__(),
            'description': graph.value(subject=collection_s, predicate=DCTERMS.description).__str__(),
            'total_dataset_results': graph.value(subject=collection_s, predicate=CO.count).__str__()
        }

        # Extracting all metadata
        meta = {}
        for s, p, o in graph.triples((collection_s, None, None)):
            if p.__str__() in meta:
                # Concatenate
                meta[p.__str__()] = "%s, %s" % (meta[p.__str__()], o.__str__())
            else:
                meta[p.__str__()] = o.__str__()
            if p.__str__() == 'http://purl.org/ontology/co/core#count':
                collection['total_dataset_results'] = int(o)
        collection['meta'] = meta

        # Extracting datasets
        for s, p, o in graph.triples((None, RDF.type, OML.Observation)):
            dataset_s = s
            dataset = {
                'id': graph.value(subject=dataset_s, predicate=DCTERMS.identifier).__str__(),
                'geom': graph.value(subject=dataset_s, predicate=DCTERMS.spatial).__str__(),
                'icon': graph.value(subject=dataset_s, predicate=ATOM.icon).__str__(),
                'start': graph.value(subject=dataset_s, predicate=ICAL.start).__str__(),
                'end': graph.value(subject=dataset_s, predicate=ICAL.end).__str__()
            }
            datasets.append(dataset)

        return {'collection': collection, 'datasets': datasets}

    def get_raw_dataset(self, parent_id, id, mime_type='text/rdf+n3'):
        query = self.sparql_template_dataset.render(product_id=id)

        response = self._request(query, mime_type)

        graph = Graph()
        graph.parse(data=response, format='n3')

        uri = graph.value(predicate=DCTERMS.identifier, object=Literal(id, datatype=XSD.string))

        return {'subject_uri': uri, 'graph': response}

    def get_graph(self, subject_uri):
        """Given a uri, combines internal and external resources into a single graph.

        :param subject_uri: the given uri
        :return: the combined N3 formatted graph
        """

        def get_internal_graph(graph):
            # Internal graph: querying the endpoint.
            query = self.sparql_template_generic.render(subject_uri=subject_uri)
            strabon_response = self._request(query)
            graph.parse(data=strabon_response)

        def get_external_graph(graph):
            # External: check subject_uri is a url, retrieve the content if it is the case.
            parts = urlparse.urlparse(subject_uri)
            if not parts.scheme or not parts.netloc:
                return

            log.info('get_external_graph for subject_uri %s' % subject_uri)

            req = urllib2.Request(subject_uri)
            req.add_header('Accept', 'application/rdf+xml')

            try:
                resp = urllib2.urlopen(req)
                resp_content = resp.read()
                # Test if request succeeded and does not send back an html
                if resp.code == 200 and resp_content[:14] != '<!DOCTYPE html':
                    # If the content is RDF, then interpret it as a graph.
                    graph.parse(data=resp_content, format='xml')
                else:
                    log.info('cannot open as url: ' + subject_uri)
            except urllib2.HTTPError:
                log.info('Error getting external graph with uri %s' % subject_uri)
            except ParserError:
                log.info('unable to parse response from ' + subject_uri)

            # Add a triple with subject_uri as source.
            graph.add((URIRef(subject_uri), DC.source, Literal(subject_uri)))

        internal_graph = Graph()
        thread_internal_graph = Thread(target=get_internal_graph(internal_graph))
        thread_internal_graph.start()

        external_graph = Graph()
        thread_external_graph = Thread(target=get_external_graph(external_graph))
        thread_external_graph.start()

        thread_external_graph.join(self.timeout)
        thread_internal_graph.join(self.timeout)

        combined_graph = internal_graph + external_graph
        return combined_graph.serialize(format='n3')


import unittest


class Test(unittest.TestCase):
    def setUp(self):
        self.url = 'http://leo.spaceapplications.com/endpoint4/Describe'
        # Slovenia.
        self.geometryWKT_slovenia = 'POLYGON(( 13.806475 46.509306, 14.632472 46.431817, 15.137092 46.658703, 16.011664 46.683611, 16.202298 46.852386, 16.370505 46.841327, 16.564808 46.503751, 15.768733 46.238108, 15.67153 45.834154, 15.323954 45.731783, 15.327675 45.452316, 14.935244 45.471695, 14.595109 45.634941, 14.411968 45.466166, 13.71506 45.500324, 13.93763 45.591016, 13.69811 46.016778, 13.806475 46.509306))'
        # Paris.
        self.geometryWKT_paris = 'POINT(2.3488 48.8541)'
        # Landsat8 example.
        self.geometryWKT_landsat8 = 'POLYGON((-10 -10, 10 -10, 10 10, -10 10, -10 -10))'

    def testRequestsXML(self):
        strabon_endpoint = StrabonEndpoint('strabon', self.url, 60)
        # collections = strabon_endpoint.get_collections(eo__instrument = "OLI_TIRS")
        #
        # print collections
        #
        # for collection in collections:
        #     datasets = strabon_endpoint.get_collection_datasets(eo__parentIdentifier=collection['id'])
        #     pprint.pprint(datasets)

        # print  strabon_endpoint.get_raw_dataset(parent_id='L1GT', id='LC80860742015182LGN00')

        instrument_url_encoded = 'http%3A%2F%2Fgcmdservices.gsfc.nasa.gov%2Fkms%2Fconcept%2F13e3a08a-0d28-4e3f-a306-a20d9fb4fff8'
        # print strabon_endpoint.get_graph(urllib2.unquote(instrument_url_encoded))

    def test_get_graph(self):
        subject_uris = [
            'http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=LC80860742015182LGN00',
            'http://id.loc.gov/vocabulary/iso639-2/eng.rdf',
            'http://gcmdservices.gsfc.nasa.gov/kms/concept/e8a6f9ad-e376-495c-869e-3467526b49ec',
            'http://gcmdservices.gsfc.nasa.gov/kms/concept/13e3a08a-0d28-4e3f-a306-a20d9fb4fff8',
            'random_string']

        endpoint_name = 'strabon'
        endpoint_url = 'http://leo.spaceapplications.com/endpoint4/Describe'
        endpoint_timeout = 3
        strabon_endpoint = StrabonEndpoint(endpoint_name, endpoint_url, endpoint_timeout)

        for subject_uri in subject_uris:
            print 'testing get_graph for subject uri: ' + subject_uri
            print 'result: ' + strabon_endpoint.get_graph(subject_uri)


if __name__ == '__main__':
    unittest.main()
