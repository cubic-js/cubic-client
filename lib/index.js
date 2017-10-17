'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();



var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var request$1 = require('request-promise');
var timeout$1 = function timeout(fn, s) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(fn());
    }, s);
  });
};
var Auth = function () {
  function Auth(options) {
    classCallCheck(this, Auth);
    this.options = options;
    this.authRetryCount = 0;
  }
  createClass(Auth, [{
    key: 'authorize',
    value: function () {
      var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.options.user_key && this.options.user_secret)) {
                  _context.next = 2;
                  break;
                }
                return _context.abrupt('return', this.getToken());
              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function authorize() {
        return _ref.apply(this, arguments);
      }
      return authorize;
    }()
  }, {
    key: 'reauthorize',
    value: function () {
      var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(this.options.user_key && this.options.user_secret)) {
                  _context2.next = 2;
                  break;
                }
                return _context2.abrupt('return', this.refreshToken());
              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function reauthorize() {
        return _ref2.apply(this, arguments);
      }
      return reauthorize;
    }()
  }, {
    key: 'getToken',
    value: function () {
      var _ref3 = asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var _this = this;
        var auth_request, post_options, res, t;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                auth_request = {
                  user_key: this.options.user_key,
                  user_secret: this.options.user_secret
                };
                post_options = {
                  method: 'post',
                  body: auth_request,
                  json: true
                };
                _context3.prev = 2;
                _context3.next = 5;
                return request$1(this.options.auth_url + '/authenticate', post_options);
              case 5:
                res = _context3.sent;
                this.access_token = res.access_token;
                this.refresh_token = res.refresh_token;
                _context3.next = 15;
                break;
              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3['catch'](2);
                t = _context3.t0.error.reason ? parseInt(_context3.t0.error.reason.replace(/[^0-9]+/g, '')) : 5000;
                _context3.next = 15;
                return timeout$1(function () {
                  return _this.getToken(_this.options.user_key, _this.options.user_secret);
                }, t);
              case 15:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[2, 10]]);
      }));
      function getToken() {
        return _ref3.apply(this, arguments);
      }
      return getToken;
    }()
  }, {
    key: 'refreshToken',
    value: function () {
      var _ref4 = asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var _this2 = this;
        var auth_request, post_options, res, t;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (this.refreshing) {
                  _context4.next = 18;
                  break;
                }
                this.refreshing = true;
                auth_request = {
                  refresh_token: this.refresh_token
                };
                post_options = {
                  method: 'post',
                  body: auth_request,
                  json: true
                };
                _context4.prev = 4;
                _context4.next = 7;
                return request$1(this.options.auth_url + '/refresh', post_options);
              case 7:
                res = _context4.sent;
                this.access_token = res.access_token;
                this.refreshing = false;
                _context4.next = 18;
                break;
              case 12:
                _context4.prev = 12;
                _context4.t0 = _context4['catch'](4);
                this.refreshing = false;
                t = _context4.t0.error.reason ? parseInt(_context4.t0.error.reason.replace(/[^0-9]+/g, '')) : 5000;
                _context4.next = 18;
                return timeout$1(function () {
                  return _this2.refreshToken();
                }, t);
              case 18:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[4, 12]]);
      }));
      function refreshToken() {
        return _ref4.apply(this, arguments);
      }
      return refreshToken;
    }()
  }]);
  return Auth;
}();

