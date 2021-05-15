const pTypes = ['any', 'all', 'race', 'allSettled'];
const staticRedirects = ['resolve', 'reject', ...pTypes];
//const protoRedirects = ['catch', 'finally', 'then'];
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
  #callback;
  #PPromise;
  #Headless;
  #PPromises = []; //internal array of promises;
  #states = stateDefaults;
  /* if the deferred is conditional then conditions can be set externally
   * and those conditions must be met for it to resolve
   *
   */
  #interaction = 'race';
  #isConditional = true; /* whether or not conditions even matter */
  #condition = null; /* the actual condition, if relevant */
  #Type;  /* type enum. default standard */
  // #logic = '0' // logic string  / TODO;

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

  #PromiseLibrary;
  #isUnbreakable;
  /*
   * when you want a promise but want to resolve it externally
   *
   * if  externalPromise is provided then it is an implied "race" to see which one gets completed first
   */
  constructor(
    /* promise */ callbackOrPromises,
    /* array */ resolveRejectValues = [],
    /* object */ opts = {
      /* symbol */
      type         : standard,
      isUnbreakable: false,
      /* pTypes */
      interaction  : 'race'
    }
  ) {
    const v = this.#values;
    this.#PPromises = [];

    this.#cbs.resolve = (resolve) => {
      v.resolve = resolve;
    };
    this.#cbs.reject = (reject) => {
      v.reject = reject;
    };

    this.#isUnbreakable = !!opts.isUnbreakable;

    //1 determine the type of PPromise being requested. all stems from that
    /*
     * case A:  type = solid ; interaction :[ any, all,...] ; externalPromises = [ 1...n ]
     * -  callback here is required (typical of a standard promise)
     * -  ... or externalPromises is required
     * - "upgrade" the promise means
     */

    /*
     * case B: type= standard (deferred); interaction :  externalPromises = [1..n]
     * - B.1 callback not provided
     * -- if no callback is provided then it's simple deferred
     * -- interaction : [ any, all, ...]
     * -- externalPromises [ 0..n]
     * -- the deferred case is incorporated as one of the promises (or the only one)
     *
     * -B.2 callback provided TODO
     * - if a callback is provided then it is akin to a single externalpromise.
     * - "upgrade" the resulting promise by embedding a promise inside the deferred ???
     *
     */
    this.#Type = PPromise.getType(opts.type);

    //set stateDefaults
    Object.assign(this.#states, stateDefaults);

    if (this.#Type === solid && !callbackOrPromises)
      throw TypeError(`you must provide a callback or a promise for ${this.#Type.description}`);

    this.#defineProperties();

    this.type = this.#Type;
    this.#interaction = opts.interaction;

    this.#setHeadless();
    this.#setRoot(resolveRejectValues, callbackOrPromises);

    //establish native proxies
    PPromise.#proxyMethods.call(this);

    return this;
  } //constructor

  #setRoot(values, cbOrP) {
    this.#setReturnValues(...values);
    //replace Promises
    this.#setPPromises(cbOrP);
    //replace callback
    this.#setCallback(cbOrP);
    //replace PPromise
    this.#setPPromise();

    //bundle 1...n promises   i.e. if multiple, define their relationship/interaction
    if (this.#PPromises.length) {
      //put internal PPromise on front of the queue
      this.#PPromises.unshift(this.#PPromise);
      this.#PPromise = Promise[this.#interaction]([...this.#PPromises]);
      /* the promise will call headless but
  because we know that the internal promise will never have any direct chain (until resolved)
  we can  dynamically assign it's "then" relationship to headless at that time.
   */
      //this.#PPromise.then(this.#Headless.resolve, this.#Headless.reject);
    }
  }

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

  #setHeadless() {
    this.#Headless = PPromise.getDeferred();
  }

  //upgrade the callback ( more status and in some cases adding deferred);
  #setCallback(cb) {
    const _cb = this.#cbs;
    const _arg = this.#args;
    const that = this;
    if (typeof cb === 'undefined') {
      this.#callback = (resolve, reject) => {
        if (that.type !== solid) {
          _arg.resolve = resolve;
          _arg.reject = reject;
        }
      }
    } else if (typeof cb === 'function') {
      this.#callback = (resolve, reject) => {
        cb(_cb.resolve, _cb.reject);
        if (that.type !== solid) {
          _arg.resolve = resolve;
          _arg.reject = reject;
        }
      }
    }
  } //setCallback

  static isPromise(p) {
    return (p instanceof Promise || p instanceof PPromise);
  }


  #setPPromises(p) {
    if (PPromise.isPromise(p)) {
      this.#PPromises = [p];
      return;
    }

    let A = Array.from(p);
    this.#PPromises = A.length && PPromise.isPromise(A[0]) ? A : [];
  }

  // make a promise/deferred with the upgrade callback
  #setPPromise(cbOrP = this.#callback) {
    switch (this.#Type) {
      case solid :
      case standard:
      case fluid:
        this.#PPromise = PPromise.#getPromise(this.#states, cbOrP);
        break;
    }
  }

  #linkHeadless() {
    this.#PPromise.then(this.#Headless.resolve, this.#Headless.reject);
  }

