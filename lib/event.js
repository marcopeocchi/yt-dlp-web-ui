var Transform = require('stream').Transform;

class SSE extends Transform{
    constructor(options) {
        super();
        
        if (!(this instanceof SSE))
            return new SSE(options);

        options = options || {};
        Transform.call(this, options);
    }
    _transform(data, enc, cb) {
        this.push('data: ' + data.toString('utf8') + '\n\n');
        cb();
    }
}

module.exports = SSE;
