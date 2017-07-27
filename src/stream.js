const kefir = require('kefir');

module.exports = function() {
    return kefir.fromPoll(1000, () => new Date().toString());;
}