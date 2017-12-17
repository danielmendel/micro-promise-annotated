// 2.1
var PENDING = ["PENDING"];
var FULFILLED = ["FULFILLED"];
var REJECTED = ["REJECTED"];

function isFunc(v){
    return typeof v === 'function';
}

function Prom() {
    this.state = PENDING;
    this.value = undefined;
    this.deferred = [];
}

// 2.3
Prom.prototype.resolve = function(val) {
    // 2.1.2
    if (this.state !== PENDING) {
        return;
    }
    // 2.3.1
    if (this === val) {
        this.reject(new TypeError("Promise cannot be resolved with itself"));
        return;
    }
    // 2.3.3
    if (val !== null && (typeof val === 'object' || isFunc(val))) {
        // 2.3.3.2
        try {
            // 2.3.3.1
            var then = val.then;
        } catch (e) {
            this.reject(e);
            return;
        }
        // 2.3.3.3
        if (isFunc(then)) {
            // 2.3.3.3.4
            try {
                // 2.3.3.3.3
                var called = false;
                function gatedExec(fn) {
                    return function(v){
                        if (called) return;
                        called = true;
                        fn(v);
                    }
                }
                // 2.3.2, 2.3.3.3
                then.call(val, gatedExec(this.resolve.bind(this)), gatedExec(this.reject.bind(this)));
            } catch (e) {
                // 2.3.3.3.4.1
                if (!called) {
                    this.reject(e);
                }
            }
            return;
        }
    }
    // 2.3.4, 2.1.2.2
    this.value = val;
    this.state = FULFILLED;
    // 2.2.4
    setTimeout(Deferred.exec.bind(this), 0);
}

// 2.1 & 2.3
Prom.prototype.reject = function(reason) {
    // 2.1.3.1
    if (this.state !== PENDING) {
        return;
    }
    // 2.1.3.2
    this.value = reason;
    this.state = REJECTED;
    // 2.2.4
    setTimeout(Deferred.exec.bind(this), 0);
}
// 2.2
Prom.prototype.then = function(yes, no) {
    // 2.2.1
    yes = isFunc(yes) ? yes : null;
    no = isFunc(no) ? no : null;
    // 2.2.6
    var deferred = new Deferred(yes, no);
    this.deferred.push(deferred);
    if (this.state !== PENDING) {
        setTimeout(Deferred.exec.bind(this), 0);
    }
    // 2.2.7
    return deferred.next;
}

function Deferred(yes, no) {
    // 2.2.7.3
    this.yes = yes || function(v){ this.next.resolve(v); }.bind(this);
    // 2.2.7.4
    this.no = no || function(r){ this.next.reject(r); }.bind(this);
    this.next = new Prom();
}

// 2.2.2, 2.2.3
Deferred.exec = function() {
    while (this.deferred.length) {
        var d = this.deferred.shift();
        var method = this.state === FULFILLED ? d.yes : d.no;
        // 2.2.7.2
        try {
            var val = method(this.value);
        } catch (e) {
            d.next.reject(e);
            continue;
        }
        d.next.resolve(val);
    }
}

module.exports = Prom;
