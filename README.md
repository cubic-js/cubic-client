[![Nexus Stats API Package](/banner.png)](https://github.com/nexus-devs)

<p align="center">Python package to connect to <a href="https://github.com/nexus-devs/blitz.js">blitz.js</a> API nodes.</p>
<p align="center">Due to the engine change in Socket.io 2.x, using sockets may result in strange behaviour.</p>

##

<br>

## Installation
`pip install blitz_js_query`

<br>

## Usage
```python
from blitz_js_query import Blitz

blitz_api = Blitz({
    "api_url": "https://api.nexus-stats.com:443"
})

blitz_api.get("/foo").then(lambda res: print(res))
# Result: {'status_code': 200, 'sent': True, 'body': 'bar'}
```

<br>

## Configuration
```python
from blitz_js_query import Blitz

blitz_js_query = Blitz({key: value})
```

| Key           | Default         | Description   |
|:------------- |:------------- |:------------- |
| api_url | "http://localhost:3010/" | URL of blitz.js API-Node to connect to |
| auth_url | "http://localhost:3030/" | URL of blitz.js Auth-Node to authenticate with |
| use_socket | False | Whether or not to use Socket.io as standard request engine. Setting to false uses http. Subscriptions will use Socket.io regardless. |
| namespace | LoggingNamespace | Socket.io namespace to connect to |
| user_key | None | User key obtained via Auth-Node registration |
| user_secret | None | User secret obtained via Auth-Node |
| ignore_limiter | False | Whether or not to disable the default rate limit adaptions. Disabling this only makes sense if you connect as a user who won't face rate limits. If you disable it anyway, expect all your requests to get blocked. |

<br>
<br>

## API

### RESTful methods
```python
blitz_api.get(url)
```
>Sends a GET request to the API-Node

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| url | URL to request, without domain. e.g. `/foo`. | None |

<br>

```python
blitz_api.post(url, body)
```
>Sends a POST request to the API-Node

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| url | URL to request, without domain. e.g. `/foo`. | None |
| body | Data to send to endpoint. Can be any data type. | None |

<br>

```python
blitz_api.put(url, body)
```
>Sends a PUT request to the API-Node

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| url | URL to request, without domain. e.g. `/foo`. | None |
| body | Data to send to endpoint. Can be any data type. | None |

<br>

```python
blitz_api.patch(url, body)
```
>Sends a PATCH request to the API-Node

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| url | URL to request, without domain. e.g. `/foo`. | None |
| body | Data to send to endpoint. Can be any data type. | None |

<br>

```js
blitz_api.delete(url, body)
```
>Sends a DELETE request to the API-Node

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| url | URL to request, without domain. e.g. `/foo`. | None |
| body | Data to send to endpoint. Can be any data type. | None |

<br>

### Socket.io

```python
blitz_api.subscribe(endpoint)
```
>Subscribe to updates on a specific endpoint. Updates can be listened to via `blitz.on(endpoint, fn)`.

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| endpoint | URL to listen for updates on, without domain. e.g. `/foo` | None |

<br>

```python
blitz_api.on(ev, fn)
```
>Listens to specific Socket.io event, then runs the given function with the received data

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| ev | Event name. | None |
| fn | Function to execute on event trigger | None |

<br>

```python
blitz_api.emit(ev, data)
```
>Emits event via Socket.io client to server

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| ev | Event name. | None |
| data | Data to transmit. Can be any data type. | None |


<br>

## License
[MIT](https://github.com/nexus-devs/pip-blitz-query/blob/master/LICENSE.md)