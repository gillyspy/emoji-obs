class PromiseFactory {
  #isResolved = null;
  #promise;
  #condition = { condition : true };
  #interval;
  #conditionResult = null; //tried once
  #returnValue

  constructor(externalPromise, tick = 100, returnValue = null, earlyResolveDuration = null, condition = null) {

    this.#returnValue = returnValue;

    let elapsed = 0;
    this.forceResolve = false;
    const that = this;
    let interval;
    let doThen = this.#doThen.bind(this);

    if (!(externalPromise instanceof Promise)) {
      externalPromise = new Promise.resolve(true);
    }

    if(condition === null){
      condition = this.#condition;
    }
    this.#initCondition( condition );
    //animateOnce(animation, returnValue, earlyResolveDuration) {
    //returnValue = ( returnValue !== null) ? returnValue : externalPromise;

    //else the resolution is not necessarily tied to end of the promise
    this.#promise = new Promise(function (resolve, reject) {

        interval = setInterval(function () {
          //update the condition
          that.evalCondition();
          elapsed += tick;
          //just in case the promise does  finish before expected
          externalPromise.then((value) => {
            doThen( resolve, reject, interval,returnValue, value);
          });

          //earlyResolution instead (is forced
          if (earlyResolveDuration !== null && elapsed >= earlyResolveDuration) {
            doThen( resolve, reject, interval, returnValue)
          }

        }.bind(this), tick);
      }
    );

    //register interval
    this.#setInterval(interval);
  } //constructor;

  #initCondition(condition){
    switch(typeof condition){
      case 'function':
        this.#condition = condition;
        break;
      case  'object':
        this.#condition = function(){
          return condition.condition
        }
        break;
    }
  }

  #doThen(resolve,reject, interval, returnValue, value) {
    //automatically resolve
    this.setResolved();

    if (this.getResolved() === null) {
      return;
    }

    //set up for resolve / reject
    clearInterval( interval );
    value = typeof value === 'undefined' ? returnValue : value;

    if (this.getResolved() === false)
      return reject(value);

    //else
      return resolve(value)
  } //doThen

  getInterval() {
    return this.#interval;
  }

  #setInterval(interval) {
    this.#interval = interval;
  }

  setResolved() {
    this.#isResolved = true;
  }

  getPromise() {
    return this.#promise;
  }

  evalCondition() {
    //can try many times; attempt after the main promise is complete
    this.#conditionResult = this.#condition();
  }

  getResolved() {
    return this.#isResolved === null ? null : (this.#isResolved && this.#conditionResult);
  }
}

export default PromiseFactory