import json
import re
import urllib2
from logging import getLogger
import urlparse

import ckan
import genshi
import markdown
import ckan.lib.base as base
import requests
import time
from ckan.common import c, request, response
import ckan.lib.helpers as h
from ckanext.lib.cache import Cache

import plugin

__author__ = 'jglouis'

log = getLogger(__name__)

render = base.render
lookup_package_plugin = ckan.lib.plugins.lookup_package_plugin

g_N3_view_cache = Cache(3600)


def extract_pkg_dict(endpoint_name, collection_id, params={}):
    # Selecting the endpoint.
    endpoint = plugin.endpoints_by_name[endpoint_name]

    # Extract the datasets from the endpoint.
    collection_datasets = endpoint.get_collection_datasets(eo__parentIdentifier=collection_id, **params)
    if collection_datasets is None:
        return None
    collection = collection_datasets['collection']
    datasets = collection_datasets['datasets']

    # Building the CKAN resources the resources. Each dataset is becoming a CKAN resource.
    resources = []
    resources_json = []
    for dataset in datasets:
        resource = {
            'id': dataset.get('id', ''),
            'geometry': dataset.get('geom', ''),
            'description': dataset.get('id', ''),
            'name': dataset.get('id', ''),
            'format': u'rdf',
            'url': None,
            'tracking_summary': {'recent': 0, 'total': 0},
            'has_views': True,
            'views': [{'id': dataset.get('id', ''),
                       'title': dataset.get('id', ''),
                       'description': dataset.get('description', ''),
                       'view_type': 'rdf_view'}]}
        resources.append(resource)

        resource_json = {
            'label': dataset.get('id', ''),
            'url': plugin.resource_view_helper(endpoint_name, collection_id, dataset.get('id', '')),
            'icon': dataset.get('icon', ''),
            'start': dataset.get('start', ''),
            'end': dataset.get('end', '')
        }
        resources_json.append(resource_json)

    # Return the CKAN package.
    pkg = {u'author': None,
            u'author_email': None,
            u'creator_user_id': None,
            u'extras': [],
            u'groups': [],
            u'id': u'NA',
            u'isopen': True,
            u'license_id': u'other-open',
            u'license_title': u'Other (Open)',
            u'maintainer': None,
            u'maintainer_email': None,
            u'name': collection_id,
            u'notes': collection.get('description', ''),
            u'num_resources': len(resources),
            u'total_resources': collection.get('total_dataset_results', len(resources)),
            u'num_tags': 0,
            u'organization': None,
            u'owner_org': None,
            u'private': False,
            u'relationships_as_object': [],
            u'relationships_as_subject': [],
            u'resources': sorted(resources, key=lambda r: r['id']),
            u'resources_json': json.dumps(resources_json),
            u'state': u'active',
            u'title': collection.get('title', ''),
            u'tracking_summary': {'recent': 0, 'total': 0},
            u'type': u'virtual_dataset',
            u'endpoint_name': endpoint_name}

    # Show the endpoint name in the Dataset Details page
    pkg['extras'].append({u'key': u'Endpoint', u'value': endpoint_name})

    # Extracting meta info if any.
    # print collection
    if 'meta' in collection:
        for predicate, value in collection['meta'].iteritems():
            pkg['extras'].append({u'key': predicate, u'value': value})

    return pkg


def get_disambiguation_from_query_string(controller):
    """Get disambiguation parameters from the query string passed to the controller.

    :param controller: the BaseController CKAN instance
    :return: the parameters in a dictionary (empty if no query string)
    """
    if 'HTTP_REFERER' in controller._get_method_args()['environ']:
        raw_url = controller._get_method_args()['environ']['HTTP_REFERER']

        # Parsing the query string and extracting the 'q' argument.
        query_String = urlparse.parse_qs(urlparse.urlparse(raw_url)[4])
        if 'q' in query_String:
            query = query_String['q'][0]
        else:
            query = ''

        # Call the disambiguation
        result = plugin.get_disambiguation(plugin.QUERY_RESOLVER_URL, query)
        if result is None:
            result = {}
        return result

    else:
        return {}


