Sample app(for a demo):
- Real time tracking of <company> stock price
	- https://www.alphavantage.co/support/#api-key
	- internal long running poll

Test app:
- Long running interval, getting server timestamp

Assumptions:
- HTTP/1.1
- FeathersJS
- jQuery

Comparison:
- Server-sent events
	- Differences between other HTTP streaming methods: Twitter, HLS
- HTTP long polling
- HTTP short polling
- WebSocket
- Fetch/ReadableStream?
- Refreshing the page(control?)

Measuring:
- Total bytes of transaction(updates only)
- Total time for transaction(updates only)

--

Title: Real-time methodologies: A comparison
Abstract:
Keywords: JavaScript, HTTP

What did we do?

- We measured the time and size of requests utilizing different "push" methodologies.

Why did we do it?

- To have a recent/modern comparison of the cost(?) implementing different methods
from a protocol(?) perspective.

How did we do it?

Constants:
- Implemented a long running function on the server, sending updates with the
current server time as data.
- Upon completion of update response, render response data to the page.

Variables:
- Subscription or processing of update service on the client.

What were the results?

- Graph on method vs time
- Graph on method vs request/response size

Conclusion/Discussion:

- Cheapest method
- Potential impact of HTTP/2
- Major differences, usages of different methods
- Browser support

References
