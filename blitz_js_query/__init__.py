from promise import Promise
from socketIO_client_nexus import LoggingNamespace
from urllib.parse import urlparse

from .helpers import dict_merge
from .connection import Connection


class Blitz:
    def __init__(self, options):
        self.connection = None
        self.connecting = None

        # Merge default options with client options
        self.options = {
            # Resource config
            "api_url": "http://localhost:3010/",
            "auth_url": "http://localhost:3030/",

            # Connection Config
            "use_socket": False,
            "namespace": LoggingNamespace,

            # Authorization Config
            "user_key": None,
            "user_secret": None,
            "ignore_limiter": False
        }
        dict_merge(self.options, options)

        # Cut slash on auth url
        if self.options.get('auth_url')[-1:] == "/":
            self.options['auth_url'] = self.options['auth_url'][:-1]

        # Split up api url and port
        api_parse = urlparse(self.options.get("api_url"))
        if api_parse.port:
            self.options['api_port'] = api_parse.port
        elif not api_parse.port and not options.get('api_port'):
            self.options['api_port'] = 443
        self.options['api_url'] = api_parse.scheme + "://" + api_parse.hostname

        # Cast to str to support integer too
        self.options['api_port'] = str(self.options['api_port'])

        # Connect
        self.connect()

    '''
    Ensure connection is established, then fulfill request
    '''

    def sync(self, fn):
        if self.connecting:
            self.connecting.then(fn())
        else:
            fn()

    '''
    Connect by getting tokens and setting up clients
    '''

    def connect(self):
        self.connecting = Promise(lambda resolve, reject: connect_lambda(self, resolve, reject))

    '''
    Subscribe to certain endpoints
    '''

    def subscribe(self, endpoint):
        self.sync(lambda: self.emit('subscribe', endpoint))

    '''
    Event listening for socket.io
    '''

    def on(self, ev, fn):
        self.sync(lambda: self.connection.client.on(ev, fn))

    '''
    Expose socket client emit
    '''

    def emit(self, ev, data):
        self.sync(lambda: self.connection.client.emit(ev, data))

    '''
    RESTful methods for manual interaction
    '''

    def query(self, verb, query):
        return Promise(lambda resolve, reject: query_lambda(self, resolve, reject, verb, query))

    def get(self, query):
        return Promise(lambda resolve, reject: self.query('GET', query).then(lambda x: resolve(x)))

    def post(self, url, body):
        query = {
            'url': url,
            'body': body
        }
        return Promise(lambda resolve, reject: self.query('POST', query).then(lambda x: resolve(x)))

    def put(self, url, body):
        query = {
            'url': url,
            'body': body
        }
        return Promise(lambda resolve, reject: self.query('PUT', query).then(lambda x: resolve(x)))

    def patch(self, url, body):
        query = {
            'url': url,
            'body': body
        }
        return Promise(lambda resolve, reject: self.query('PATCH', query).then(lambda x: resolve(x)))

    def delete(self, url, body):
        query = {
            'url': url,
            'body': body
        }
        return Promise(lambda resolve, reject: self.query('DELETE', query).then(lambda x: resolve(x)))


def sync_lambda(self, resolve, reject, fn):
    self.connecting.then(lambda res: sync_lambda_then(self, resolve, reject, fn))


def sync_lambda_then(self, resolve, reject, fn):
    fn()
    resolve(None)


def connect_lambda(self, resolve, reject):
    self.connection = Connection(self.options)
    self.connection.connect().then(lambda x: connect_lambda_then(self, resolve, reject))


def connect_lambda_then(self, resolve, reject):
    self.connecting = None
    resolve(None)


def query_lambda(self, resolve, reject, verb, query):
    # Let connection handle request
    def fn():
        (self.connection.request(verb, query)
         .then(lambda x: resolve(x))
         .catch(lambda x: reject(x)))

    self.sync(fn)
