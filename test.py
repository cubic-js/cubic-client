from blitz_js_query import Blitz
import time

blitz_api = Blitz({
    "api_url": "http://localhost",
    "api_port": "3010",
    "auth_url": "http://localhost:3030/",
    "user_key": "xlLQF2G5aBbw1zJCW6o5rmVwj0cpU6JYPB3Kk6sbLoRZYKjxQBJM4U3j0pFsTYxs",
    "user_secret": "FMSDo498MV73DnKIehJ9rOJfJ30yWYyaPYXrlv6iyJizbDHxrcoRikmNJHs8icHF",
    #"use_socket": False
})
blitz_api.get("/foo").then(lambda res: print(res))


time.sleep(15)

blitz_api.get("/foo").then(lambda res: print(res))
blitz_api.get("/foo").then(lambda res: print(res))
