const path = require('path');
const http2 = require('http2');
const fs = require('fs');
const serveStatic = require('serve-static');
const kefir = require('kefir');
const Primus = require('primus');

const https = require('https');

const stream = kefir.fromPoll(1000, () => new Date().toString());

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

const ws = stream.observe({
	value(val) {
		primus.write(val);
	}
});

const options = {
	key: fs.readFileSync(`${process.env.HOME}/dev/ssl.key`),
	cert: fs.readFileSync(`${process.env.HOME}/dev/ssl.crt`),
	ca: [ fs.readFileSync(`${process.env.HOME}/dev/ssl.crt`) ]
};

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

const serve = serveStatic(path.resolve(__dirname), { index: ['index.html'] });

const http2Server = http2.createSecureServer(options, server);
const httpsServer = https.createServer(options, server);

const primus = new Primus(httpsServer, { transformer: 'engine.io' });
primus.save(__dirname +'/primus.js');

httpsServer.listen(8000);
http2Server.listen(8443);
