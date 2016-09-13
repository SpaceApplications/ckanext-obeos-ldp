from setuptools import setup, find_packages

version = '0.1'

setup(
    name='ckanext-obeos',
    version=version,
    description="CKAN Extension for OBEOS",
    long_description='''
    ''',
    classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    keywords='',
    author='SpaceApps',
    author_email='bernard.valentin@spaceapplications.com',
    url='http://obeos.spaceapplications.com',
    license='SpaceApps limited software license',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['ckanext', 'ckanext.obeos'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'requests', 'jinja2', 'requests_futures', 'dogpile.cache', 'pylibmc', 'rdflib', 'markdown',
        'genshi', 'dogpile'
    ],
    entry_points='''
        [ckan.plugins]
        # Add plugins here, e.g.
        # myplugin=ckanext.obeos.plugin:PluginClass
        obeos_core=ckanext.obeos.plugin:ObeosCorePlugin
        obeos_theme=ckanext.obeos.plugin:ObeosThemePlugin
        obeos_ontobrowser=ckanext.obeos.plugin:ObeosOntoBrowserPlugin
        rdf_view=ckanext.rdfview.plugin:RdfView
    ''',
)
