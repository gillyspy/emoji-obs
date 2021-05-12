const staticRedirects = ['resolve', 'reject', 'any', 'all', 'race', 'allSettled'];
const protoRedirects = ['catch', 'finally', 'then'];
const stateKeys = ['isFulfilled', 'isPending', 'isRejected', 'isResolved'];
const stateDefaults = {
  isFulfilled: false,
  isResolved : false,
  isPending  : true,
  isRejected : false
};

class PPromise {
  #resolve;
  #reject;
  #PPromise;
  #resolveValue;
  #rejectReason;
  #states = stateDefaults;

  /*
  * when you want a promise but want to resolve it externally
  *
  * if  externalPromise is provided then it is an implied "race" to see which one gets completed first
   */

  constructor(
    /* Promise */ externalPromises,
    resolveRejectValues = []
  ) {
    var res, rej, s = this.#states;
    var that = this;

    //prepare any custom return values
    this.#setReturnValues(...resolveRejectValues);

    //deal with n number of external promises
    if (externalPromises && !Array.isArray(externalPromises.length)) {
      externalPromises = [externalPromises];
    }

    //
    stateKeys.forEach(s => {
      //e.g.  this.isFulfilled
      Object.defineProperty(that, s, {
        get() {
          return that.#states[s];
        },
        set(v) {
          // only the internal can set this variable
          console.log(`not possible to set state ${s}`, v);
          //that.#PPromise[s] = v
        }
      });
    });

    this.#PPromise = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;

      //initialize states
      Object.assign(s, stateDefaults);
    });

    if (externalPromises) {
      this.#PPromise = Promise.race(externalPromises.concat(this.#PPromise));
    }

    //external hooks for resolution / rejection
    this.#resolve = res;
    this.#reject = rej;

    //establish native proxies
    PPromise.#proxyMethods(this.#PPromise);

  } //constructor

  #resolver() {
    //this.#isFulfilled =
  }

  #setReturnValues( v, r) {
    //allow for undefined values;
    if (arguments.length)
      this.updateValue(v );

    if( arguments.length === 2)
      this.updateReason(r);

  } //setReturnValues

  #setState() {
    var s = this.#states;

    this.#PPromise.then(
      value => {
        s.isFulfilled = true;
        s.isResolved = true;
        s.isPending = false;
        s.isRejected = false;
      },
      reason => {
        s.isFulfilled = false;
        s.isResolved = false;
        s.isPending = true;
        s.isRejected = false;
      })
  } //setState

  //e.g. if PPromise.all() is called  or this.finally()
  static #proxyMethods(
    /* Promise */ p,
    _this) {

    // e.g. PPromise.all()
    staticRedirects.forEach(m => {
      PPromise[m] = function ( /*arguments */) {
        //call native promise
        return Promise[m].apply(null, arguments);
      }
    });

    // e.g.  this.finally( cb )
    protoRedirects.forEach(m => {
      PPromise.prototype[m] = function ( /*arguments */) {
        return p[m](...arguments);
        //return p[m].apply(this, arguments);
      }.bind(_this);
    });
  }

  static help(method) {
    throw error(
      `do not call ${method} method on this object.\
      Call ${method} using Native Promise methods of your promise instead \
      and then include this instance as one of the arguments`
    );
  }

  updateValue(value) {
    if (!this.isPending) {
      return false;
    }
    this.#resolveValue = value;
  } //updateValue

  updateReason(reason) {
    if (!this.isPending) {
      return false;
    }
    this.#rejectReason = reason;
  } //updateReason

  rejectWith(reason) {
    return this.reject(reason);
  }

  rejectWithOption(reason) {
    reason = typeof this.#rejectReason !== 'undefined' ? this.#rejectReason : reason;
    return this.reject(reason);
  }

  resolveWith(value) {
    return this.resolve(value);
  }

  resolveWithOption(value) {
    value = typeof this.#resolveValue !== 'undefined' ? this.#resolveValue : value;
    return this.resolve(value);
  }

  reject(reason) {
    if( arguments.length ){
      this.updateReason( reason )
    }
    this.#reject( this.#rejectReason );
    return this.#rejectReason;
  }

  resolve(value) {
    if( arguments.length ){
      this.updateValue( value )
    }
    this.#resolve( this.#resolveValue );
    return this.#resolveValue;
  }
}

export default PPromise;