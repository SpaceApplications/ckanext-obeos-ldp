import datetime
import unittest
import time

__author__ = 'jglouis'


class Cache(object):
    """A Simple single threaded cache system with time expiration mechanism."""
    def __init__(self, expiration_time):
        """
        Initialize a Cache with a customizable expiration time for the key-value pairs.

        :param expiration_time: expiration time in seconds
        :return: a Cache object
        """
        self.cache_dict = {}
        self.expiration_time = datetime.timedelta(seconds=expiration_time)

    def get(self, key, default=None):
        """
        Get the value corresponding to the key.

        :param key: the key
        :param default: the default value to return if the key does not exist, None by default.
        :return: The correponding value, None, if it is not in the cache or it has expired.
        """
        self.housekeep()
        return self.cache_dict.get(key, (default, None))[0]

    def set(self, key, value):
        """
        Set a key-value pair in the cache.

        :param key: the key
        :param value: the value
        """
        self.housekeep()

        # Set value and timestamp
        self.cache_dict[key] = (value, datetime.datetime.now())

    def housekeep(self):
        """Delete expired key-value pairs."""
        # Check if keys have expired
        new_cache_dict = {}
        for key, value in self.cache_dict.iteritems():
            if datetime.datetime.now() - value[1] < self.expiration_time:
                new_cache_dict[key] = value

        self.cache_dict = new_cache_dict

    def __getitem__(self, item):
        self.housekeep()
        return self.cache_dict.get(item, (None, None))[0]

    def __setitem__(self, key, value):
        self.housekeep()
        # Set value and timestamp
        self.cache_dict[key] = (value, datetime.datetime.now())


class Test(unittest.TestCase):
    def test_get_set(self):
        cache = Cache(60)
        cache.set('hello', 'world')
        self.assertEquals('world', cache.get('hello'))

    def test_get_set_with_expiration(self):
        cache = Cache(1)
        cache.set('hello', 'world')
        time.sleep(2)
        self.assertEquals('not present', cache.get('hello', default='not present'))

    def test_get_set_item(self):
        cache = Cache(60)
        cache['hello'] = 'world'
        self.assertEquals('world', cache['hello'])

    def test_get_set_item_with_expiration(self):
        cache = Cache(1)
        cache['hello'] = 'world'
        time.sleep(2)
        self.assertEquals(None, cache['hello'])
