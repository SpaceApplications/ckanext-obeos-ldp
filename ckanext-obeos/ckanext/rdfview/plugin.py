import logging

import ckan.plugins as plugins

__author__ = 'jglouis'

log = logging.getLogger(__name__)


class RdfView(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer, inherit=True)
    plugins.implements(plugins.IConfigurable, inherit=True)
    plugins.implements(plugins.IResourceView, inherit=True)
    plugins.implements(plugins.IRoutes, inherit=True)

    def before_map(self, map):
        navigator_controller = 'ckanext.rdfview.controller:NavigatorController'

        map.connect('navigator',
                    '/endpoint/{endpoint_name}/navigator',
                    controller=navigator_controller,
                    action='view')
        return map

    def update_config(self, config):

        # Integrating Matthieu's RDF viewer.
        plugins.toolkit.add_public_directory(config, 'public')
        plugins.toolkit.add_template_directory(config, 'public/templates')

    def info(self):
        return {'name': 'rdf_view',
                'title': plugins.toolkit._('RDF'),
                'icon': 'file-text-alt',
                'default_title': plugins.toolkit._('RDF'),
                }

    def can_view(self, data_dict):
        return True

    def setup_template_variables(self, context, data_dict):
        log.info(data_dict)
        raw_graph = data_dict['resource'].get('raw_graph', '')
        subject_uri = data_dict['resource'].get('subject_uri', '')
        endpoint_name = data_dict['package']['endpoint_name']

        return {
            'raw_graph': raw_graph.replace('\n', ' '),
            'subject_uri': subject_uri,
            'endpoint_name': endpoint_name
        }

    def view_template(self, context, data_dict):
        return 'rdf_view.html'

    def form_template(self, context, data_dict):
        return 'text_form.html'
