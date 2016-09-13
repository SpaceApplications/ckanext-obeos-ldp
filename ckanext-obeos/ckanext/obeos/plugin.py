# -*- coding: utf8 -*-
from __future__ import unicode_literals
from logging import getLogger
from threading import Thread

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
from routes import url_for

import ckanext.obeos.config as config

# Monkey patching

import ckan.logic as logic
from ckanext.obeos.query_resolver import get_disambiguation

old_check_access = logic.check_access


def check_access(action, context, data_dict=None):
    log.info('custom check_access')
    # If the dataset is virtual, then do always return True.
    if data_dict is not None and 'id' in data_dict and data_dict['id'] == 'NA':
        if action == 'package_update':
            log.info('package update denied')
            raise logic.NotAuthorized('Virtual package/resource')
        return True
    else:
        return old_check_access(action, context, data_dict=data_dict)


logic.check_access = check_access


__author__ = 'jgl'

log = getLogger(__name__)


# Registering the endpoints
###########################
config = config.Config()
QUERY_RESOLVER_URL = config.query_resolver_url
ONTOLOGY_SERVICE_URL = config.ontology_service_url
endpoints_by_name = config.endpoints_by_name


# Helper functions

def url_for_virtual_package(endpoint_name, package_id):
    return url_for('virtual_dataset', endpoint_name=endpoint_name, dataset_id=package_id)


def resource_view_helper(endpoint_name, package_id, resource_name):
    return url_for('virtual_resource', endpoint_name=endpoint_name, package_id=package_id, resource_name=resource_name)


def ontology_service_url_helper():
    return url_for('ontology_service')


class ObeosCorePlugin(plugins.SingletonPlugin):
    """
    Intercept search query and send it to resto.
    """
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.interfaces.IDatasetForm)
    plugins.implements(plugins.IAuthFunctions, inherit=True)
    plugins.implements(plugins.IRoutes, inherit=True)
    plugins.implements(plugins.ITemplateHelpers, inherit=True)

    def before_map(self, map):
        package_controller = 'ckanext.obeos.controller:PackageController'
        resource_controller = 'ckanext.obeos.controller:ResourceController'
        ontology_service_proxy_controller = 'ckanext.obeos.controller:OntologyServiceProxyController'
        map.connect('virtual_dataset', '/endpoint/{endpoint_name}/dataset/{dataset_id}', controller=package_controller,
                    action='view')
        map.connect('virtual_resource', '/endpoint/{endpoint_name}/dataset/{package_id}/resource/{resource_name}',
                    controller=resource_controller,
                    action='view')
        map.connect('ontology_service_query',
                    '/ontology_service/Query',
                    controller=ontology_service_proxy_controller,
                    action='query')
        map.connect('ontology_service',
                    '/ontology_service',
                    controller=ontology_service_proxy_controller,
                    action='query')
        return map

    def get_helpers(self):
        return {'resource_view_helper': resource_view_helper,
                'url_for_virtual_package': url_for_virtual_package,
                'ontology_service_url_helper': ontology_service_url_helper}

    def read_template(self):
        return 'package/read.html'

    def is_fallback(self):
        return False

    def package_types(self):
        return []

    def get_auth_functions(self):
        return {
            # Prevent registering.
            'user_create': {'success': False, 'msg': toolkit._('''You cannot register for this site.''')}
        }

    def before_view(self, pkg_dict):
        return pkg_dict

    def before_search(self, query):
        # results pagination.
        if 'rows' in query and 'start' in query:
            self.pagination_rows = query['rows']
            self.pagination_start = query['start']

        # Sorting
        sort = ''
        if 'sort' in query:
            sort = query['sort']

        if 'q' in query:
            # Plugin should not run when the startup page of CKAN is requested.
            if query['q'] == '*:*':
                return query

            log.info("Method 'before_search': extracted query is '%s'" % query['q'])
            params = get_disambiguation(QUERY_RESOLVER_URL, query['q'])
            self.results = self.get_results(query['q'], sort, **params)

        return query

    def after_search(self, search_results, search_params):
        if hasattr(self, 'results') and (self.results is not None):
            # pagination.
            page = self.results[self.pagination_start:self.pagination_start + self.pagination_rows]

            search_results['results'].extend(page)
            search_results['count'] += len(self.results)
        return search_results

    def get_results(self, query, sort, **params):

        self.results = []
        if len(params) != 0:  # Do not send a request when the dictionary is empty
            # go through the endpoints
            results = []

            # Creating separate threads for each endpoints
            query_threads = []
            for endpoint in endpoints_by_name.values():
                thread = Thread(target=query_endpoint, args=(results, endpoint, query, params))
                query_threads.append((thread, endpoint.timeout))  # Append a tuple (thread,timeout)
                thread.start()

            # Waiting for every thread to finish
            for query_thread in query_threads:
                query_thread[0].join(query_thread[1])

            desc = 'desc' in sort
            if 'title_string' in sort:
                results.sort(key=lambda item: item['title'], reverse=desc)

            return results

        return []

    def get_endpoints_by_name(self, endpoint_name):
        return endpoints_by_name[endpoint_name]


class ObeosThemePlugin(plugins.SingletonPlugin):
    """
    Theme plugin for OBEOS.
    """
    plugins.implements(plugins.IConfigurer)

    def update_config(self, config):
        toolkit.add_template_directory(config, 'templates')
        # For static files (e.g. images)
        # toolkit.add_public_directory(config, 'public')


def query_endpoint(results, endpoint, query, params):
    """
    Query an endpoint. Thread-safe.
    :param results: a list to which results are appended
    :param endpoint: the endpoint to query
    :param params: a dictionary with the query parameters
    :return:
    """
    log.info('Querying endpoint ' + endpoint.name + ' in a separate thread...')
    collections = endpoint.get_collections(query, **params)
    virtual_datasets = []
    for collection in collections:
        dataset = {'title': collection['title'],
                   'notes': collection['description'],
                   'id': collection['id'],
                   'endpoint_name': endpoint.name,
                   'type': 'virtual'}
        virtual_datasets.append(dataset)
        # log.info(dataset)

    # Lists in Python are thread safe so there is no need for a lock
    results += virtual_datasets


class ObeosOntoBrowserPlugin(plugins.SingletonPlugin):
    '''
Help: http://docs.ckan.org/en/847-new-theming-docs/theming.html
    '''

    # Declare that this class implements IConfigurer.
    plugins.implements(plugins.IConfigurer)

    def update_config(self, config):
        # Add this plugin's templates dir to CKAN's extra_template_paths, so
        # that CKAN will use this plugin's custom templates.
        toolkit.add_template_directory(config, 'templates')
        # For the OBEOS plugin JS and CSS files
        toolkit.add_resource('fanstatic/obeos', 'obeos')
        # For the cross-ontology browser JS and CSS files
        toolkit.add_resource('fanstatic/ontobrowser', 'obeos_ontobrowser')