//
  static
  #getPromise(stateObject, cbOrP) {
    const P = (typeof cbOrP === 'function') ? new Promise(cbOrP) : cbOrP;
    PPromise.updateProperties(P, stateObject);
    return P;
  }

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

//define object properties (getters & setters)
  #defineProperties() {
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

    Object.defineProperties(this, {
      'isUnbreakable': {
        get() {
          this.#isUnbreakable;
        },
        set(v) {
          if (this.#isUnbreakable || typeof v === 'undefined')
            return;

          this.#isUnbreakable = !!v;
        }
      },
      'state'        : {
        enumerable: true,
        get() {
          return (this.isPending && 'pending') ||
            (this.isRejected && 'rejected') ||
            (this.isFulfilled && 'fulfilled') ||
            undefined
        }
      },
      'expectedValue': {
        enumerable: true,
        get() {
          return Object.assign({}, this.#values);
        }
      },
      'result'       : {
        enumerable: true,
        get() {
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
  } //defineProperties

//library is where the structure of all related promises is.
  #updateLibrary(promisesArray, interaction) {
    const entry = {};
    entry[interaction] = promisesArray;
    this.#PromiseLibrary.push(entry);
  }

//e.g. if PPromise.all() is called or this.finally()
  static #proxyMethods(/* Array */  library) {
    let that;
    if (this instanceof PPromise) {
      that = this;
    }

    // e.g. PPromise.all()
    staticRedirects.forEach(m => {
      PPromise[m] = function ( /*arguments */) {
        //call native promise
        let _p = Promise[m].apply(null, arguments);

        if (that && library) {
          //add it to the list of promises ? TODO:
        }
        //return different object depending on if bound by PPromise (internally)
        return that || _p;
      }
    });

    /* for any of these...
    * attach them to a dummy deferred (we'll call it headless promise)
    * this dummy deferred will get called by the main promise/deferred when it resolves.
    *
    * Thus, until it resolves we can "move" / attach it to to a different promise
     */

    // e.g.  this.finally( cb )
    /* protoRedirects.forEach(m => {
       PPromise.prototype[m] = function ( ) {
         let _p = p[m](...arguments);

         return that || _p;
         //return p[m].apply(this, arguments);
       }.bind(that || this);
     });*/
  } // proxyMethods

  /******** all links in the promise chain need to be attached to the headless deferred ***/
  #thenFinallyCatch(protoFn, ...args) {
    this.#Headless[protoFn](...args);
    return this;
  }

  then(...args) {
    return this.#thenFinallyCatch('then', ...args)
  }

  finally
  (
    ...
      args
  ) {
    return this.#thenFinallyCatch('finally', ...args);
  }

  catch
  (
    ...
      args
  ) {
    return this.#thenFinallyCatch('catch', ...args)
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
    //link headless
    this.#linkHeadless();
    //reject
    this.#args.reject(this.#values.reject);
    return this.#values.reject;
  }

  resolve(value) {
    if (arguments.length) {
      this.updateValue(value);
    }
    //link headless
    this.#linkHeadless();
    //resolve
    this.#args.resolve(this.#values.resolve);
    return this.#values.resolve
  }

//a basic deferred using PPromise
  static getDeferred(...a) {
    return new PPromise(...a);
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

  #setConditional(type) {
    this.type = type;
    return this;
  }

  /* helper that does it based on clock time */
  static resolveAtClock(end, deferred, start = new Date(), tick = 100) {

  }

  /* helper that sets up a timer for you */
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

  replaceRoot(
    values = [],
    cbOrP = this.#callback,
    /*object */ opts = {
      type       : this.type,
      interaction: this.#interaction
    }) {
    if (this.state !== 'pending' || this.isUnbreakable) {
      return;
    }
    //unbreakable stays same
    //this.isUnbreakable = false;

    //set type according to property definition
    this.type = opts.type;
    this.#interaction = opts.interaction;
    this.#setRoot(values, cbOrP);
    return this;
  }

  /* drop the chain is akin to replace the internal headless promises */
  dropChain(action, value) {
    if (!this.isPending || this.isUnbreakable) {
      return;
    }
    const droppedChain = this.#Headless;

    //new chain
    this.#setHeadless();

    //if solid then immediately reject
    if (this.#Type === solid)
      droppedChain.reject('Promise broken: Root has dropped this chain');

    //process droppedChain
    else if (['resolve', 'reject'].includes(action))
      droppedChain[action](value);

    //if not solid then return the dropped chain
    return this.#Headless;

  }//dropChain
  /*
  * changeInteration is possible because the stored Promise does not actually attach the promise chain until after
  * settling
  *
  * There is a headless deferred that is called.
  *
   is this dangerous?? maybe because:
   -the asynchronous thread could complete during the swap
   - there might be other attachments to it that need to get updated but you'll never know who they are
   --> so essentially, you're creating a new promise not really destroying the old one
   */
  changeInteraction(type) {
    //can only change interaction if the promise is not pending
    if (this.state === 'pending' && this.type !== solid)
      //the original array is still in tact so use that
      this.#PPromise = PPromise[type]([...this.#PPromises]);

    return this;
  }
}

export default PPromise;