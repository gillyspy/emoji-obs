import anime from 'animejs';
import Log from './Log.js';
const log = new Log(false);

class Animation {
  constructor(target, pin, timeout = 40000) {
    this.$el = target;
    this.debug = true;
    this.maxFade = timeout;
    this.anime = anime;
    this.bothClass = 'animate' + Math.floor(Math.random() * 1000);
    this.$el.addClass(this.bothClass);
    if (pin) {
      this.pin = pin;
      this.pin.addClass(this.bothClass);
    }
    this.$ = this.$el.constructor;
    this.both = this.$el.closest('div');
    this.animation = {};
    this.animationCache = {};
    //el must be jQuery object
  }

  removeAnimation(sticky) {
    this.pin.show();
    this.$el.stop().fadeIn(100)
      .show();
    return this;
  }

  toggleHide(sticky) {
    if (this.$el.is(':hidden')) {
      this.restartAnimation();
      if (sticky) {
        this.removeAnimation();
      }
    } else {
      this.$el.stop().hide();
      this.pin.hide();
    // this.restartAnimation();
    }
  }
  restartAnimation(){
    this.pin.hide();
    this.$el.show().stop()
      .fadeIn(1000)
      .stop()
      .css('opacity', 1.0)
      .fadeOut(this.maxFade);
    return this;
  }

  addAnimation() {
    if (this.debug) {
      log.browser('addAnimation');
    }
    this.restartAnimation();
    anime.remove('.' + this.randomClass );
    delete this.animation;
    this.animation = anime.timeline({loop: 1})
      .add({
        targets   : '.' + this.randomClass,
        scale     : [4, 1],
        opacity   : [0, 1],
        translateZ: 0,
        easing    : "easeOutExpo",
        duration  : 950,
        delay     : 200
      }); /* from: https://tobiasahlin.com/moving-letters/#2 */
    return this;
  };

  timeline(name, opts, addDestroy = false) {
    //get a timeline with no params
    if (this.animationCache[name]) {
      return this;
    } else
      //new or updated timeline
    if (typeof opts === 'object') {
      let c = this.animationCache;
      if (!!addDestroy) {
        let d = this.destroyTimeline.bind(this);
        let cb = opts.complete;
        opts.complete = function () {
          //c.animationCache[name].remove('*');
          d(name);
          if (cb) {
            cb();
          }
        }
      }
      this.animationCache[name] = this.anime.timeline(opts);
      return this;
    }
    return false;
  } //timeline

  destroyTimeline(name) {
    try {
      this.animationCache[name].remove();
       delete this.animationCache[name];
    }catch(e){}
    return
  }

  addToTimeline(name, opts, addDestroy = false) {
    let tl = this.timeline(name);
    if (tl) {
      if (!!addDestroy) {
        let d = this.destroyTimeline.bind(this);
        let cb = opts.complete;
        opts.complete = function () {
          //tl.animationCache[name].remove('*');
          d(name);
          if (cb) {
            cb();
          }
        }
      }
      tl.animationCache[name].add(opts);
      return this;
    }
    return;
  }

  doTimeline(name, event) {
    if(!this.animationCache[name]){
      return;
    } else //
    if (event === 'play') {
      this.animationCache[name].play();
    } else //pause
    if (event === 'pause') {
      this.animationCache[name].pause();
    } else //stop
    if (event === 'stop') {
      this.animationCache[name].pause();
      this.destroyTimeline(name);
    } else //reverse
    if (event === 'reverse') {
      this.animationCache[name].pause();
      this.animationCache[name].reverse();
       this.animationCache[name].play(); //TODO: ??
    } else //restart
    if (event === 'restart') {
      this.animationCache[name].restart();
    }
    return this;
  }
}

/**************
 * 2 phases:
 * countdown
 * reset & restart
 */


class TimerCountDown {
  #onCB;
  #offCB;
  #_;
  #timeStarted;
  #isRunning = false;
  #endTime;
  #scaleAnimation = [];
  #callbacks = []; //timebased callbacks that fire on times

