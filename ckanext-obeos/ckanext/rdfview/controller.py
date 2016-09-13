import re
import urllib2

from logging import getLogger

import ckan.lib.base as base
import ckanext.obeos.plugin as obeos_plugin
from ckanext.lib.cache import Cache

__author__ = 'jglouis'

render = base.render
log = getLogger(__name__)

# cache mechansim for N3 Graphs
g_N3_cache = Cache(3600)

class NavigatorController(base.BaseController):
    def view(self, endpoint_name):

        log.info('Navigator Controller')
        extra = {'endpoint_name': endpoint_name}

        subject_uri = None

        # Get the subject uri.
        try:
            subject_uri = self._get_method_args()['environ']['paste.parsed_dict_querystring'][0]['subject_uri']
            extra['subject_uri'] = urllib2.unquote(subject_uri)
            extra['subject_uri_encoded'] = urllib2.quote(subject_uri)
        except Exception, e:
            log.info(e)

        # Get the is standalone boolean.
        isStandalone = "False"
        try:
            isStandalone = self._get_method_args()['environ']['paste.parsed_dict_querystring'][0]['is_standalone']
            extra['is_standalone'] = isStandalone
        except Exception, e:
            log.info(e)

        # If N3 Graph is not cached then cache it
        if not g_N3_cache[subject_uri]:
            log.debug('Cache a new version of: %s' % (subject_uri) )
            # Querying the endpoint to get a n3 graph.
            endpoint = obeos_plugin.endpoints_by_name[endpoint_name]

            log.info('extracting graph from subject_uri: ' + subject_uri)
            n3 = endpoint.get_graph(subject_uri).decode('utf8')

            log.info('n3 size: ' + str(len(n3)))
            # log.info(n3)

            # If the get_graph returns None, then abort.
            if n3 is None:
                return render('error_navigation.html', extra_vars=extra)

            # extra['raw_graph'] = n3.replace('\n', ' ')
            n3_escaped_graph = re.escape(n3)
            # Cache the N3
            g_N3_cache[subject_uri] = n3_escaped_graph
        else:
            log.debug('Use the cached version of : %s' % (subject_uri) )

        # Get the (newly or not) cached version of the N3 graph
        extra['raw_graph'] = g_N3_cache[subject_uri]

        if isStandalone == "True":
            template = "standalone_rdf_view.html"
        else:
            template = 'rdf_view.html'


        return render(template, extra_vars=extra)
