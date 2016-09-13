import json
from logging import getLogger
import logging
import pprint
import re
import string
from dogpile.cache import make_region
import requests
import unittest
import sys
import os

__author__ = 'jglouis'

log = getLogger(__name__)


def my_key_generator(namespace, fn, **kw):
    def generate_key(*arg):
        return arg[0] + string.replace(arg[1], ' ', '_')

    return generate_key


region = make_region(function_key_generator=my_key_generator).configure(
    'dogpile.cache.pylibmc',
    expiration_time=100,
    arguments={
        'url': ["127.0.0.1"]
    }
)


@region.cache_on_arguments()
def get_disambiguation(query_resolver_url, query):
    """Ask the query resolver to disambiguate a query string.

    :param query_resolver_url: the address of query resolver
    :param query: the raw query string
    :return: dictionary containing the disambiguation parameters
    """
    params = {'q': query}
    request = requests.get(query_resolver_url, params=params)
    params = {}

    log.debug('Request to Query Resolver: %s' % request)
    log.debug('Response from Query Resolver:\n' + pprint.pformat(request.text))
    response = json.loads(request.text)

    # log.info(pprint.pformat(response))

    # Extract the parameters.
    # Parameters are divided in When, What and Where.
    if len(response['analyze']['Where']) > 0:
        response['analyze']['Where'] = response['analyze']['Where'][0]
    else:
        # Replace with an empty dict
        response['analyze']['Where'] = {}
    # Times are nested into another property that points to a list.
    if 'times' in response['analyze']['When']:
        response['analyze']['When'] = response['analyze']['When']['times'][0]

    for cat in ['When', 'What', 'Where']:
        # In Resto 2.1 API, the data structures in the JSON response change from objects to lists if the query
        # is an empty string. The lines below transform them back to python dictionaries, for consistency.
        if len(response['analyze'][cat]) == 0:
            response['analyze'][cat] = {}

        for k, v in response['analyze'][cat].items():
            if isinstance(v, basestring):
                key = k.replace(':', '__')

                # In case the value contains a "|", compute the longest common prefix (LCP)
                if '|' in v:
                    lcp = os.path.commonprefix(v.split('|'))
                    log.debug('Longest common prefix in %s => %s' % (v, lcp))
                    if len(lcp) > 3:
                        v = lcp
                    else:
                        # The longest common prefix is too short. Using only the first element
                        v = v.split('|')[0]

                val = v.replace('%', '')
                params[key] = val
                log.debug('Extracted %s: %s' % (key, val))

    # log.debug('Parameters returned from disambiguation:\n%s ' % pprint.pformat(params))
    return params


class Test(unittest.TestCase):
    def setUp(self):
        self.query_resolver_urls = [
            'http://obeos.spaceapplications.com/qa-resto/rest/2.1/api/query/analyze.json',
            # 'http://resto.mapshup.com/2.0/api/query/analyze.json'
        ]

        # Configure log handler if not already done.
        if len(log.handlers) == 0:
            log.debug('adding handler')
            self.handler = logging.StreamHandler(sys.stdout)
            log.addHandler(self.handler)
            log.level = logging.DEBUG

    def test_query_resolver(self):
        tests = [
            ('landsat october 2014 Belgium', {
                'time__start': '2014-10-01T00:00:00Z',
                'time__end': '2014-10-31T23:59:59Z',
                'geo__lat': '50.75',
                'geo__lon': '4.5',
                'eo__platform': 'LANDSAT'
            }),
            ('landsat', {
                'eo__platform': 'LANDSAT'
            }),
            ('Brussels 2011', {
                'time__start': '2011-01-01T00:00:00Z',
                'time__end': '2011-12-31T23:59:59Z',
                'geo__lat': '50.85045',
                'geo__lon': '4.34878',
            }),
            ('landsat october 2014 france flood', {
                'eo__platform': 'LANDSAT',
                'time__start': '2014-10-01T00:00:00Z',
                'time__end': '2014-10-31T23:59:59Z',
                'geo__lat': '46.0',
                'geo__lon': '2.0',
            })
        ]

        for query_resolver_url in self.query_resolver_urls:
            for test in tests:
                disambiguation_parameters = get_disambiguation(query_resolver_url, test[0])
                for key, expected in test[1].iteritems():
                    self.assertEqual(disambiguation_parameters[key], expected)

    def test_empty_query(self):
        """Test for an empty query string. The disambiguation should return an empty dictionary"""

        for query_resolver_url in self.query_resolver_urls:
            self.assertEqual((get_disambiguation(query_resolver_url, '')), {})
