import abc
import codecs
import json
import os
import string
from logging import getLogger


# Fix: To avoid name collision between dogpile and dogpile.cache packages:
import sys
try:
    sys.path.remove('/usr/lib/ckan/default/lib/python2.7/site-packages/dogpile-0.2.2-py2.7.egg')                       
except:
    pass


from dogpile.cache import make_region

__author__ = 'jglouis'


log = getLogger(__name__)

def my_key_generator(namespace, fn, **kw):
    def generate_key(*args, **kwargs):
        return '%s:%s:%s' % (args[0].name, fn.__name__, string.replace(args[1], ' ', '_'))
    return generate_key


CONFIG_FILE_NAME = os.path.join(os.path.dirname(__file__), '../obeos_config.json')

cache_expiration_time = 100  # default expiration time

with codecs.open(CONFIG_FILE_NAME, 'r', encoding='utf-8') as cfg:
    config_data = json.load(cfg)
    cache_expiration_time = config_data['CACHE_EXPIRATION_TIME']
    log.info('Setting cache expiration time to %d' % cache_expiration_time)

region = make_region(function_key_generator=my_key_generator).configure(
    'dogpile.cache.pylibmc',
    expiration_time=cache_expiration_time,
    arguments={
        'url': ["127.0.0.1"]
    }
)


class Endpoint(object):
    """Endpoint is an abstract class representing a data endpoint from which dataset collections and datasets can be
    retrieved."""
    __metaclass__ = abc.ABCMeta

    def __init__(self, name, url, timeout, key_parameters):
        self.name = name
        self.url = url
        self.timeout = timeout
        self.key_parameters = key_parameters

    @abc.abstractmethod
    def get_collections(self, query, **kwargs):
        """Returns a list of dataset series, formatted as CKAN package dictionaries.

        :param kwargs: the query parameters (from disambiguation)
        :return: a list of dataset series
        """
        return

    @abc.abstractmethod
    def get_collection_datasets(self, **kwargs):
        """Returns the collection corresponding to the given id and the associated datasets.

        :param kwargs: the query parameters (eo__parentIdentifier parameter to pass the id of the collection)
        :return: {'collection': [collection], 'datasets': [datasets]}
        where collection is the dataset series structured as a CKAN package and
        where datsets is a list of associated datasets structured as CKAN resources.
        """
        return

    @abc.abstractmethod
    def get_raw_dataset(self, collection_id, product_id, mime_type='application/rdf+xml'):
        """Fetch the raw RDF graph corresponding to a given dataset.

        :param collection_id: the id of the parent collection
        :param product_id: the if of the dataset
        :param mime_type: the format of the returned graph
        :return: the rdf graph
        """
        return

    @abc.abstractmethod
    def get_graph(self, subject_uri):
        """Get a RDF graph given a subject URI.

        :param subject_uri: the given subject URI
        :return: a n3 formatted RDF graph
        """
        return

    def check_connectivity(self):
        """Check network connectivity with the endpoint.

        :return: True if the connectivity test passed, False otherwise
        """
        return True
