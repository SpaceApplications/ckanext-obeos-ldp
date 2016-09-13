class URL:
    """Class for representing a URL in an opensearch v1.1 query"""

    def __init__(self, type='', template='', method='GET', rel=''):
        self.type = type
        self.template = template
        self.method = 'GET'
        self.params = []
        self.rel = rel