var io = require('socket.io-client');
var request = require('request-promise');
var queue = require('async-delay-queue');
var timeout = function timeout(fn, s) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(fn());
    }, s);
  });
};
var Connection = function () {
  function Connection(options) {
    classCallCheck(this, Connection);
    this.options = options;
    this.subscriptions = [];
    this.queue = queue;
    this.auth = new Auth(options);
  }
  createClass(Connection, [{
    key: 'setClient',
    value: function setClient() {
      var _this = this;
      var sioConfig = this.auth.access_token ? {
        query: 'bearer=' + this.auth.access_token
      } : {};
      this.client = io.connect(this.options.api_url + this.options.namespace, sioConfig);
      this.client.on('disconnect', function () {
        _this.reload();
      });
      this.resub();
      var httpConfig = this.auth.access_token ? {
        headers: {
          authorization: 'bearer ' + this.auth.access_token
        }
      } : {};
      this.http = request.defaults(httpConfig);
    }
  }, {
    key: 'connect',
    value: function () {
      var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var _this2 = this;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.auth.authorize().then(function () {
                  return _this2.setClient();
                });
              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function connect() {
        return _ref.apply(this, arguments);
      }
      return connect;
    }()
  }, {
    key: 'reload',
    value: function reload() {
      if (!this.reconnecting) {
        this.reconnecting = this.reconnect();
      }
      return this.reconnecting;
    }
  }, {
    key: 'reconnect',
    value: function () {
      var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _this3 = this;
        var httpConfig;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.client.disconnect();
                _context2.next = 3;
                return this.auth.reauthorize();
              case 3:
                this.client.io.opts.query = this.auth.access_token ? 'bearer=' + this.auth.access_token : null;
                this.client.connect();
                httpConfig = this.auth.access_token ? {
                  headers: {
                    authorization: 'bearer ' + this.auth.access_token
                  }
                } : {};
                this.http = request.defaults(httpConfig);
                this.client.once('connect', function () {
                  _this3.reconnecting = null;
                });
                _context2.next = 10;
                return timeout(function () {
                  return _this3.client.connected ? null : _this3.reload();
                }, 5000);
              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function reconnect() {
        return _ref2.apply(this, arguments);
      }
      return reconnect;
    }()
  }, {
    key: 'resub',
    value: function resub() {
      var _this4 = this;
      this.client.on('subscribed', function (sub) {
        if (!_this4.subscriptions.includes(sub)) _this4.subscriptions.push(sub);
      });
      this.client.on('connect', function () {
        _this4.subscriptions.forEach(function (sub) {
          return _this4.client.emit('subscribe', sub);
        });
      });
    }
  }, {
    key: 'request',
    value: function () {
      var _ref3 = asyncToGenerator(regeneratorRuntime.mark(function _callee3(verb, query) {
        var _this5 = this;
        var delay, res;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                delay = this.options.ignore_limiter ? 0 : 20;
                _context3.next = 3;
                return this.queue.delay(function () {
                  return _this5.req(verb, query);
                }, delay);
              case 3:
                res = _context3.sent;
                return _context3.abrupt('return', this.errCheck(res, verb, query));
              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));
      function request(_x, _x2) {
        return _ref3.apply(this, arguments);
      }
      return request;
    }()
  }, {
    key: 'req',
    value: function () {
      var _ref4 = asyncToGenerator(regeneratorRuntime.mark(function _callee4(verb, query) {
        var _this6 = this;
        var req_options;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!this.options.use_socket) {
                  _context4.next = 4;
                  break;
                }
                return _context4.abrupt('return', new Promise(function (resolve) {
                  return _this6.client.emit(verb, query, resolve);
                }));
              case 4:
                if (typeof query === 'string') {
                  query = {
                    url: query
                  };
                }
                req_options = {
                  method: verb,
                  url: this.options.api_url + query.url,
                  body: query.body,
                  json: true
                };
                return _context4.abrupt('return', this.http(req_options));
              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));
      function req(_x3, _x4) {
        return _ref4.apply(this, arguments);
      }
      return req;
    }()
  }, {
    key: 'retry',
    value: function () {
      var _ref5 = asyncToGenerator(regeneratorRuntime.mark(function _callee5(res, verb, query) {
        var _this7 = this;
        var delay, reres;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                delay = parseInt(res.body.reason.replace(/[^0-9]+/g, '')) || 500;
                _context5.next = 3;
                return this.queue.delay(function () {
                  return _this7.req(verb, query);
                }, delay, 30000, 'unshift');
              case 3:
                reres = _context5.sent;
                return _context5.abrupt('return', this.errCheck(reres, verb, query));
              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));
      function retry(_x5, _x6, _x7) {
        return _ref5.apply(this, arguments);
      }
      return retry;
    }()
  }, {
    key: 'errCheck',
    value: function () {
      var _ref6 = asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
        var res = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var verb = arguments[1];
        var query = arguments[2];
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(res.body && parseInt(res.statusCode.toString()[0]) > 3)) {
                  _context6.next = 20;
                  break;
                }
                if (!(typeof res.body === 'string' && res.body.includes('jwt expired'))) {
                  _context6.next = 5;
                  break;
                }
                _context6.next = 4;
                return this.reload();
              case 4:
                return _context6.abrupt('return', this.request(verb, query));
              case 5:
                try {
                  res.body = JSON.parse(res.body);
                } catch (err) {}
                if (!(res.body.error && res.body.error.includes('Rate limit') && !this.options.ignore_limiter)) {
                  _context6.next = 13;
                  break;
                }
                if (!res.body.reason.includes('Request intervals too close')) {
                  _context6.next = 9;
                  break;
                }
                return _context6.abrupt('return', this.retry(res, verb, query));
              case 9:
                if (!res.body.reason.includes('Max requests per interval reached')) {
                  _context6.next = 11;
                  break;
                }
                return _context6.abrupt('return', this.retry(res, verb, query));
              case 11:
                _context6.next = 18;
                break;
              case 13:
                if (!(res.statusCode === 503)) {
                  _context6.next = 17;
                  break;
                }
                return _context6.abrupt('return', this.request(verb, query));
              case 17:
                return _context6.abrupt('return', res);
              case 18:
                _context6.next = 21;
                break;
              case 20:
                return _context6.abrupt('return', this.parse(res));
              case 21:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));
      function errCheck() {
        return _ref6.apply(this, arguments);
      }
      return errCheck;
    }()
  }, {
    key: 'parse',
    value: function parse(res) {
      try {
        return JSON.parse(res.body);
      } catch (e) {
        return res.body;
      }
    }
  }]);
  return Connection;
}();

