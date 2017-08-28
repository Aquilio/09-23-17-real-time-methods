const https = require('https');
const kefir = require('kefir');
const Primus = require('primus');

module.exports = function(stream, options, server, transformer, port) {
	const httpsServer = https.createServer(options, server);

	if(transformer) {
		const primus = new Primus(httpsServer, { transformer });

		stream.observe({
			value(val) {
				primus.write(val);
			}
		});

		primus.save(__dirname + `/../${transformer}/primus.js`);
	}

	httpsServer.listen(port);
}
