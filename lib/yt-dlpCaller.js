const Readable = require('stream').Readable;

class Subscription extends Readable{
    constructor(options) {
        super();
        if (!(this instanceof Subscription))
            return new Subscription(options);

        options = options || {};
        Readable.call(this, options);

        this.value = 0;
    }
    _read() {
        while(this.value <= 100){
            this.push(String(this.value++));
        }
    }
}
  

exports.subscribe = function(event, options){
    return new Subscription(options);
}