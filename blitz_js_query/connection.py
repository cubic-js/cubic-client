import requests
from promise import Promise
from socketIO_client_nexus import SocketIO
from threading import Timer

from .blitz_queue import Queue
from .auth import Auth


class Connection:
    def __init__(self, options):
        self.options = options
        self.subscriptions = []
        self.queue = Queue(options)
        self.auth = Auth(options)
        self.client = None
        self.http = None
        self.reconnecting = None

    '''
    Socket.io client with currently stored tokens
    '''
    def set_client(self):
        io_config = {
            'reconnection': False
        }
        if self.auth.access_token:
            io_config = {
                'query': 'bearer=' + self.auth.access_token,
                'reconnection': False  # Use own connect
            }

        # Connect to parent namespace
        self.client = SocketIO(self.options.get('api_url'), self.options.get('api_port'),
                               self.options.get('namespace'), params=io_config)

        self.client.on('disconnect', lambda: self.reconnect())

        # Resubscribe after disconnect
        self.resub()

        set_default_headers(self)

    '''
    Get tokens and build client
    '''
    def connect(self):
        return Promise(lambda resolve, reject: connect_lambda(self, resolve, reject))

    '''
    Close existing connection and start new with available tokens
    '''
    def reconnect(self):
        if self.reconnecting:
            return self.reconnecting
        else:
            self.reconnecting = Promise(lambda resolve, reject: reconnect_lambda(self, resolve, reject))
            return self.reconnecting

    '''
    Rejoin Socket.IO subscriptions after connection is lost
    '''
    def resub(self):
        self.client.on('subscribed', lambda *sub: resub_on_subscribed(self, sub))
        self.client.on('connect', lambda *x: resub_on_reconnect(self))

    '''
    Send request with error check
    '''
    def request(self, verb, query):
        return Promise(lambda resolve, reject: request_lambda(self, resolve, reject, verb, query))

    '''
    Actual request code
    '''
    def req(self, verb, query):
        return Promise(lambda resolve, reject: req_lambda(self, resolve, reject, verb, query))

    '''
    Handles error responses
    '''
    def err_check(self, res, verb, query):
        return Promise(lambda resolve, reject: err_check_lambda(self, resolve, reject, res, verb, query))


def set_default_headers(self):
    http_config = {}
    if self.auth.access_token:
        http_config = {
            'authorization': 'bearer ' + self.auth.access_token
        }
    self.http = requests.Session()
    self.http.headers.update(http_config)


def connect_lambda(self, resolve, reject):
    self.auth.authorize().then(lambda x: connect_lambda_then(self, resolve, reject))


def connect_lambda_then(self, resolve, reject):
    self.set_client()
    resolve(None)


def reconnect_lambda(self, resolve, reject):
    self.auth.reauthorize().then(lambda x: reconnect_lambda_then(self, resolve, reject))


def reconnect_lambda_then(self, resolve, reject):
    # Reconnect main client with new token
    if self.client.connected:
        self.client.disconnect()

    self.client.io.opts.query = None
    if self.auth.access_token:
        self.client.io.opts.query = 'bearer=' + self.auth.access_token

    self.client.connect()

    set_default_headers(self)

    self.client.once('connect', lambda *x: reconnect_lambda_then_once(self, resolve, reject))

    # Retry if server is unreachable
    t = Timer(1, reconnect_lambda_then_timer, args=(self, resolve, reject,))
    t.start()


def reconnect_lambda_then_once(self, resolve, reject):
    self.reconnecting = None
    resolve(None)


def reconnect_lambda_then_timer(self, resolve, reject):
    if not self.client.connected:
        self.reconnect().then(lambda x: resolve(None))


def resub_on_subscribed(self, sub):
    if sub not in self.subscriptions:
        self.subscriptions.append(sub)


def resub_on_reconnect(self):
    for i in range(len(self.subscriptions)):
        self.client.emit('subscribe', self.subscriptions[i])


def request_lambda(self, resolve, reject, verb, query):
    # Avoid rate limit errors if not disabled
    (self.queue.throttle().then(lambda x: self.req(verb, query))                  # Let connection send request
                          .then(lambda res: self.err_check(res, verb, query))     # Check if response is error
                          .then(lambda res: resolve(res))                         # Res is potentially modified
                          .catch(lambda err: reject(err)))


def req_lambda(self, resolve, reject, verb, query):
    # Socket request
    if self.options.get('use_socket'):
        self.client.emit(verb, query, lambda x: resolve(x))
        self.client.wait_for_callbacks(seconds=5)

    # HTTP request
    else:
        if isinstance(query, str):
            # Put url together
            query = self.options['api_url'] + ':' + self.options['api_port'] + query

            query = {
                'url': query
            }
        else:
            # Put url together
            query['url'] = self.options['api_url'] + ':' + self.options['api_port'] + query['url']

        # Request
        res = self.http.request(verb, query.get('url'), json=query.get('body'))

        # Prepare object and send back
        response = {
            'status_code': res.status_code,
            'sent': True,
            'body': res.text
        }
        resolve(response)


def err_check_lambda(self, resolve, reject, res, verb, query):
    # Format status code if necessary
    if res.get('statusCode'):
        res['status_code'] = res.pop('statusCode')

    # Response not 1xx, 2xx, 3xx?
    if res.get('body') and int(str(res.get('status_code'))[0]) > 3:
        # If expired: Get new token /w refresh token & retry method
        if 'jwt expired' in str(res.get('body')):
            (self.reconnect()

                # Retry original method
                .then(lambda x: self.request(verb, query))

                # Modify response for main
                .then(lambda x: resolve(x)))

        # Rate limited
        elif 'Rate limit' in str(res.get('body')) and not self.options.get('ignore_limiter'):
            # Rejection due to frequency
            if 'Request intervals too close' in str(res.get('body')):
                (self.queue.delay(self.queue.delay_diff)
                    .then(lambda x: self.request(verb, query))
                    .then(lambda x: resolve(x)))

            # Rejection due to empty token bucket
            if 'Max requests per interval reached' in str(res.get('body')):
                (self.queue.delay(self.queue.delay_max)
                    .then(lambda x: self.request(verb, query))
                    .then(lambda x: resolve(x)))

        # Nodes are busy
        elif 'Please try again' in str(res.get('body')):
            # Retry original method
            self.request(verb, query).then(lambda x: resolve(x))

        # Unhandled error
        else:
            reject(res)

    # No error
    else:
        resolve(res)
