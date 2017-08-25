from unittest import TestCase
import warnings

from blitz_js_query import Blitz


warnings.simplefilter('ignore', ResourceWarning)


class TestHttp(TestCase):
    def test_foo(self):
        """ it should return a dict """
        blitz_api = Blitz({
            'use_socket': False
        })
        blitz_api.connect()
        blitz_api.get("/foo").then(lambda res: self.assertTrue(isinstance(res, int)))