var Blitz = function () {
  function Blitz(options) {
    classCallCheck(this, Blitz);
    this.connecting = null;
    this.options = Object.assign({
      api_url: 'http://localhost:3010/',
      auth_url: 'http://localhost:3030/',
      use_socket: true,
      namespace: '/',
      user_key: null,
      user_secret: null,
      ignore_limiter: false
    }, options);
    var api = this.options.api_url;
    var auth = this.options.auth_url;
    this.options.api_url = api[api.length - 1] === '/' ? api.slice(0, -1) : api;
    this.options.auth_url = auth[auth.length - 1] === '/' ? auth.slice(0, -1) : auth;
    this.connect();
  }
  createClass(Blitz, [{
    key: 'connect',
    value: function () {
      var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.connection = new Connection(this.options);
                this.connecting = this.connection.connect();
                _context.next = 4;
                return this.connecting;
              case 4:
                this.connecting = null;
              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function connect() {
        return _ref.apply(this, arguments);
      }
      return connect;
    }()
  }, {
    key: 'subscribe',
    value: function () {
      var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2(endpoint) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.connecting;
              case 2:
                this.emit('subscribe', endpoint);
              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function subscribe(_x) {
        return _ref2.apply(this, arguments);
      }
      return subscribe;
    }()
  }, {
    key: 'on',
    value: function () {
      var _ref3 = asyncToGenerator(regeneratorRuntime.mark(function _callee3(ev, func) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.connecting;
              case 2:
                this.connection.client.on(ev, func);
              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));
      function on(_x2, _x3) {
        return _ref3.apply(this, arguments);
      }
      return on;
    }()
  }, {
    key: 'emit',
    value: function () {
      var _ref4 = asyncToGenerator(regeneratorRuntime.mark(function _callee4(ev, data) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.connecting;
              case 2:
                this.connection.client.emit(ev, data);
              case 3:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));
      function emit(_x4, _x5) {
        return _ref4.apply(this, arguments);
      }
      return emit;
    }()
  }, {
    key: 'query',
    value: function () {
      var _ref5 = asyncToGenerator(regeneratorRuntime.mark(function _callee5(verb, _query) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.connecting;
              case 2:
                return _context5.abrupt('return', this.connection.request(verb, _query));
              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));
      function query(_x6, _x7) {
        return _ref5.apply(this, arguments);
      }
      return query;
    }()
  }, {
    key: 'get',
    value: function get$$1(query) {
      return this.query('GET', query);
    }
  }, {
    key: 'post',
    value: function post(url, body) {
      var query = {
        url: url,
        body: body
      };
      return this.query('POST', query);
    }
  }, {
    key: 'put',
    value: function put(url, body) {
      var query = {
        url: url,
        body: body
      };
      return this.query('PUT', query);
    }
  }, {
    key: 'patch',
    value: function patch(url, body) {
      var query = {
        url: url,
        body: body
      };
      return this.query('PATCH', query);
    }
  }, {
    key: 'delete',
    value: function _delete(url, body) {
      var query = {
        url: url,
        body: body
      };
      return this.query('DELETE', query);
    }
  }]);
  return Blitz;
}();
module.exports = Blitz;
//# sourceMappingURL=index.js.map
