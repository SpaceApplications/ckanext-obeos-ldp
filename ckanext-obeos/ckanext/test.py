import pprint
import unittest
import logging
from obeos.endpoint.fedeo import FedeoEndpoint


class Test(unittest.TestCase):
    def testRequestsXML(self):
        logging.basicConfig(level=logging.DEBUG)

        obeos_description_url = 'http://10.1.0.83/fedeodescription.xml'

        resto_response1 = {u'analyze': {u'geo:lat': u'50.75',
                                        u'geo:lon': u'4.5',
                                        u'geo:name': u'Belgium',
                                        u'geo:wkt': u'POLYGON(( 3.314971 51.345781, 4.047071 51.267259, 4.973991 51.475024, 5.606976 51.037298, 6.156658 50.803721, 6.043073 50.128052, 5.782417 50.090328, 5.674052 49.529484, 4.799222 49.985373, 4.286023 49.907497, 3.588184 50.378992, 3.123252 50.780363, 2.658422 50.796848, 2.513573 51.148506, 3.314971 51.345781))',
                                        u'language': u'en',
                                        u'searchTerms': u'',
                                        u'time:end': u'2014-12-31T23:59:59.999+01:00',
                                        u'time:start': u'2014-01-01T00:00:00.000+01:00'},
                           u'query': u'belgium 2014'}

        resto_response2 = {"query": "HRG SPOT6 paris france last month",
                           u"analyze": {
                                        "language": "en",
                               "eo:platform": "SPOT"},
                           "unProcessed": [""],
                           "remaining": "",
                           "queryAnalyzeProcessingTime": 0.00051712989807129}

        fedeoEndpoint = FedeoEndpoint('fedeo', obeos_description_url, 60)

        # for url in fedeoEndpoint.first_step_client.description.urls:
        #     print url.template
        #

        for result in fedeoEndpoint.get_collections(eo__platform='landsat'):
            pprint.pprint(result)

        pprint.pprint(fedeoEndpoint.get_collection_datasets(eo__parentIdentifier='LANDSAT.ETM.GTC', eo__platform='landsat'))

        # print fedeoEndpoint.get_raw_dataset('SEA_GEC_1P',
        #                                        'SE1_OPER_SEA_GEC_1P_19780818T224015_19780818T224025_000757_0028_2305_30D0')

if __name__ == '__main__':
    unittest.main()