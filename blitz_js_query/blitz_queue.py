from promise import Promise
from threading import Timer
import time


"""
Delay Queue to avoid rate limits
Note: Requests are handled through async delay states, not an an actual queue list
"""


class Queue:
    # Set queue timings
    def __init__(self, options):
        # Delay timers for no token
        self.delay_diff = 50
        self.delay_max = 10000

        # Ignore limiter
        if options.get('ignore_limiter'):
            self.delay_diff = 0
            self.delay_max = 0

        # With token provided
        elif options.get('user_key'):
            self.delay_diff = 50
            self.delay_max = 10000

        # Queue counter
        self.length = 1

        # Queue states
        self.next_created_at = 0
        self.next_shift_at = 0

    '''
    Makes sure limiter isn't triggered since last request
    '''
    def throttle(self):
        return Promise(lambda resolve, reject: throttle_lambda(self, resolve, reject))

    '''
    Manages interval delays for rate limiting (coupled with self.throttle())
    '''
    def delay(self, delay):
        return Promise(lambda resolve, reject: delay_lambda(self, resolve, reject, delay))


def throttle_lambda(self, resolve, reject):
    now = time.time() * 1000

    # Set time until next interval
    if not self.next_shift_at:
        next_shift = 0
    else:
        next_shift = self.next_shift_at - now

    # Check time between now and next available call
    until_next_shift = now - self.next_created_at - next_shift

    # Set new last request date
    self.next_created_at = now

    # Calculate waiting delay
    delay = self.length * self.delay_diff + next_shift

    # Min diff is met
    if until_next_shift > self.delay_diff:
        resolve(None)

    # Otherwise, wait for delay difference
    else:
        self.length += 1

        # Resolve promise & sub ongoing
        t = Timer(delay / 1000, throttle_timer, args=(self, resolve, reject, now, next_shift,))
        t.start()


def throttle_timer(self, resolve, reject, now, next_shift):
    # Get current expected interval resolution
    if not self.next_shift_at:
        current_shift = 0
    else:
        current_shift = self.next_shift_at - now

    # Finished while waiting for next interval -> repeat
    if current_shift > next_shift:
        self.throttle().then(lambda res: throttle_timer_lambda(self, resolve, reject))
    # Finished without waiting for interval
    else:
        self.length -= 1
    resolve(None)


def throttle_timer_lambda(self, resolve, reject):
    self.length -= 1
    resolve(None)


def delay_lambda(self, resolve, reject, delay):
    self.next_shift_at = time.time() + delay

    t = Timer(delay / 1000, delay_timer, args=(self, resolve, reject,))
    t.start()


def delay_timer(self, resolve, reject):
    self.next_shift_at = 0
    resolve(None)
