const pTypes = ['any', 'all', 'race', 'allSettled'];
const staticRedirects = ['resolve', 'reject'].concat(pTypes);
const protoRedirects = ['catch', 'finally', 'then'];
const stateKeys = ['isFulfilled', 'isPending', 'isRejected', 'isResolved'];
const solid = Symbol.for('solid');
const fluid = Symbol.for('fluid');
const standard = Symbol.for('standard');
const types = [standard, fluid, solid];
const stateDefaults = {
  isFulfilled: false,
  isResolved : false, //synonym for isFulfilled
  isPending  : true,
  isRejected : false
};

/***
 * -------------------------------------------------------
 * about types
 * -------------------------------------------------------
 * type = solid :
 * essentially this is a standard promise that cannot be resolved externally (ie is NOT a deferred)
 * this cannot be downgraded to either standard nor fluid
 *
 * type = standard (default type)
 * this is a deferred pattern but the existing attached promises cannot be removed. standard can
 * be upgraded to solid (but not downgraded to fluid)

 * type = fluid:
 * this is a deferred pattern where the the promises can be changed (removed or added).
 * fluid can be upgraded to solid or standard.
 *
 * -------------------------------------------------------
 * about upgrading
 * -------------------------------------------------------
 * upgrading is a creation option
 * when enabled it is one way (as mentioned)
 *
 * -------------------------------------------------------
 * about native promise "types"" ('any', 'all', 'race', 'allSettled):
 * -------------------------------------------------------
 * you can use any of these and in any combination... the the code these are called "pTypes"
 *
 * -------------------------------------------------------
 * about fluidity & deffereds
 * -------------------------------------------------------
 * if a promise is fulfilled then you cannot change that promise itself
 * but... you can potentially still remove it from the list of promises
 * e.g. if the type is fluid then you can remove it.
 *
 * -------------------------------------------------------
 * about logic string
 * -------------------------------------------------------
 * you can provide a logic string about how to relate promises together
 * a) 0 && 1 || (0 && 2)
 * b) 0 && (1 || 2)     // equivalent of a
 *
 * these get translated internally.
 * && is akin to "all"
 * || is akin to "any"
 * |! is akin to "race"
 *
 * -------------------------------------------------------
 * about resolving deferreds
 * -------------------------------------------------------
 * you can resolve/reject a specific deferred by name (if a name was provided) or index
 * a name can be a string or a symbol.
 * an index can be an integer
 *
 * you can resolve /reject by passing an array of names or indices;
 *
 * you can resolve/reject them all by using '*'
 */
class PPromise {

  #PPromise;
  #PPromises = []; //internal array of promises;
  #states = stateDefaults;
  /* if the deferred is conditional then conditions can be set externally
   * and those conditions must be met for it to resolve
   *
   */
  #isConditional = true; /* whether or not conditions even matter */
  #condition = null; /* the actual condition, if relevant */
  #Type;  /* type enum. default standard */
  #logic = '0' // logic string

