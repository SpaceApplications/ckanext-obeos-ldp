import codecs
import json
from logging import getLogger
import os
import urllib2
from endpoint.strabon import StrabonEndpoint
from endpoint.fedeo import FedeoEndpoint
import xml.etree.ElementTree as ET

__author__ = 'jglouis'

log = getLogger(__name__)

CONFIG_FILE_NAME = os.path.join(os.path.dirname(__file__), 'obeos_config.json')
QUERY_RESOLVER_URL = 'QUERY_RESOLVER_URL'
ONTOLOGY_SERVICE_URL = 'ONTOLOGY_SERVICE_URL'
ENDPOINTS = 'ENDPOINTS'
STRING_TO_ENDPOINT = {
    'strabon': StrabonEndpoint,
    'fedeo': FedeoEndpoint
}

# Namespaces to parse the DCAT file
dcat_ns = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dcat': 'http://www.w3.org/ns/dcat#',
    'dct': 'http://purl.org/dc/terms/'
}


def check_endpoint_connectivity(endpoint):
    """Trigger the endpoint connectivity check. Log an error if the check fails.

    :param endpoint: the endpoint to check
    :return:
    """
    if endpoint.check_connectivity():
        log.info('Check connectivity successed with endpoint %s' % endpoint.name)
    else:
        log.error('Check connectivity failed with endpoint %s' % endpoint.name)


class Config(object):
    """Config is responsible for parsing configuration info for the OBEOS plugin.

    The configuration file is named 'obeos_config.json'.
    Object is supposed to be instanced only once.
    """

    def __init__(self):
        self._parse_config()

    def _parse_config(self):
        """Parse the JSON config file and load it into the following variables:

        * self.query_resolver_url
        * self.ontology_service_url
        * self.endpoints_by_name: dictionary containing the endpoint objects (see endpoint.py)
        """

        # Loading config file
        with codecs.open(CONFIG_FILE_NAME, 'r', encoding='utf-8') as cfg:
            config_data = json.load(cfg)

        # Creating the endpoints
        endpoints_by_name = {}  # dictionary of endpoints by name
        for endpoint_types in config_data[ENDPOINTS]:
            endpoint_type = endpoint_types['type']
            for endpoint_json in endpoint_types['endpoints']:
                # Extract endpoint info from json data
                endpoint_name = endpoint_json['name']
                endpoint_url = endpoint_json.get('url', None)
                endpoint_timeout = endpoint_json['timeout']
                endpoint_dcat = endpoint_json.get('dcat', None)
                endpoint_key_parameters = endpoint_json.get('key_parameters', [])

                # Create an instance of the endpoint
                if endpoint_type in STRING_TO_ENDPOINT:

                    # In case a DCAT is given, parse it and create as many endpoints
                    if endpoint_dcat is not None:
                        try:
                            try:
                                dcat = urllib2.urlopen(endpoint_dcat)
                            except urllib2.URLError:
                                log.error('Cannot retrieve dcat for endpoint %s' % endpoint_name)
                                continue

                            root = ET.fromstring(dcat.read())
                            for dataset in root.findall('dcat:Catalog/dcat:dataset', dcat_ns):
                                url = dataset.find('dcat:Dataset/dcat:distribution/dcat:Distribution/dcat:accessURL', dcat_ns)
                                identifier = dataset.find('dcat:Dataset/dct:identifier', dcat_ns)
                                name = endpoint_name + '__' + identifier.text
                                log.info('Creating endpoint ' + name + ' of type ' + endpoint_type + ' with url: ' + url.text)
                                endpoint = STRING_TO_ENDPOINT[endpoint_type](name, url.text, endpoint_timeout, endpoint_key_parameters)

                                # Check connectivity
                                check_endpoint_connectivity(endpoint)

                                endpoints_by_name[endpoint.name] = endpoint
                                
                        except urllib2.HTTPError, e:
                            log.error(
                                'Problem reaching a resource while creating endpoint(s) for DCAT: ' + endpoint_dcat)
                            log.error('HTTP error: ' + e.msg)

                    # In case a URL is given, a single endpoint is created
                    if endpoint_url is not None:
                        try:
                            log.info(
                                'Creating endpoint ' + endpoint_name + ' of type ' + endpoint_type + ' with URL: ' + endpoint_url)
                            endpoint = STRING_TO_ENDPOINT[endpoint_type](endpoint_name, endpoint_url, endpoint_timeout, endpoint_key_parameters)

                            # Check connectivity
                            check_endpoint_connectivity(endpoint)

                            # Append the endpoints to the list of endpoints
                            endpoints_by_name[endpoint_name] = endpoint
                        except urllib2.HTTPError, e:
                            log.error('Could not initialize endpoint ' + endpoint_name)
                            log.error('Problem trying to reach URL ' + endpoint_url)
                            log.error('HTTP error: ' + e.msg)

                else:
                    log.error(endpoint_type + ' is not a recognizable endpoint type.')
                    log.error('Possible values for endpoints are: ' + str(STRING_TO_ENDPOINT.keys()))

        self.query_resolver_url = config_data[QUERY_RESOLVER_URL]
        self.ontology_service_url = config_data[ONTOLOGY_SERVICE_URL]
        self.endpoints_by_name = endpoints_by_name

    def __str__(self):
        str = 'Query Resolver URL: ' + self.query_resolver_url
        str += ', Ontology Service URL: ' + self.ontology_service_url
        str += ', Endpoints: ' + self.endpoints_by_name.__str__()
        return str


if __name__ == '__main__':
    print Config()