class PackageController(base.BaseController):
    def view(self, endpoint_name, dataset_id):
        log.info('Package Controller')
        # Extract the query string 'q' argument, which contains the raw search query
        params = get_disambiguation_from_query_string(self)

        c.pkg_dict = extract_pkg_dict(endpoint_name, dataset_id, params)
        if c.pkg_dict is None:
            return render('error_display_collection.html', extra_vars={
                'endpoint_name': endpoint_name,
                'dataset_id': dataset_id
            })

        notes_formatted = markdown.markdown(c.pkg_dict.get('notes', ''))
        c.pkg_notes_formatted = genshi.HTML(notes_formatted)

        template = 'package/read.html'

        return render(template)


class ResourceController(base.BaseController):
    def view(self, endpoint_name, package_id, resource_name):
        # log.debug('Method view in ResourceController: %s / %s / %s' % (endpoint_name, package_id, resource_name))
        params = get_disambiguation_from_query_string(self)
        c.pkg_dict = extract_pkg_dict(endpoint_name, package_id, params)

        # Extract the resource with the given name.
        # log.debug('Resources: %s' % c.pkg_dict[u'resources'])
        c.resource = next((r for r in c.pkg_dict[u'resources'] if r[u'name'] == resource_name), {})
        c.package = c.pkg_dict

        # Inject template variable for the RDF viewer (endpoint name, subject uri, graph)
        extra = {'endpoint_name': endpoint_name}
        endpoint = plugin.endpoints_by_name[endpoint_name]
        extra['endpoint_name'] = endpoint_name
        dataset_uri = endpoint.get_raw_dataset(package_id, resource_name)
        extra['subject_uri'] = dataset_uri['subject_uri']

        subject_uri =dataset_uri['subject_uri']
        log.info('Fetching resource: %s' %(subject_uri))
        if subject_uri is not None:
            if not g_N3_view_cache[subject_uri]:
                log.debug('(View) Cache a new version of: %s' % (subject_uri) )
                N3graph = re.escape(endpoint.get_graph(subject_uri).decode('utf8'))
                g_N3_view_cache[subject_uri] = N3graph
            else:
                log.debug('(View) Use the cached version of : %s' % (subject_uri) )

            # Recover the value from the cache
            extra['raw_graph'] = g_N3_view_cache[subject_uri]

        # extra['raw_graph'] = re.escape(endpoint.get_graph(dataset_uri['subject_uri']).decode('utf8'))

        # Get the (newly or not) cached version of the N3 graph
        template = 'package/resource_read.html'
        return render(template, extra_vars=extra)

MAX_FILE_SIZE = 1024 * 1024 * 2  # 2MB
CHUNK_SIZE = 256

class OntologyServiceProxyController(base.BaseController):
    """
    This controller acts as a proxy to the ontology service to avoid the cross site scripting error.
    """
    def query(self):
        headers = {'Accept': 'application/xml'}
        params = {'query': self._py_object.request.params.get('query', '')}
        url = plugin.ONTOLOGY_SERVICE_URL + '/Query'

        start_time = time.time()
        log.debug('Requesting ontology service...')

        r = requests.get(url, params=params, headers=headers, stream=True)
        r.raise_for_status()
        #log.debug('URL sent to ontology service: %s' % r.url)

        elapsed_time = time.time() - start_time
        log.debug('Requesting ontology service: Done in %ss' % elapsed_time)

        base.response.headers = r.headers
        base.response.charset = r.encoding
        base.response.content_type = r.headers['content-type']
        del base.response.headers['Transfer-Encoding'] # Remove "chunked"

        length = 0
        for chunk in r.iter_content(chunk_size=CHUNK_SIZE):
            base.response.body_file.write(chunk)
            length += len(chunk)
            if length >= MAX_FILE_SIZE:
                base.abort(500, headers={'content-encoding': ''},
                    detail='Content is too large to be proxied.')