  #args = {
    resolve: undefined,
    reject : undefined
  }

  #values = {
    resolve: undefined,
    reject : undefined
  }

  #cbs = {
    resolve: null,
    reject : null
  }

  /*
   * when you want a promise but want to resolve it externally
   *
   * if  externalPromise is provided then it is an implied "race" to see which one gets completed first
   */
  constructor(
    /* promise */ callbackOrPromises,
    /* symbol */ type = standard,
    /* pTypes */ nativeType = 'race',
    /* array */ resolveRejectValues = []
  ) {
    const
      v = this.#values,
      a = this.#args,
      s = this.#states,
      cb = this.#cbs,
      that = this;
    let callback;
    this.#PPromises = [];

    this.#cbs.resolve = (resolve) => {
      v.resolve = resolve;
    };
    this.#cbs.reject = (reject) => {
      v.reject = reject;
    };

    //1 determine the type of PPromise being requested. all stems from that
    /*
     * case A:  type = solid ; nativeType :[ any, all,...] ; externalPromises = [ 1...n ]
     * -  callback here is required (typical of a standard promise)
     * -  ... or externalPromises is required
     * - "upgrade" the promise means
     */

    /*
     * case B: type= standard (deferred); nativeType :  externalPromises = [1..n]
     * - B.1 callback not provided
     * -- if no callback is provided then it's simple deferred
     * -- nativeType : [ any, all, ...]
     * -- externalPromises [ 0..n]
     * -- the deferred case is incorporated as one of the promises (or the only one)
     *
     * -B.2 callback provided TODO
     * - if a callback is provided then it is akin to a single externalpromise.
     * - "upgrade" the resulting promise by embedding a promise inside the deferred ???
     *
     */
    this.#Type = PPromise.getType(type);

    //set stateDefaults
    Object.assign(this.#states, stateDefaults);

    if (this.#Type === solid && !callbackOrPromises)
      throw TypeError('you must provide a callback or a promise for ' + this.#Type.description);

    /**********************
     * define properties
     */
    stateKeys.forEach(s => {
      //e.g.  this.isFulfilled
      Object.defineProperty(that, s, {
        enumerable: true,
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


    //condtional; isConditional;
    Object.defineProperties(this, {
      'state'        : {
        enumerable: true,
        get() {
         return (this.isPending && 'pending') ||
            (this.isRejected && 'rejected') ||
            (this.isFulfilled && 'fulfilled') ||
              undefined
        }
      },
      'expectedValue':{
          enumerable: true,
        get(){
            return Object.assign({},this.#values);
        }
      },
      'result'       : {
        enumerable: true,
        get(){
         return (this.isRejected && this.#values.reject) ||
            (this.isFulfilled && this.#values.resolve) ||
              undefined
        }
      },
      'settled'      : {
        enumerable: true,
        get() {
          if (this.isPending) {
            return null;
          } else {
            Object.assign(this.#PPromise, this);
            return this.#PPromise;
          }
        }
      },
      'condition'    : {
        enumerable: true,
        get() {
          return this.#condition;
        },
        set(v) {

        }
      },
      'isConditional': {
        enumerable: true,
        get() {
          return this.#isConditional
        },
        set(v) {

        }
      },
      //can freely switch to solid but not the inverse
      'type'         : {
        enumerable: true,
        get() {
          let _map = {
            solid   : 'promise:solid',
            standard: 'deferred:standard',
            fluid   : 'deferred:fluid'
          };
          return _map[this.#Type.description];

        },
        set(newType) {
          if (this.#Type === solid)
            return; //cannot undo solid

          newType = PPromise.getType(newType);
          if (newType === null) return;

          if (newType === solid)
            this.#setSolid();

          if (newType === standard && this.#Type === fluid)
            this.#setStandard();


          if (typeof this.#Type === 'undefined')
            this.#setFluid();


        }
      }
    });
    /**********************/
    this.type = this.#Type;

    //upgrade the callback (  all types )
    if (['function', 'undefined'].includes(typeof callbackOrPromises)) {
      //end up with one promise or deferred here
      callback = this.#setCallback(callbackOrPromises);

    } else if (callbackOrPromises instanceof Promise) {
      this.#PPromises.push(callbackOrPromises);
      callback = this.#setCallback();
    } else if (Array.isArray([...callbackOrPromises])) {
      this.#PPromises = [...callbackOrPromises];
      callback = this.#setCallback()
    }

    // make a promise or deferred with callback
    this.#setPPromise(callback);
    if (this.#PPromises.length) {
      //get PPromise
      this.#PPromises.unshift(this.#PPromise);
      this.#PPromises = Promise[nativeType](promises)
    } else {
      //
    }

    //prepare any custom return values
    this.#setReturnValues(...resolveRejectValues);

    //establish native proxies
    PPromise.#proxyMethods.call(this, this.#PPromise);

    return this;
  } //constructor

  /* proxy a native promise into a (solid) PPromise
   * do NOT allow a PPromise to be proxied -- this is just dumb
   *
   * this will attach good visibility into resolved status and allowed to get the returned value out without using
   * promise methods (then, etc)
   */
  static #proxyPromise(promise) {
    if (promise instanceof PPromise) {
      return promise;
    } else {
      return new PPromise(promise, solid, []);
    }
  }

  #setCallback(cb) {
    const _cb = this.#cbs;
    const _arg = this.#args;
    const that = this;
    if (typeof cb === 'undefined') {
      return (resolve, reject) => {
        if (that.type !== solid) {
          _arg.resolve = resolve;
          _arg.reject = reject;
        }
      }
    } else {
      return (resolve, reject) => {
        cb(_cb.resolve, _cb.reject);
        if (that.type !== solid) {
          _arg.resolve = resolve;
          _arg.reject = reject;
        }
      }
    }
  } //setCallback

  // get a promis
  #setPPromise(cbOrP) {
    switch (this.#Type) {
      case solid :
      case standard:
      case fluid:
        this.#PPromise = PPromise.#getPromise(this.#states, cbOrP);
        break;
    }
  }

  //
  static #getPromise(stateObject, cbOrP) {
    const P = (typeof cbOrP === 'function') ? new Promise(cbOrP) : cbOrP;
    PPromise.updateProperties(P, stateObject);
    return P;
  }

  /*
    #getDeferred() {
      this.#callback;


      PPromise.getDeffered()
    } */

  /*static getDeferred(deferTriggers, stateObject) {
    const P = new Promise((f, r) => {
      deferTriggers.resolve = f;
      deferTriggers.reject = r;

      //initialize status
      Object.assign(stateObject, stateDefault);
    });

    PPromise.updateProperties(P, stateObject);

    return P;
  }*/

  #setReturnValues(v, e) {
    //allow for undefined values;
    if (arguments.length)
      this.updateValue(v);

    if (arguments.length === 2)
      this.updateReason(e);
  } //setReturnValues

  static updateProperties(promise, stateObject) {
    //var s = this.#states;

    promise.then(
      value => {
        stateObject.isFulfilled = true;
        stateObject.isResolved = true;
        stateObject.isPending = false;
        stateObject.isRejected = false;

        return value;
      },
      error => {
        stateObject.isFulfilled = false;
        stateObject.isResolved = false;
        stateObject.isPending = true;
        stateObject.isRejected = false;

        return error;
      });
  } //setState

  //e.g. if PPromise.all() is called or this.finally()
  static #proxyMethods(
    /* Promise */ p) {
    let that;
    if (this instanceof PPromise) {
      that = this;
    }

    // e.g. PPromise.all()
    staticRedirects.forEach(m => {
      PPromise[m] = function ( /*arguments */) {
        //call native promise
        let _p = Promise[m].apply(null, arguments);
        return that || _p;
      }
    });

    // e.g.  this.finally( cb )
    protoRedirects.forEach(m => {
      PPromise.prototype[m] = function ( /*arguments */) {
        let _p = p[m](...arguments);
        return that || _p;
        //return p[m].apply(this, arguments);
      }.bind(that || this);
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
    this.#values.resolve = value;
  } //updateValue

  updateReason(reason) {
    if (!this.isPending) {
      return false;
    }
    this.#values.reject = reason;
  } //updateReason

  addCondition(condition) {
    this.#condition = condition;
    return this;
  }

  // a fluid conditional can be removed
  removeConditional() {
    // this.type = false;
    //return this;
  }

  rejectWith(reason) {
    return this.reject(reason);
  }

  rejectWithOption(reason) {
    reason = typeof this.#values.reject !== 'undefined' ? this.#values.reject : reason;
    return this.reject(reason);
  }

  resolveWith(value) {
    return this.resolve(value);
  }

  resolveWithOption(value) {
    value = typeof this.#values.resolve !== 'undefined' ? this.#values.resolve : value;
    return this.resolve(value);
  }

  reject(reason) {
    if (arguments.length) {
      this.updateReason(reason)
    }
    this.#args.reject(this.#values.reject);
    return this.#values.reject;
  }

  resolve(value) {
    if (arguments.length) {
      this.updateValue(value);
    }
    this.#args.resolve(this.#values.resolve);
    return this.#values.resolve
  }

  //a quick version
  static getDeferred() {
    return new PPromise();
  }

  /* helper that does it based on clock time */
  static resolveAtClock(end, deferred, start = new Date(), tick = 100) {

  }

  //lookup for a string to the enum
  static getType(type) {
    if (typeof type === 'undefined') {
      type = standard;
    }
    if (typeof type === 'string') {
      type = type.toLowerCase();
      let strings1 = ['solid', 'standard', 'fluid'];
      let strings2 = ['promise:solid', 'deferred:standard', 'deferred:fluid'];
      if (typeof newType === 'string') {
        if (strings1.includes(newType)) {
          type = Symbol.for(newType);
        } else if (strings2.includes(newType)) {
          type = Symbol.for(strings1[strings2.indexOf(newType)])
        }
      }
    }
    return types.indexOf(type) >= 0 ? type : null;
  }

  /*
   *
   */
  #setSolid() {
    this.#Type = solid;
  }

  #setStandard() {
    if (typeof this.#Type !== 'undefined' || this.#Type !== fluid) {
      return;
    }
    this.#Type = standard;

  }

  #setFluid() {
    if (typeof this.#Type !== 'undefined') {
      return
    }
    this.#Type = fluid;
    //this.#condition  =  this.#condition;
    this.#isConditional = true;

  }

  /*
   * check if the new option is
   */
  #upgradeToSolid() {


  }

  #upgradeToStandard() {

  }

  #setConditional(type) {
    this.type = type;
    return this;
  }

  /* helper  that sets up a timer for you */
  static resolveAtTick(end, deferred, start = 0, tick = 100) {
    if (deferred === true) {
      deferred = PPromise.getDeffered();
    }

    if (deferred instanceof Promise) {
      const interval = setInterval(() => {
        start >= end || deffered.isPending === false ?
          clearInterval(interval) && deffered.resolve() :
          start += tick
      }, tick);
      return deferred;
    } else {
      throw TypeError('deferred provided must be "true" or be a native Promise object')
    }

  }//resolveWhen

}

export default PPromise;