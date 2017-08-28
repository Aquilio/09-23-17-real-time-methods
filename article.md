# Real-time methods
## A comparison between WebSockets, server-sent events, and polling.

Abstract:

Comparisons of mechanisms to implement a "real-time" behavior in web applications
often touch on API differences, however neglect performance and request overhead
in such implementations. This article provides metrics for HTTP long-polling,
HTTP short-polling, server-sent events, and WebSockets in the form of request size
and time until a response is received. The primary audience of this article is a
seasoned web developer or library author, however web developers of all skill levels
may benefit from the following material.

### Introduction:

This article aims to compare differences in performance, with regards to current "real-time" behaviors in a Web browser.
HTTP long-polling, HTTP short-polling, WebSockets, and server-sent events will be compared in different scenarios to measure data
transfer costs. With the advent of [HTTP/2 support](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V8.md#8.4.0) in Node.js core,
these comparisons will be done in both HTTP/1.1 and HTTP/2.

### Environment

Browser: Chrome, version 60.0.3112.113
Device:
	- 2013 iMac OS 10.12.6
	- 3.5 GHz Intel Core i7
	- 16 GB 1600 MHz DDR3 RAM
Server: Node v8.4.0

### Scenarios

	- 5 updates sent at a 1 second interval.
	- 5 updates sent at a 1 second interval with 2 subscribers in parallel.

	_Parallel subscriber tests are not used for the WebSocket implementations in this experiment. Parallel tests are only used to illustrate HTTP/2's built in multiplexing.
	For WebSocket multiplexing, there are a number of libraries to emulate this functionality._

### Methods

	- Manual page refresh (control)
	- HTTP short-polling (250ms interval)
	- HTTP long-polling
	- Server-sent events
	- WebSockets (via WS)
	- WebSockets (via engine.io)
	- WebSockets (via Faye)
	- WebSockets (via SockJS)

	_The interval chosen for short-polling is arbitrary. To achieve greater performance, the interval should be as close as possible to when updates may be expected._

	All tests are done via HTTPS and WSS for an accurate comparison between HTTP/1.1 and HTTP/2.

	For the purpose of this test, the browser cache has been disabled.

	Measurements will include XHRs, document, and WebSocket requests. This excludes the 87 KB for the Primus library as well as favicon.ico requests.

### Results

_single subscriber graph_
_Smaller is better._

In the individual subscriber test, the cost of headers becomes apparent. The difference in performance, for each HTTP method, is the compression of headers. For WebSocket methods,
headers are not passed upon every request, further reducing bandwidth cost. However, the underlying library facilitating a WebSocket connection comes with varying levels of overhead. Engine.IO is the most expensive
in this test as a number of ancillary requests are made in parallel.

_parallel subscriber graph_

For parallel connections, the bandwidth is expected to go up, however it is important to note that HTTP/1.1 will create extra TCP connections. In the corresponding \*.HAR files, note the `ConnectionID` property. This identifies
when a new TCP connection is made. For this test the overhead of a new TCP handshake is minimal, however, an application that makes many parallel requests will spawn multiple TCP connections. HTTP/2 multiplexing allows for
multiple HTTP requests to take place over a single TCP connection, reducing bandwidth cost.

_image for http 1.1_
_HTTP/1.1 snapshot from the long-polling test illustrating multiple TCP connections._

_image for http 2_
_HTTP/2 snapshot from the long-polling test illustrating a shared TCP connections._

### Conclusion

In the past, server-sent events have had a higher bandwidth cost due to HTTP/1.1's handling of headers. In the scenario of uni-directional, push updates with HTTP/2 are
now almost as cheap as a WebSocket transfer, in terms of bandwidth. However, there is a consideration of development overhead when using WebSockets. The handling of WebSocket reconnects or "heartbeat" mechanisms,
authorization, and/or including a WebSocket library result in development costs. The WebSocket API is able to be used natively, as opposed to differing libraries behind Primus in this test, however a real-world implementation
requires a connection to be "kept alive"(aka heartbeat/ping). For this reason, Primus was chosen to compare existing WebSocket libraries.

In the current environment, long and short-polling have a much higher bandwidth cost, but may be considered if supporting legacy browsers. The current state of browser support at the time of this writing is as follows:

_image for sse_
_image for ws_

For development of most form-based web applications, server-sent events provide a low development overhead while benefiting from existing HTTP practices. If an application requires a high rate of upstream communication, a WebSocket
implementation would provide a much lower bandwidth cost and may be worth the development overhead. WebSockets provide full-duplex, bi-directional communication allowing for constant data transfer between a client and server.

### References

	- https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
	- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
	- https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V8.md#8.4.0
