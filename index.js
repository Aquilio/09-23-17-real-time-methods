const path = require('path');
const http2 = require('http2');
const fs = require('fs');
const serveStatic = require('serve-static');
const createPrimusServer = require('./src/primus');
const createStream = require('./src/stream');
const kefir = require('kefir');
const Primus = require('primus');

const https = require('https');

const stream = createStream();

let shortPollValue;
const shortPoll = stream.observe({
	value(val) {
		shortPollValue = val;
	}
});

const longPollResponses = [];
const longPoll = stream.observe({
	value(val) {
		while(longPollResponses.length) {
			const res = longPollResponses.pop();
			res.writeHead(200);
			res.end(val);
		}
	}
});

let sseId = 0;
const sseResponses = [];
const sse = stream.observe({
	value(val) {
		sseResponses.forEach(res => {
			res.write(`id: ${sseId++}\n`);
			res.write(`data: ${val}\n`);
			res.write('\n\n');
		});
	}
});

const options = {
	key: fs.readFileSync(`${process.env.HOME}/dev/ssl.key`),
	cert: fs.readFileSync(`${process.env.HOME}/dev/ssl.crt`),
	ca: [ fs.readFileSync(`${process.env.HOME}/dev/ssl.crt`) ]
};

const serve = serveStatic(path.resolve(__dirname), { index: ['index.html'] });

const server = (req, res) => {
	serve(req, res, () => {
		switch(req.url) {
			case '/server-sent-data':
				req.socket.setTimeout(0x7FFFFFFF);
				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache'
				});
				res.write('\n');
				sseResponses.push(res);

				const close = () => {
					const i = sseResponses.findIndex(cur => cur === res);
					sseResponses.splice(i, 1);
					res.end();
				};

				req.on('aborted', close);
				break;
			case '/long-poll-data':
				req.socket.setTimeout(0x7FFFFFFF);
				longPollResponses.push(res);
				break;
			default:
				res.writeHead(200);
				res.end(shortPollValue);
				break;
		}
	});
};

const http2Server = http2.createSecureServer(options, server);

createPrimusServer(null, options, server, null, 8000);
createPrimusServer(stream, options, server, 'engine.io', 8001);
createPrimusServer(stream, options, server, 'faye', 8002);
createPrimusServer(stream, options, server, 'sockjs', 8003);
createPrimusServer(stream, options, server, 'websockets', 8005);

http2Server.listen(8443);