  constructor(triggerNode, valueNode, targetNode, opts, onCB, offCB) {
    this.triggerNode = triggerNode;
    this.targetNode = targetNode;
    this.valueNode = valueNode;
    this.#onCB = onCB;
    this.#offCB = offCB;
    this.#timeStarted = 0;
    this.#_ = {
      timeLeft        : 3600000, // time remaining
      minutesRemaining: (3600000 / 60 / 1000),
      duration        : 3600000, // initial time (e.g. meeting length)
      hideClass       : 'flexClock--hide',
      showClass       : 'flexClock',
      fillClass       : 'flexClock__progress--fill',
      drainClass      : 'flexClock__progress--drain',
      subClass        : 'flexClock__sub',
      sliderClass     : 'flexClock__slider',
      steps           : 12,
      doMins          : true,
      delayFudge      : 0,
      stepSize        : 5,
      zoomOn          : true,
      zoomWhen        : [600000, 300000] // time remaining threshold to zoom in at
    };
    this.#_ = Object.assign({}, this.#_, opts);
    this.#callbacks = this.#registerCallbacks(this.#_.callbacks);
    this.init();
  }

  static makeWarning(text, classList = [], node) {
    const warningWrap = document.createElement('div');
    warningWrap.classList.add('flexClock__warnWrap');
    const warning = document.createElement('button');
    classList = Array.isArray(classList) ? classList : [classList];
    warning.classList.add(...classList);
    warning.textContent = text;
    warningWrap.append(warning);
    node && warning.append(node);
    document.body.append(warningWrap);
    return warningWrap;
  }

  durationJS(t = this.#_.duration) {
    return (this.#_.doMins ? t * 60 : t) * 1000;
  }

  #getStep(height, txt) {
    let borderFudge = 2; //TODO:
    let el = document.createElement('div');
    //add class
    el.classList.add('flexClock__step');
    el.style.height = (height - borderFudge) + 'px';

    if((height - borderFudge)<20){
      txt = '';
    }

    //add number
    let subEl = document.createElement('span');
    subEl.innerText = txt;
    let superEl = document.createElement('span');
    superEl.append(subEl);
    superEl.classList.add('flexClock__span--super')

    el.append(superEl);
    return el;
  } //#getStep

  queueFunc(fn, tick = 100) {
    let canPoll = true,
      now,
      sPassed;
    const that = this;
    this.#isRunning = true;

    (function p() {
      now = new Date()
      sPassed = (now - that.#timeStarted);
      let keepGoing = fn(sPassed);

      if (typeof keepGoing === 'function') {
        keepGoing(); //zoomin
      } else if (!that.#isRunning) {
        //quit early

      } else if (keepGoing && canPoll) { // ensures the function executes
        setTimeout(p, tick);

      } else {
        //TOOD? anything?
      }
    })();
  }

  /*
  ** would like to check how much real time (seconds) has passed.
  *
  * Create a queue of things to do (or act on);
  * start Timer on clock ticks
  * every X SECONDS (not ticks) do next queue item async
  *
  * notes:
  * - if the previous queue item is not finished that's fine
  * -
  *
   */

  refresh() {
    let steps = [];
    let step;
    let stepsNeeded;
    let stepHeight;
    let stepText = '';
    let dur = this.#_.duration;
    //this.#_.timeOnEach;
    //given a timeLength

    //reset the slider
//    this.sliderNode.style.transform = `translateY(0px)`;
    TimerCountDown.#resetSlider();

    //reset anything a cancel would anime-based animations
    this.#cancel(false);

    //remove old steps
    [...this.targetNode.querySelectorAll('div')].forEach((e) => {
      e.innerHTML = '';
    });

    this.#_.sunsetTriggered = false;

    //
    let pixels = this.targetNode.getBoundingClientRect().height
    let pixelsPerMin = pixels / dur;

    //break it up into steps. e.g. 60 minutes into 12 5 minute steps
    this.#_.delayFudge = (dur % this.#_.stepSize);
    let firstStepH = pixelsPerMin * this.#_.delayFudge;
    //this.#_.duration = dur - this.#_.delayFudge;
    let adjustedDuration = dur - this.#_.delayFudge
      + this.#_.stepSize; //added a whole step
    let remainingDuration = dur - this.#_.delayFudge
    let remainingPixels = pixels - firstStepH;

    stepsNeeded = Math.floor((this.#_.duration) / this.#_.stepSize);

    //TOOD: need to adjust this for the partial step
    this.#_.timeOnEach = (this.durationJS() / stepsNeeded);

    if (this.#_.delayFudge > 0) {
      stepsNeeded++;
      this.#_.steps = stepsNeeded;
    }

    /*
    we have 500px for X steps over Y minutes

    if Y=101 and we want 5 minute steps
    then there are 20 full steps
    the 21st step is 1minute not 5. (    1/5  is the size of that step )
     */

    //normal step height
    stepHeight = remainingPixels / remainingDuration * this.#_.stepSize;// (stepsNeeded-1)

    //populate those steps
    let stepsA
    //fill steps are always 1 step that grows

    for (let i = 0; i < stepsNeeded; i++) {
      //first step height is different
      if (i === 0 && this.#_.delayFudge > 0) {
        stepsA = [this.#getStep(firstStepH, '~' + Math.round(dur))]
      } else {
        stepText = adjustedDuration - (i * this.#_.stepSize); //
        stepsA = [this.#getStep(stepHeight, stepText)];
      }
      // 0 = B, 1=A
      document.getElementsByClassName(this.#_.subClass)[0]
        .append(...stepsA);
    }
  }

   durationToTopOfHour() {
    const {now, future} = {
      now   : (new Date()),
      future: (new Date())
    }
    let hourBump = 0
    //if within 15minutes of next hour then set for the top of the following hour
    if (now.getMinutes() > 45) {
      hourBump = 1;
    }
    future.setHours(now.getHours() + hourBump, 59, 59, 0);
    this.#endTime = future;
    return (future - now) / 1000 / 60; //TODO
  }

  translateInput(timeRequest) {
    /*parse text input such as 1430h into a time */
    let t, h, m, s, duration, future;
    const now = new Date();
    if (timeRequest instanceof Date) {
      future = timeRequest;
      duration = (future - now) / 1000 / 60
    } else if (/^(\d{1,2})[.]?\d+$/.test(timeRequest)) {
      //e.g. 10.2 for 10.2 minutes
      [s, m] = timeRequest.match(/^(\d{1,2})[.]?([\d]{0,2})$/).reverse();
      [s, m] = [+s, +m];
      s = s * 6;
      future = new Date();
      future.setMinutes(m + future.getMinutes(), s + future.getSeconds());
      console.log(m, s, timeRequest, future);
      duration = (future - now) / 1000 / 60;

      this.#endTime = future;
    } else if (timeRequest) {
      [m, h] = timeRequest.match(/^(\d{2})(\d{2})/).reverse();
      [m, h] = [+m, +h];

      let future = new Date();
      future.setHours(h, m, 0, 0);
      duration = (future - now) / 1000 / 60;

      if (duration > 240) {
        future = new Date();
        future.setHours(future.getHours() + 5, 0, 0, 0);
        duration = this.translateInput(future);
      }
      this.#endTime = future;
    } else {
      duration = this.durationToTopOfHour();
    }

    //duration is in minutes here
    switch (true) {
      case duration <= 5:
        this.#_.zoomOn = false;
      case duration <= 20:
      case duration <= 10:
        this.#_.stepSize = 1;
        this.#_.doMins = true;
        break;
      case duration <= 2:
        // display seconds with larger steps
        this.#_.stepSize = 10;
        this.#_.doMins = false;
        this.#_.zoomOn = false;
        duration *= 60;
        break;
      case duration <= 40:
      default:
        this.#_.stepSize = 5;
        this.#_.doMins = true;
        this.#_.zoomOn = true;
        break;
    }
    this.#_.duration = duration;
    return duration;
  } //translateInput

  #cancel(doCallback) {
    if (!!doCallback)
      this.#offCB();
  } // #cancel

  static #resetSlider() {
    anime({
      targets   : this.sliderNode,
      translateY: 0,
      duration  : 1000,
      easing    : 'eastOutInQuad',
      complete  : function (a) {
        a.remove(this.sliderNode);
      }
    });
  }

  #registerCallbacks(cbs) {
    const _cbs = [];
    cbs.forEach((cb, i) => {
      if (!Array.isArray(cb.times)) {
        cb.times = [cb.times]
      }
      cb.times.forEach(t => {
        //index this callback for each time
        _cbs[t] = cb;
      })
      //flag to track its use
      cb.isDone = false;
      cb.firedOn = 0;
    });
    return _cbs;
  }

  #zoomIn() {
    //keep zoomOn for the 5 minute threshold
    this.#_.zoomOn = (this.#_.timeLeft > this.#_.zoomWhen[1])
    // stop the timer but do NOT trigger the end sequence
    this.#isRunning = false;
    // goal-end time has not changed so re-use that
    this.#_.duration = this.translateInput(this.#endTime);
    this.#timeStarted = new Date();

    // "reverse" won't work here cuz that will take too long so...
    // "restart" the timeScale animation, but don't re-animate

    anime({
      targets   : '.flexClock__step',
      translateY: 0,
      duration  : 500,
      onComplete: function (a) {
        a.remove()
      }
    });
    anime({
      targets   : this.sliderNode,
      translateY: 0,
      duration  : 2000,
      onComplete: function (a) {
        a.remove()
      }
    })

    //remove any impacting animations (that have been stored)
    this.#scaleAnimation.forEach(a => {
      a.restart();
      a.pause();
      a.remove();
    });

    //slide the slider back up ( this animation does not have to be time-accurate)
    //this is taken care of by refresh()
    //TimerCountDown.#resetSlider();
    //delete all the steps
    //create new steps
    //restart the timer -- resuming the goal time
    this.start();
  }

  init() {
    this.sliderNode = document.querySelector('.' + this.#_.sliderClass);

    //add click handler to the triggerNode that will initiate
    this.triggerNode.addEventListener('click', function () {
      let turnOff = this.triggerNode.classList.contains('pressed');


      if (turnOff) {
        this.#isRunning = false;
        this.triggerNode.classList.remove('pressed');
        document.querySelector('.' + this.#_.showClass)
          .classList.add(this.#_.hideClass)

        this.#scaleAnimation.forEach(a => {
          a.restart();
          a.pause();
          a.remove();
        });

        const valueNode = this.valueNode;
        this.#cancel('doCallback');
        var deleteValue = setInterval( function(){
          if(valueNode.value===''){
            clearInterval(deleteValue)
          } else {
            valueNode.value = '';
          }
        },1000)

      } else //turn on
      {
        this.triggerNode.classList.add('pressed');
        document.querySelector('.' + this.#_.showClass)
          .classList.remove(this.#_.hideClass)

        /* by default calculate the duration to top of next hour */
        this.#_.duration = this.translateInput(
          this.valueNode.value
        );
        //re-register callbacks (so that they can fire again)
        this.#registerCallbacks(this.#_.callbacks);

        this.#timeStarted = new Date();
        this.#onCB();
        this.start();
      }
    }.bind(this));
  }

  start() {
    this.#_.timeLeft = this.#_.duration;
    this.refresh();
    this.#animateDrain();
  }

//TODO: is this needed?
  #timePassed() {
    let now = new Date()
    let dif = now - this.#timeStarted;
    return Math.abs(dif / 1000);
  }

  #animateDrain() {
    let duration = this.durationJS();
    let delayFudge = this.durationJS(this.#_.delayFudge);
    let secondsPast = 0;
    let stagger = duration / (this.#_.steps * 6); //(this.#_.timeOnEach * .5)/6;
    let stepsTime = 'steps(' + (this.#_.duration * .5) / 6 + ')';
    let sliderNode = this.sliderNode;
    let valueNode = this.valueNode;
    let zoomIn = this.#zoomIn.bind(this);
    let zoomInCt = duration <= 600000 ? 1 : 0;
    let updateTimeLeft = function (t) {
      this.#_.minutesRemaining = t;
    }.bind(this);
    let getMinsRemaining = function () {
      return this.#_.minsRemaining;
    }.bind(this);
    const that = this;
    const cbs = this.#callbacks;

    console.log('duration', duration);

    let h = [];
    this.#scaleAnimation.push(
      anime({
        targets   : '.flexClock__sub--A .flexClock__step',
      //  scaleX : '*=1.5',
        translateY: (e, i) => {
          if (i === 0) {
            h.push(+e.style.height.match(/[^p]*/)[0]) + 3;
            return 3;
          } else {
            return (i - 1) * (+e.style.height.match(/[^p]*/)[0] + 1) + (h[0]) + 2;
          }
        },
        duration  : anime.stagger(100)
      }));
    anime({
      targets : '.flexClock__span--super',
      scaleX : 1.2,
      complete : a=>a.remove()
    });

    this.#scaleAnimation.push(
      anime({
        targets : '.flexClock__progress--drain',
        scaleY  : [0, 1],
        duration: 2000
      })
    );

    this.#scaleAnimation.push(
      anime({
        targets : '.flexClock__progress--fill',
        scaleY  : [0, 1],
        opacity : [.8, .8],
        duration: duration,
        easing  : 'linear'
      })
    );

    const _interval = setTimeout(() => {

      const N = [...document.querySelectorAll('.flexClock__sub--A .flexClock__step .flexClock__span--super')];
      if (!N.length) {
        return;
      }
      clearInterval(_interval);

      let T = 0;
      let H = 525;
      const pxTotal = 525;
      N.forEach((n, i) => {
        let h = +n.parentElement.style.height.replace('px', '');
        n.data = {
          h: h,
          t: (h / pxTotal * duration)
        }
      });
      T = N[0].data.t;
      //anime as a time controller
      anime({
        targets : {ct: 0},
        ct      : duration,
        duration: duration,
        update  : a => {
          //console.log(O[0])
          //        delay   : anime.stagger(T1, {start: T0}),
          if (a.currentTime > T) {
            if (!N.length) {
              return;
            }
            let n = N.shift();
            let distance = H;
            let putInCan =false;
            if (!n) {
              return;
            }
            let h = n.data ? n.data.h : 40;
            if (N[0])
              T += N[0].data.t;
            const canProximity = Trash.calcDiffXY(n, Trash.getCanNode());
            //if the can is near on the X-axis then drop it in the can
            if (canProximity.diff.centerX >-100  && canProximity.diff.centerX <0) {
              putInCan = true;
              distance = canProximity.diff.centerY;// + 40;
            }
            anime.timeline({
              targets: n
            })
              .add({
                translateY: [
                  {
                    value   : n.data.h,
                    duration: 200,
                    easing  : 'easeInQuad',
                  },
                  {
                    value   : distance,
                    duration: 1000,
                    easing  : 'easeInQuad'
                  }
                ],
                translateX: [
                  {
                    value   : -40,
                    duration: 100,
                    delay   : 100
                  },
                  {
                    value   : -60,
                    duration: 1000,
                    easing  : 'easeInQuad'
                  }
                ],
                rotateZ   : [
                  {
                    value   : 45,
                    duration: 200,
                    easing  : 'linear'
                  },
                  {
                    value   : -45,
                    duration: 900,
                    easing  : 'linear'
                  },
                  {
                    value   : -0,
                    duration: 100,
                    easing  : 'linear'
                  }
                ],
                rotateX   : [
                  {
                    value   : 80,
                    duration: 100,
                    delay   : 1500,
                    easing  : 'linear'
                  }
                ],
                complete  : a => {
                  //put it IN the trashCan if it is near by
                  try {
                    if(putInCan){
                      document.querySelector('.trashCan__bottom').append(n.firstChild);
                      anime.set(n, {translateX: '', translateY : ''});
                    }
                  } catch (e) {
                    console.log(e);
                  }
                  //  a.remove();
                }
              }).add({
              opacity : 0,
              duration: (duration - a.currentTime)
            }); //anime (inner)
            H -= n.data.h;
          }
        },
        complete: a => {
          i++;
        }
      })
    }, 1500);

    (go => {
        if (go) {
          const anime2 = anime.timeline({loop: 1});
          this.#scaleAnimation.push(anime2);

          //cause the numbers to disappear by becoming to small
          document.querySelectorAll('.flexClock__sub--A .flexClock__step span')
            .forEach(node => {
                anime2.add({
                  targets : node,  //'.' + this.#_.drainClass,//'#domAttr .demo-content',
                  scale   : .1,
                  duration: (duration / that.#_.steps) - 300,
                  easing  : 'easeInBack'// 'linear',
                }).add({
                  targets : node,
                  scale   : 5,
                  opacity : 0,
                  duration: 300,
                  easing  : 'easeInQuad'
                });
              }
            );
        } //if
      }
    )
    (false);


    /* this animation will be kicked off with the other */
    this.queueFunc(function (milliPassed) {
      /* the Y translation will be based upon how pixel-far it needs to travel
      ** compared against the real-seconds left
       */
      let milliDelay = 0; //(50 / 568 * duration);
      let secsDuration = duration / 1000;
      let pxDistance = 525;
      let keepGoing = true;
      let translateY = pxDistance / secsDuration;
      let ratioTimePassed = milliPassed / duration;
      let curY = 0;
      that.#_.timeLeft = (duration - milliPassed);
      let minsLeft = that.#_.timeLeft / 60000;
      updateTimeLeft(minsLeft);
      let overRun = 5000;

      try {
        let h = that.#endTime.getHours();
        let m = that.#endTime.getMinutes() +1;
        [h, m] = m === 60 ? [h + 1, 0] : [h, m];

        m = m < 10 ? '0' + m : m;
        h = h < 10 ? '0' + h : h;
        let mAlt = (minsLeft + '').match(/^\d+([.]\d)?/)[0]
        valueNode.value = `${h}${m}-${mAlt}`;
      } catch (e) {
      }

      //user's time-based callbacks
      let cbOpts = cbs[Math.ceil(minsLeft)];
      if (cbOpts && !cbOpts.isDone && !cbOpts.firedOn) {
        //cb.firedOn !== Math.ceil(minsLeft) ) {
        try {
          //pass in TimerCountDown instance
          let cb = cbOpts.cb.bind(that);
          cbOpts.firedOn || cb(Math.ceil(minsLeft));
          cbOpts.isDone = true;
          cbOpts.firedOn = cbOpts.firedOn || milliPassed;
        } catch (e) {
          cbOpts.isDone = false;
          console.log('callback failed', e);
        }

      }
      if (milliPassed < milliDelay) {
        keepGoing = true;
      } else if (ratioTimePassed >= 0 && ratioTimePassed <= 1) {
        curY = ratioTimePassed * pxDistance;
        keepGoing = true;
      } else {
        curY = pxDistance
        //allow overrun
        let now = new Date();
        if ((now - that.#endTime) > overRun) {
          keepGoing = false;
        }
      }

      if (!that.#_.sunsetTriggered && minsLeft < 5) {
        //TODO:
      }

      //try with restarting the timer and a 10 minute value
      if (zoomInCt === 0 &&
        that.#_.zoomOn &&
        that.#_.timeLeft < that.#_.zoomWhen[0]
      ) {
        zoomInCt++
        //ZOOM in the animation;
        that.#isRunning = false;

        return zoomIn;
      }

      //5mins
      if (that.#_.timeLeft <= that.#_.zoomWhen[1]
        && that.#_.zoomOn) {
        //ZOOM in the animation;
        that.#isRunning = false;
        return zoomIn;
      }

      //slide the guide down via transform
      sliderNode.style.transform = `translateY(${curY}px)`;
      return keepGoing;
    });

  } //animateDrain

  hide() {

  }

  static grandFinale() {
    anime('#meetingOver').remove();
    anime('#meetingOver *').remove();

    anime.timeline({loop: 1})
      .add({
        targets           : '#meetingOver',
        'background-color': 'rgba(0,0,0,.8)',
        opacity           : 1,
        duration          : 100
      })
      .add({
        targets   : '#meetingOver .goodBye__letter',
        scale     : [0.3, 1],
        opacity   : [0, 1],
        translateZ: 0,
        easing    : "easeOutExpo",
        duration  : 600,
        delay     : (el, i) => 70 * (i + 1),
        complete  : () => {
          try {
            //find already promoted emoji
            let emoji = document.querySelector('#gallery .dragTemp');
            if (!emoji) {
              //promote an emoji
              let ev2 = document.createEvent('MouseEvents')
              ev2.initEvent('dblclick', true, true);
              emoji = document.getElementById('✌🏻');
              emoji.dispatchEvent(ev2);
              emoji = document.querySelector('#gallery .dragTemp');
            }
            //move emoji to compatible spot
            anime({
              targets : emoji,
              top     : 240,
              left    : 700,
              opacity : [0, 1],
              duration: 2000,
              easing  : 'easeInSine'
            })
            anime({
              targets     : document.querySelector('#gallery .dragTemp button'),
              'font-size' : 45
            });
          } catch (e) {
            console.log(e)
          }
        }
      })
      .add({
        targets : '#meetingOver .line',
        scaleX  : [0, 1],
        opacity : [0.5, 1],
        easing  : "easeOutExpo",
        duration: 700,
        offset  : '-=700'
      });
  } //grandFinale

} //TimerCountDown


const
  _Can = {
    node          : null,
    queue         : [],
    isEmpty       : true,
    inUse         : false,
    pushTranslateX: -200,
    pushDuration  : 2000,
    pullCan       : Promise.resolve(true),
    pushCan       : Promise.resolve(true),
    animateCan    : null,
    xy            : null,
    hiddenBall    : null
  };

class Trash {
  // #trashBall;
  #type;
  #_ = {};
  #canEmoji;
  #trashOffCB;
  #cl = {
    trashable: 'history--draggable2'
  };
  #startXY = {};
  #diffXY = {};
  #emoji;

  /*
  "TrashCan is always latent on the side of the screen.
  You choose what to throw into it
  When it's discarded the callback will be called
   */
  constructor(emoji, trashCB) {
    this.#emoji = emoji
    this.#trashOffCB = trashCB;
  }

  #setType() {
    if (this.#type === 'trash') {
      this.#_.canSpan = '🗑️'
    } else {
      this.#_.canSpan = '♻️'
    }
  }

  static #setHiddenBall(emoji, innerNode) {
    if (emoji instanceof Element) {
      innerNode = emoji;
    } else {
      emoji = emoji || '🏐';
    }

    const node = document.createElement('span');
    node.classList.add('trashCan__ball2', 'trashCan__ball2--hide');
    if (innerNode) {
      node.append(innerNode);
      anime.set(node, {
        translateX : 0,
        translateY : 0,
        width : '100%',
        height : '100%'
      });
    } else if (typeof emoji === 'string') {
      node.textContent = emoji;
    }
    return node;
  }

  static updateCanXY(xy) {
    //_Can.animateCan.finished()
    if (_Can.animateCan) {

    }

    if (xy) {
      Object.assign(_Can.xy, {
        left: xy.left,
        top : (anime.get(_Can.node, 'top') + '').replace('px', '')
      });
    } else {

      Object.assign(_Can.xy, {
        left: (anime.get(_Can.node, 'left') + '').replace('px', ''),
        top : (anime.get(_Can.node, 'top') + '').replace('px', '')
      });
    }
    // _Can.xy = _Can.node.getBoundingClientRect();
  }

  static getCanNode() {
    return _Can.node;
  }

  static #constructCan() {
    //TODO: check to see if there is a conflicting dom element
    let tempCan = document.createElement('div');
    tempCan.classList.add('trashCan');
    tempCan.id = 'trashCan';

    tempCan.innerHTML =
      `<span class="trashCan__sleeve">&nbsp;</span>
    <span class="trashCan__hand">🤚🏻</span>
    <span class="trashCan__emoji">🗑️</span>
    <div class="trashCan__bottom">
       <span class="trashCan__ball2">💩</span>
    </div>
    <div class="trashCan__clickFace"></div>`;
    _Can.node = tempCan;
    document.body.append(_Can.node);

    //now that can is in the dom it has coordinates... cache those
    _Can.xy = Trash.getXY(_Can.node);

    _Can.hiddenBall = Trash.#setHiddenBall(' ');
    _Can.node.append(_Can.hiddenBall);

    anime.timeline({
      //  autoplay: false
    }).add({
      targets: _Can.node.querySelector('.trashCan__hand'),
      rotate : [0, 90],
      begin  : a => {
        _
        //TODO:hide with class or make it empty space?
        // .classList.add('trashCan__ball2--hide');
      }
    });
  }

  /*
  * 1. when the page loads the trashCan is placed and then animated to the
  * requested (by configuration setting) spot
  * 2. every time the push animation is triggered it goes to the left edge of the screen
   */
  static initAnimation(
    translateX = _Can.pushTranslateX,
    duration = _Can.pushDuration
  ) {
    if (_Can.animateCan) {
      _Can.animateCan.remove();
    }

    anime.remove(_Can.node);

    _Can.animateCan = anime.timeline({
      targets : _Can.node,
      autoplay: false
    }).add({
      // translateX: translateX,
      left    : translateX,
      //top : top,
      duration: duration,
      easing  : 'easeOutQuint',
      update  : a => {
        //check if there is a need to reverse back to normal
        if (!_Can.isEmpty && !a.reversed) {
          // need to reverse
          a.reverse();
        }
      }
    });
    Trash.updateCanXY(_Can.xy);
    _Can.pushCan = _Can.animateCan.finished;
    return _Can.animateCan;

  }

  static initCan(
    translateX = _Can.pushTranslateX,
    duration = _Can.pushDuration
  ) {
    let canPromise;
    //can itself is a singleton;
    //if multiple items are tossIt they are queued up
    if (_Can.node === null) {
      //create a new can
      Trash.#constructCan();

      //1.
      const _A =
        anime.timeline({
          targets: _Can.node
        }).add({
          left    : translateX,
          //top : top,
          duration: duration,
          easing  : 'easeOutQuint'
        });

      //update it's base location
      _Can.xy =
        Object.assign(
          Trash.getXY(_Can.node),
          {left: 100}
        );

      _A.finished.then(() => Trash.initAnimation(_Can.xy.left, duration));

      Window._Can = _Can;
      //store the animation promise (just the 1st time)

    } else {
      //if there is a can do nothing
      //TODO:

    }
  } //initCan

  /*
  * TODO... as soon as pulling the can back we need to take back the promise on the
  * "pushed" can.
   */
  #pullCan2() {
    console.log('pullCan.  is it in use?', _Can.inUse);

    //make sure is ready for pulled direction
    if (_Can.animateCan.direction !== 'reverse') {
      _Can.animateCan.reverse();
    }

    _Can.pullCan = new Promise((resolve, reject) => {
      _Can.animateCan.finished.then(x => {
        //normalize for the next animation
        _Can.animateCan.reverse();

        //set as available
        _Can.inUse = false;

        resolve(_Can.animateCan);
      });

      //pull the can out
      _Can.animateCan.play();
    });
  } //pullCan2


  //pull = reverse;  push =normal
  #pullCan() {
    console.log('pullCan.  is it in use?', _Can.inUse);
    //make sure is ready for normal (i.e. pull) direction
    if (!_Can.animateCan.reversed) {
      _Can.animateCan.reverse();
    }

    _Can.pullCan = new Promise((resolve, reject) => {
      let P = function (a) {
        a.finished.then(x => {
          /* as soon as we enter this. _Can.animateCan has a new promise
          so if we don't like this promise we can start over with a new one
          */
          if (!a.reversed /* can was going in the correct direction */) {
            //set as available
            _Can.inUse = false;

            // then do normal resolve
            resolve(_Can.animateCan);
          } else {
            /* never resolve instead
            ** recreate with the updated animation
            * */
            P(_Can.animateCan);
          }
        });
      }
      //first call
      P(_Can.animateCan);

      //pull the can back
      if (_Can.animateCan.progress === 100 || !_Can.isEmpty) { //|| _Can.animateCan.paused) {
        _Can.animateCan.play();
      }

    });
  } //pullCan


  // reverse = push
  #pushCan(force) {

    console.log('pushCan.  is it in use?', _Can.inUse);
    //_Can.animateCan always resets it's promise on it's own
    // see animejs anime.finished behaviour

    //make sure is ready for pushed direction
    if (_Can.animateCan.reversed) {
      // even if the can is going back in. then stop it
      _Can.animateCan.pause();
      //reverse the direction back to reversed
      _Can.animateCan.reverse();
    }

    // going correct (normal) direction but not started (0%)
    if (_Can.animateCan.progress < 100) {

      _Can.pushCan = new Promise((resolve, reject) => {
        // Promise.all([_Can.pullCan, _Can.animateCan.finished]).then(x => {
        let P = function (a) {
          a.finished.then(x => {
            if (!a.reversed) {
              _Can.inUse = true
              // animation finished => resolve
              resolve(_Can.animateCan);
            } else {
              P(_Can.animateCan);
            }
          })
        }
        P(_Can.animateCan);

        //push the can out.
        if (_Can.animateCan.paused || _Can.animateCan.progress === 0) {
          _Can.animateCan.play();
        }
      });
    } else //correct direction and 100% out
    {
      //do nothing
      _Can.inUse = true
    }

  } //pushCan

  /*
  ** queue processing will continue until it is empty
  *
  * the queue is full of promises.
  * each time an item is passed to the queue the global promise can be updated.
  *
  * e.g. promise.all
   */
  #processQueue() {
    let next = _Can.queue.pop();

    if (next) {
      _Can.isEmpty = false;
      _Can.inUse = true;

      //do next
      Promise.all([_Can.pushCan, next]).then(values => {
        //recursively check queue when this toss resolves and do the next toss
        this.#processQueue();
      });
    } else {
      _Can.isEmpty = true;
      /*
      * queue is finally empty...
      * end the queued toss-animations and begin the pullback animation
       */
      this.#pullCan();
    }
  } //processQueue


  static getXY(node) {

    return (({top, left, height, width}) => ({
      top   : top,
      left  : left,
      height: height,
      width : width
    }))(node.getBoundingClientRect());
  }

  static getSpecificXY(XY, choices = ['left', 'top', 'width', 'height']) {
    const O = {}
    choices.forEach(choice => {
      O[choice] = XY[choice];
    });
    return O;
  }

  static calcDiffXY(
    start, /*emoji*/
    end, /* trash can*/
    maxHW = [50, 50]) {
    const diff = {};
    const _start = {};
    if (start instanceof Element) {
      start = start.getBoundingClientRect();
    }

    if (end instanceof Element) {
      end = end.getBoundingClientRect();
    }

    try {
      (({top, left, height, width, bottom, right},
        {
          top   : endT,
          height: endH,
          width : endW,
          left  : endL,
          bottom: endB,
          right : endR
        }) => {
        const centerY = top - height / 2;
        const centerX = right - width / 2;
        const endCY = endB - endH / 2;
        const endCX = endR - endW / 2;
        //calc the center difference
        Object.assign(_start, {
          top    : top,
          left   : left,
          height : Math.min(height, maxHW[0]),
          width  : Math.min(width, maxHW[1]),
          centerX: centerX,
          centerY: centerY,
          bottom : bottom,
          right  : right
        });
        Object.assign(diff, {
          height : endH,
          width  : endW,
          bottom : endB - bottom,
          right  : endR - right,
          centerX: endCX - centerX,
          centerY: endCY - centerY,
          top    : endT - top, ///- height / 2,
          //   top: (endT - (endH / 2)) - top,

          //consider trashCan's future translateX ?
          left: endL - left // width / 2) // - _Can.pushTranslateX)
          //   left : (endL - (endW / 2 ) - _Can.pushTranslateX) - left
        });
      })(start, end);
      return {
        start: _start,
        diff : diff
      };
    } catch (e) {
      return false;
    }
  } //calcDiffXY

  static #getBall(emoji) {
    //TODO: size this?
    const trashBall = document.createElement('div');
    trashBall.classList.add('trashCan__ball');
    trashBall.id = 'trash' + emoji;
    const mask = document.createElement('span');
    mask.classList.add('trashCan__ballMask');
    mask.textContent = ''
    trashBall.append(mask);
    return trashBall;
  } //getBall

  /*
  * this ball is a co-hort to the emoji.
  * it will copy its content. it already sits in the trash can
   */
  #revealBall2() {

  }

  /*
  * App will call toss when it has something to throw out.
  * That will be added to a queue.
  *
  * They will get a promise in return that can be evaluated
  *
  * e.g.
  * await myTrash.tossIt( node1 selectors);
  *
  * if( myTrash.tossIt ){
  *  // cheer
  * } else {
  *   //boo
  * }
   */
  tossIt(doRemove, startXY, nodeAnimation = true, selectorsToCleanUpAfter = []) {

    //asynchronously begin animation on the can
    this.#pushCan();
    _Can.inUse = true;

    /*
    * startXY can be an object like this or a node that will be calc'd
    * {
    *    top : top,
    *    left : left,
    *    height : height,
    *    width : width
    * }
     */

    const tossPromise = new Promise(async (resolve, reject) => {
      //kill animations on the node

      //clone it (and contents)

      const nodeToBallUp = doRemove ? this.#emoji.cloneNode(true) : this.#emoji;

      //determine if the node is in the gallery. (helpful later)
      const parentNode = this.#emoji.parentElement;
      const inGallery = parentNode.classList.contains('history--draggable');

      const emoji = nodeToBallUp.textContent;

      //get the ball (holder)
      const trashBall = Trash.#getBall(emoji);

      //add the ball (holder) to the Dom. it's invisible at this point
      document.body.append(trashBall);

      //need to wait for the nodeAnimation to finished before we can calc thse values
      await nodeAnimation.finished;
      //store where the current element is (has to be an element in the dom)
      // calculate the difference from start location to final-trash-location

      if (startXY && startXY instanceof Element) {
        startXY = Trash.getXY(startXY);
      } else if (startXY) {
        //startXY
      } else {
        startXY = this.#emoji.getBoundingClientRect();
      }

      const calcDiff = Trash.calcDiffXY(startXY, _Can.xy, [50, 50]);
      this.#startXY = Trash.getSpecificXY(calcDiff.start);
      this.#diffXY = calcDiff.diff;

      //size the holder (has to be in DOM to be sized)
      anime.set(trashBall, Object.assign({}, this.#startXY, {
        translateY: 0,
        translateX: 0,
        scale     : 1
      }));

      //resize the candidate to match the start size of the trash
      /* const transformParent = anime.timeline({
         targets : trashBall,
         autoplay: false
       }).add({
         scale   : 1,
         complete: a => a.remove('*'),
         duration: 1000
       });*/

      const emojiInBall = new Promise((resolve, reject) => {
        // transformParent.finished.then(() => {

        //delete original node ?
        if (doRemove)
          this.#emoji.remove();

        //insert Clone into trashBall
        trashBall.prepend(nodeToBallUp);//emoji

        //insert emoji into the ball (still in Dom)
        resolve(true);

        // });
      });
      // transformParent.play();//TODO: necessary?

      await emojiInBall;

      const ballFlight = this.#animateBall(trashBall, doRemove, inGallery);


      //make sure can has completed being pushed out
      await _Can.pushCan;

      /*  const R = Trash.animateOnce(
          ballFlight,
          true,
          150 // early resolution
        )*/

      ballFlight.finished.then(() => {
        // replace ball with a fake one that is in the can
        // then remove the real ball

        const hiddenBall = Trash.#setHiddenBall(emoji, trashBall.firstChild);

        //remove the real ball is done in the animation
        anime.set(hiddenBall, {rotate: Math.random() * 90});
        _Can.node.querySelector('.trashCan__bottom').append(hiddenBall);
        hiddenBall.classList.remove('trashCan__ball2--hide');
        trashBall.remove();
        resolve(true);
      });

      // resolve(true);
      ballFlight.play();


      // await Trash.#animateOnce(ballFlight);


      //  _Can.hiddenBall.textContent = emoji;
      //  _Can.hiddenBall.classList.remove('trashCan__ball2--hide');


      //delete this item from the queue is taken care of elsewhere
    });

    tossPromise.then(() => {

      this.#trashOffCB
    });

    //add this promise to the front of the queue
    _Can.queue.unshift(tossPromise);

    //begin processing the queue
    //if (!_Can.inUse) {
    //TODO:DEBUG
    this.#processQueue()
    //}
    return tossPromise;
  } //toss

  /*
  * when an animation completes then animation.finished promise is fulfilled
  * the problem is that it is instantly reset to a pending promise so you cannot check it again
  *
  * #animateOnce wraps the animation in a promise that will only be resolved once;
  *
   */
  static animateOnce(animation, returnValue, earlyResolveDuration) {

    let tick = 100;
    let elapsed = 0;
    let isResolved = false;
    returnValue = typeof returnValue === 'undefined' ? returnValue : animation;
    let _P;
    let interval;

    if (!earlyResolveDuration) {
      //animation automatically has a promise on it, but it resets on every play
      _P = animation.finished.then(() => {
        isResolved = true;
        return returnValue;
      });
    } else //
    if (earlyResolveDuration) {
      //else the resolution is not necessarily tied to end of the animation
      _P = new Promise((resolve, reject) => {
        interval = setInterval(() => {
          //just in case the animation does somehow finish before expected
          animation.finished.then(() => {
            //automatically resolve
            elapsed = earlyResolveDuration;
            isResolved = true;
            clearInterval(interval);
            resolve(returnValue);
          });

          if (!animation.paused) {
            elapsed += tick;
          }

          if (elapsed >= earlyResolveDuration) {
            clearInterval(interval);
            resolve(returnValue);
          }
        }, tick)
      });
    }
    return _P;
  }

  #animateBall(trashBall, doRemove = true, inGallery = false) {
    const emoji = trashBall.textContent;

    const Xfudge = 5; // inGallery ? 60 : 60;
    const Yfudge = -30; //inGallery ? -100 : -80;
    const arcTop = this.#diffXY.top - 600;
    const mask = trashBall.querySelector('.trashCan__ballMask');
    let maskWasVolley = false;
    const tranY = [
      arcTop,
      this.#diffXY.top * .8 - Yfudge,
      this.#diffXY.top * 1 - Yfudge,// Yfudge // + 20
    ];
    return anime.timeline({
        autoplay: false
      } /*).add(
      Object.assign({}, this.#startXY, {
        height    : 20,
        width     : 20,
        scale     : .2,
        opacity   : 1,
        translateY: 0,
        translateX: 0
      }) */
    ).add({
      targets   : trashBall, // document.querySelector('.highlight'),
      opacity   : 1,
      scale     : [{
        value   : 2,
        duration: 1700,
        easing  : 'easeInQuad'
      }, {
        value   : 1,
        duration: 300,
        easing  : 'easeOutQuad'
      }],
      translateY: [
        {
          value   : tranY[0],
          duration: 1000,
          easing  : 'easeOutQuint'
        },
        {
          value   : tranY[1],
          duration: 800,
          easing  : 'easeInQuad'
        }, {
          value   : tranY[2],
          duration: 200,
          easing  : 'linear'
        }
      ],
      translateX: [
        {
          value   : (this.#diffXY.left * .75),
          duration: 1200,
          easing  : 'easeInOutQuad'
        },
        {
          value   : (this.#diffXY.left * .93), //- Xfudge,
          duration: 500,
          easing  : 'easeInQuad'
        }, {
          value   : (this.#diffXY.left * 1),//- Xfudge,
          duration: 300,
          easing  : 'linear'
        },
      ],
      begin     : a => {
        anime({
          targets: trashBall.children,
          opacity: [{
            value   : .8,
            duration: 2000,
            easing  : 'easeOutQuad'
          }],
          rotate : [{
            value   : 90,
            duration: 500,
            easing  : 'easeInOutQuad'
          },
            {
              value   : 940,
              duration: 1000,
              easing  : 'linear'
            },
            {
              value   : 90,
              duration: 500,
              easing  : 'easeOutQuad'
            }]
        });
      },
      update    : a => {

        let xy = trashBall.getBoundingClientRect();
        /*   console.log({
             left    : xy.left,
             top     : xy.top,
             opacity : trashBall.style.opacity,
             progress: a.progress
           });*/
        if (!maskWasVolley && a.progress > 20 && a.progress < 85) {
          mask.textContent = '🏐';
          maskWasVolley = true;
        } else if (a.progress >= 85) {
          mask.textContent = ' ';
          mask.style.opacity = 0;
        }
        //ball-up/crumple in the last half of the flight

        if (!_Can.animateCan.reversed) {
          // this.#pushCan()
        }
      },
      complete  : a => {
        a.remove();
        if (doRemove) {
          trashBall.remove();
        }

      }
    });
  }//animateBall

} //TrashCan


const _ = {
  scale       : 1,
  opacity     : 1,
  began       : false,
  adjustment  : 2000,
  idlerotation: true
};
var RP; //singleton


class RocketPath {
  constructor(target, pathNode, opts) {
    this.path = anime.path(pathNode);
    this.target = target;
    if (opts) {
      Object.assign(_, opts);
    }
    opts.adjustment = this.adjustSpeed(opts.adjustment);
    if (!RP) {
      RP = this;
      this.initAnimation();
    } else {
      this.animation = RP.animation;
    }


  }

  adjustRotation(doRotate) {
    _.idlerotation = !!doRotate;
  }

  adjustSpeed(adjustment) {
    adjustment = Math.floor(+adjustment); //make sure it's a valid number
    _.adjustment = Math.max(adjustment, 2000);
  }

  setTarget(newTargetEmojiOrElement) {
    if (typeof newTargetEmojiOrElement === 'string') {
      RP.target
        .getElementsByClassName('idleAnimation__span')[0].textContent
        = newTargetEmojiOrElement;
    } else if( emoji instanceof HTMLElement ){
      RP.target = newTargetEmojiOrElement;
    }
    return RP.target
  }

  getTarget() {
    return RP.target;
  }

  resume() {
    //RP.initAnimation();
    RP.animation.play();
  }

  initAnimation(forceNew) {
    let duration = (anime.random(1,20000) + _.adjustment);
    if (RP.animation) {
      //  delete RP.animation;
      anime.remove(RP.target)
    }
    RP.animation = anime({
      targets   : RP.target, //'#idleAnimation',
      translateX: RP.path('x'),
      translateY: RP.path('y'),
      scale     : function () {
        let range = [_.scale];
        _.scale = (Math.random() * 8 + 1.5);
        range.push(_.scale);
        return range;
      },
      rotate    : function () {
        return _.idlerotation ? RP.path('angle') : 0;
      },
      //rotateX : 90,
      easing    : 'linear',
      opacity   : function () {
        let range = [_.opacity];
        _.opacity = (Math.max(Math.random(), .5));
        range.push(_.opacity);
        return range;
      },
      duration  : duration,
      //  autoplay  : false,
      begin     : function () {
        _.began = true;
        _.completed = false;
      },
      complete  : function () {
        _.completed = true;
        _.began = false;
        //restart this animation with new random values
        RP.initAnimation(true);
     //   RP.animation.play();
      }
    })
  } // initAnimation
}

Animation.prototype.moveTarget = function (direction, pixels = 10, $el) {
  let directionKeys = {
    37     : ['left', -1],
    38     : ['top', -1],
    39     : ['left', 1],
    40     : ['top', 1],
    'left' : ['left', -1],
    'up'   : ['top', -1],
    'right': ['left', 1],
    'down' : ['top', 1]
  };
  direction = directionKeys[direction];
  $el = $el || this.$el
  if (!$el) {
    return;
  }
  let $ = this.$el.constructor;
  /* loop through both cuz they have different old and new values */
  $el.each(function () {
    let $this = $(this);
    console.log('moving '+direction[0])
    $this.css(
      direction[0],
      $this.css(direction[0]).match(/^[-]?\d*/)[0]++ + (pixels * direction[1]) //calculate from old
    );
  });
  return;
}

export default {
  Animation     : Animation,
  RocketPath    : RocketPath,
  TimerCountDown: TimerCountDown,
  TrashCan      : Trash
}

/*


 */