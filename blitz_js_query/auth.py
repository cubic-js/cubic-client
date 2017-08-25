import requests
from promise import Promise
from threading import Timer


"""
Handles authorization on blitz auth-node and token handling via HTTP
"""


class Auth:
    def __init__(self, options):
        self.options = options
        self.auth_retry_count = 0
        self.access_token = None
        self.refresh_token = None
        self.refreshing = False

    '''
    Get tokens for API authentication if credentials provided
    '''
    def authorize(self):
        return Promise(lambda resolve, reject: authorize_lambda(self, resolve, reject))

    '''
    Refresh tokens if possible
    '''
    def reauthorize(self):
        return Promise(lambda resolve, reject: reauthorize_lambda(self, resolve, reject))

    '''
    Get token via http on /auth
    '''
    def get_token(self):
        return Promise(lambda resolve, reject: get_token_lambda(self, resolve, reject))

    '''
    Get new access token from refresh_token and save in object
    '''
    def get_refresh_token(self, retry=False):
        return Promise(lambda resolve, reject: get_refresh_token_lambda(self, resolve, reject, retry))


def authorize_lambda(self, resolve, reject):
    # Credentials provided
    if self.options.get('user_key') and self.options.get('user_secret'):
        self.get_token().then(lambda x: resolve(None))

    # No authentication
    else:
        resolve(None)


def reauthorize_lambda(self, resolve, reject):
    # Credentials provided
    if self.options.get('user_key') and self.options.get('user_secret'):
        self.get_refresh_token().then(lambda x: resolve(None))

    # No authentication
    else:
        resolve(None)


def get_token_lambda(self, resolve, reject):
    # Set authentication options
    auth_request = {
        'user_key': self.options.get('user_key'),
        'user_secret': self.options.get('user_secret')
    }

    # Send to /auth endpoint
    res = requests.request('POST', self.options.get('auth_url') + '/token', json=auth_request)

    if res.ok:
        content = res.json()

        # User authenticated
        if res.status_code == 200 or res.status_code == 304:
            self.access_token = content.get('access_token')
            self.refresh_token = content.get('refresh_token')
            self.auth_retry_count = 0
            resolve(None)

        # User not authenticated
        else:
            self.auth_retry_count += 1
            if self.auth_retry_count <= 5:
                self.get_token().then(lambda x: resolve(None))
            else:
                reject("blitz-query client could not authenticate after 5 attempts.")
                self.auth_retry_count = 0

    # Retry if no response
    else:
        t = Timer(50/1000, get_token_timer, args=(self, resolve, reject,))
        t.start()


def get_token_timer(self, resolve, reject):
    self.get_token().then(lambda x: resolve(None))


def get_refresh_token_lambda(self, resolve, reject, retry):
    # Ensure only one refresh process is done at a time
    if not self.refreshing or retry:
        self.refreshing = True

        # Set authentication options
        auth_request = {
            'refresh_token': self.refresh_token
        }

        # Send to /auth endpoint
        res = requests.request('POST', self.options.get('auth_url') + '/token', json=auth_request)

        if res.ok:
            content = res.json()
            self.access_token = content.get('access_token')
            self.refreshing = False
            resolve(None)

        # Retry if no response
        else:
            t = Timer(50/1000, get_refresh_token_timer, args=(self, resolve, reject,))
            t.start()

    # Already refreshing? -> Add to queue
    else:
        resolve(None)


def get_refresh_token_timer(self, resolve, reject):
    self.get_refresh_token(True).then(lambda x: resolve(None))
