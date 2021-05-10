import anime from 'animejs';
//anime.suspendWhenDocumentHidden = false; // default true
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

  removeAnimation() {
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
      // let c = this.animationCache;
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

const _TimerCountDown = {
  sliderNode: {},
  clock     : {},
  finale    : null,
  container : null,
  xy        : {},
  isLeft    : false
}

/*
* currently this is a singleton. Wouldn't take much to change that
 */
class TimerCountDown {

  #onCB;
  #offCB;
  #_ = {
    timeLeft        : 3600000, // time remaining
    minutesRemaining: (3600000 / 60 / 1000),
    duration        : 3600000, // initial time (e.g. meeting length)
    hideClass       : 'flexClock--hide',
    showClass       : 'flexClock',
    fillClass       : 'flexClock__progress--fill',
    drainClass      : 'flexClock__progress--drain',
    subClass        : 'flexClock__sub',
    sliderClass     : 'flexClock__slider',
    warnWrapClass   : 'flexClock__warnWrap',
    steps           : 12,
    doMins          : true,
    delayFudge      : 0,
    stepSize        : 5,
    zoomOn          : true,
    zoomWhen        : [600000, 300000] // time remaining threshold to zoom in at
  };
  #timeStarted;
  #isRunning = false;
  #endTime;
  #scaleAnimation = [];
  #callbacks = []; //timebased callbacks that fire on times

  constructor(containerNode, triggerNode, valueNode, targetNode, opts, onCB, offCB) {
    _TimerCountDown.container = containerNode;  // typically document.body
    this.triggerNode = triggerNode;
    this.targetNode = targetNode;
    _TimerCountDown.clock = this.targetNode;
    this.valueNode = valueNode;
    this.#onCB = onCB;
    this.#offCB = offCB;
    TimerCountDown.prepFinale();
    this.#timeStarted = 0;

    //apply options
    Object.assign(this.#_, opts);

    this.#registerCallbacks(this.#_.callbacks);
    this.init();
  }

  static #updateLeft(isLeft) {
    isLeft = typeof isLeft === "boolean" ? isLeft : _TimerCountDown.isLeft;

    let wrapClass = 'flexClock__warnWrap';
    //update classes on nodes
    let warningWrap = _TimerCountDown.container.getElementsByClassName(wrapClass);
    if (warningWrap.length) {
      warningWrap = warningWrap[0];
    }

    //TODO: do we need to update the slider or just the wrap?
    if (isLeft) {
      warningWrap.classList.add(wrapClass + '--left');
    } else {
      warningWrap.classList.remove(wrapClass + '--left');
    }
  }

  static locate(doCalc = true) {
    const XY = {};
    const oldIsLeft = _TimerCountDown.isLeft;
    if (doCalc) {
      Object.assign(XY, Trash.calcDiffXY(_TimerCountDown.sliderNode, _TimerCountDown.container, [2000, 2000]));
      //if slider-left is left of screen-center then we're left
      _TimerCountDown.isLeft = (XY.end.centerX > XY.start.left);
      _TimerCountDown.xy = XY.start;

      if (oldIsLeft !== _TimerCountDown.isLeft) {
        TimerCountDown.#updateLeft(_TimerCountDown.isLeft)
      }
    }
    return (({xy, isLeft}) => ({
      xy,
      isLeft
    }))(_TimerCountDown);
  }

  static makeWarning(text, classList = [], node) {
    const wrapClass = 'flexClock__warnWrap';
    let warningWrap =
      //  flexClock__warningArea
      _TimerCountDown.container.getElementsByClassName(wrapClass);

    if (warningWrap.length) {
      warningWrap = warningWrap[0];
    } else {
      warningWrap = document.createElement('div');
      warningWrap.classList.add(wrapClass);
    }

    if (TimerCountDown.locate(false).isLeft) {
      warningWrap.classList.add(wrapClass + '--left');
    }

    const warning = document.createElement('button');
    const subWarning = document.createElement('span');
    classList = Array.isArray(classList) ? classList : [classList];
    warning.classList.add(...classList);
    subWarning.textContent = text;
    warning.append(subWarning);
    warningWrap.append(warning);

    node && warning.append(node);

    //append it to the same outer container (NOT inside the clock area)
    _TimerCountDown.container.append(warningWrap);

    //make the warning draggable
    return warning;
  }

  durationJS(t = this.#_.duration) {
    return (this.#_.doMins ? t * 60 : t) * 1000;
  }

  static getClock() {
    return _TimerCountDown.clock;
  }

  static #getStep(height, txt) {
    let borderFudge = 0; //TODO:
    let el = document.createElement('div');
    //add class
    el.classList.add('flexClock__step');
    el.style.height = (height - borderFudge) + 'px';

    if ((height - borderFudge) < 20) {
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
    [...this.targetNode.firstElementChild.children].forEach(el => el.remove());

    this.#_.sunsetTriggered = false;

    //
    let pixels = this.targetNode.getBoundingClientRect().height
    let pixelsPerMin = pixels / dur;

    //break it up into steps. e.g. 60 minutes into 12 5 minute steps
    this.#_.delayFudge = (dur % this.#_.stepSize);
    let firstStepH = pixelsPerMin * this.#_.delayFudge;
    //this.#_.duration = dur - this.#_.delayFudge;
    let adjustedDuration = dur;
    if (this.#_.delayFudge > 0) {
      //added a whole step
      adjustedDuration = dur - this.#_.delayFudge + this.#_.stepSize;
    }

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
        stepsA = [TimerCountDown.#getStep(firstStepH, '~' + Math.round(dur))]
      } else {
        stepText = adjustedDuration - (i * this.#_.stepSize); //
        //  stepText = remainingDuration  - (i * this.#_.stepSize);
        stepsA = [TimerCountDown.#getStep(stepHeight, stepText)];
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
    let h, m, s, duration, future;
    const now = new Date();
    if (timeRequest instanceof Date) {
      future = timeRequest;
      duration = (future - now) / 1000 / 60
    } else if (/^(\d{1,3})([.]\d{1,2})?$/.test(timeRequest)) {
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

  static getSlider() {
     return _TimerCountDown.sliderNode
  }

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
    if(this.sliderNode)
      this.sliderNode.firstElementChild.textContent = '🦥';
  //  this.sliderNode.firstElementChild.textContent = '️⏳';
  }

  #registerCallbacks(cbs) {
    const _cbs = [];
    cbs.forEach((cbo) => {
      if (!Array.isArray(cbo.times)) {
        cbo.times = [cbo.times]
      }
      cbo.times.forEach(t => {
        //index this callback for each time
        _cbs[t] = {
          cb      : cbo.cb,
          //minute it will fire
          times   : t,
          //flag to track its use
          isDone : false,
          firedOn : null,
        }
      });
    });
    this.#callbacks = _cbs;
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
      // a.restart();
      // a.pause();
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

  #setSliderNode(node){
    this.sliderNode = node;
    _TimerCountDown.sliderNode = node;
  }

  init() {
    _TimerCountDown.xy = Trash.getXY(_TimerCountDown.container);

    this.#setSliderNode(document.querySelector('.' + this.#_.sliderClass));


    //add click handler to the triggerNode that will initiate
    this.triggerNode.addEventListener('click', function () {
      let turnOff = this.triggerNode.classList.contains('pressed');


      if (turnOff) {
        this.#isRunning = false;
        this.triggerNode.classList.remove('pressed');
        document.querySelector('.' + this.#_.showClass)
          .classList.add(this.#_.hideClass)


        this.#scaleAnimation.forEach(a => {
          //a.restart();
          //  a.pause();
          a.remove();
        });

        //remove all steps
        [...this.targetNode.firstElementChild.children].forEach(el => el.remove());


        const valueNode = this.valueNode;
        this.#cancel('doCallback');
        var deleteValue = setInterval(function () {
          if (valueNode.value === '') {
            clearInterval(deleteValue)
          } else {
            valueNode.value = '';
          }
        }, 1000)
        TimerCountDown.prepFinale();
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
  /*#timePassed() {
    let now = new Date()
    let dif = now - this.#timeStarted;
    return Math.abs(dif / 1000);
  }*/

  #animateDrain() {
    let duration = this.durationJS();
    let delayFudge = this.durationJS(this.#_.delayFudge);

    let sliderNode = this.sliderNode;
    let valueNode = this.valueNode;
    let zoomIn = this.#zoomIn.bind(this);
    let zoomInCt = duration <= 600000 ? 1 : 0;
    let updateTimeLeft = function (t) {
      this.#_.minutesRemaining = t;
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
            h.push(+e.style.height.match(/[^p]*/)[0]);// + 3;
            return 0;
          } else {
            return (i - 1) * (+e.style.height.match(/[^p]*/)[0]) + (h[0]);// + 2;
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
      let H = _TimerCountDown.xy.height; //~540
      const pxTotal = H; // 525;
      N.forEach((n, i, N) => {
        let h = +(Trash.getSpecificXY(n.parentElement, 'height',).height);
        let h2 = +(Trash.getSpecificXY(n, 'height').height)
        N[i].data = {
          h : h,
          h2: h2,
          t : (h / pxTotal * duration)
        }
      });
      let hMult = -1;
      T = N[0].data.t;
      let durationMinus5 = duration - (10 * 60 * 1000);
      let ratioTarget = (durationMinus5 / duration) * 100
      let i = 0;
      let newR;
      let newG;
      let doColorChange = false;

      if (duration > 610000 ) {
        doColorChange=true;
      }
      //anime as a time controller
      anime({
        targets : {ct: 0},
        ct      : duration,
        duration: duration,
        update  : a => {
          if (doColorChange) {
            //all way  up red
            newR = (a.progress *2 / ratioTarget) * 255;
            //then down on yellow
            newG = newR > 240 ? 510 - newR  : 255;
            sliderNode.firstElementChild.style.backgroundColor = `rgba(${newR},${newG},0,.1)`;
            sliderNode.firstElementChild.style.borderColor = `rgba(${newR},${newG},0,1)`;
          }
          //console.log(O[0])
          //        delay   : anime.stagger(T1, {start: T0}),
          if (a.currentTime > T) {
            hMult = -1

            if (!N.length) {
              return;
            }
            let node = N.shift();
            let distance = H;
            let putInCan = false;
            if (!node) {
              return;
            }
            let h = node.data ? node.data.h : 0;
            if (N[0])
              T += N[0].data.t;

            //if slider is on the left then use positive offset to fall to X-positive
            if (sliderNode.firstElementChild.classList &&
              sliderNode.firstElementChild.classList.contains('flexClock__slider__button--left'))
              hMult = 1;

            anime.timeline({
              targets: node
            })
              .add({
                translateY: [
                  {
                    value   : node.data.h,
                    duration: 200,
                    easing  : 'easeInQuad',
                  },
                  {
                    value   : Math.abs(distance) - node.data.h2, //account for the height of your average number
                    duration: 1000,
                    easing  : 'easeInQuad'
                  }
                ],
                translateX: [
                  {
                    value   : hMult * 40,
                    duration: 100,
                    delay   : 100
                  },
                  {
                    value   : hMult * 60,
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

                  try {
                    let oldText = node.firstElementChild.textContent;
                    node.firstElementChild.textContent = '💭';
                    //put it IN the trashCan if it is near by
                    //if the can is near on the X-axis then drop it in the can
                    putInCan = Trash.isAwithinB(node, Trash.getCanNode(), {
                      //adjust for falling X trajectory which, here, affects left and right co-ordinates
                      left : (hMult * 50),
                      right: (hMult * 50)
                    }, true, ['centerX']);
                    if (putInCan || !!oldText ){
                      //put it in the can
                      Trash.getCanNode().querySelector('.trashCan__bottom').append(node.firstElementChild);
                      anime.set(node, {
                        translateX: 0,
                        translateY: 0
                      });
                       node.firstElementChild.textContent = oldText;
                    } // else leave the splat on the floor
                    else {
                      //     const n = n.firstElementChild;
                      //leave it on the floor
                      node.classList.add('floor__trash');
                   //   node.firstElementChild.textContent = '💭';
                      anime.set(node, Object.assign({},
                        Trash.getXY(node), {
                          translateX : 0,
                          translateY : 0,
                          border     : 0,
                          opacity    : 1,
                          'font-size': '2em'
                        }));
                      document.getElementById('floor').append(node);
                      //anime.set(subn, {translateX: '', translateY : ''});
                    }
                  } catch (e) {
                    console.log(e);
                  }
                }
              });
            H -= node.data.h;
          }
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
      let pxDistance = _TimerCountDown.xy.height; //525;
      let keepGoing = true;
//      let translateY = pxDistance / secsDuration;
      let ratioTimePassed = milliPassed / duration;
      let ratioTimePassedFor5 = milliPassed / (duration - 5 * 60 * 1000);
      let curY = 0;
      that.#_.timeLeft = (duration - milliPassed);
      let minsLeft = that.#_.timeLeft / 60000;
      updateTimeLeft(minsLeft);
      let overRun = 600000; //10minutes

      try {
        let h = that.#endTime.getHours();
        let m = that.#endTime.getMinutes();// +1;
        [h, m] = m === 60 ? [h + 1, 0] : [h, m];

        m = m < 10 ? '0' + m : m;
        h = h < 10 ? '0' + h : h;
        let mAlt = (minsLeft + '').match(/^\d+([.]\d)?/)[0]
        valueNode.value = `${h}${m}-${mAlt}`;
      } catch (e) {
      }

      //user's time-based callbacks
      let idx = Math.ceil(minsLeft);
      if (idx === 0) {
        idx = 0;
      }
      let cbOpts = cbs[idx];
      if (cbOpts && !cbOpts.isDone && !cbOpts.firedOn) {
        //cb.firedOn !== Math.ceil(minsLeft) ) {
        try {
          //pass in TimerCountDown instance
          let cb = cbOpts.cb.bind(that);
          cbOpts.isDone || cb(idx, cbOpts);
          cbOpts.firedOn = cbOpts.firedOn || milliPassed;
          cbOpts.isDone = true;
        } catch (e) {
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
        //allow overrun becuase there are post-timer flows
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
        sliderNode.firstElementChild
//        && sliderNode.firstElementChild.classList.add('flexClock__slider__button--red')
        && (sliderNode.firstElementChild.textContent = '️⏳')
        return zoomIn;
      }

      //slide the guide down via transform
      sliderNode.style.transform = `translateY(${curY}px) rotateZ(-45deg)`;
      return keepGoing;
    });

  } //animateDrain

  hide() {

  }

  static #getFinaleHTML() {
    return `    
        <h1 class="goodBye__header">
          <div class="goodBye__wrapper">
              <div class="goodBye__line goodBye__line--line1"></div>
                <div class="goodBye__letters">
                  <span class="goodBye__letter">M</span>
                  <span class="goodBye__letter">e</span>
                  <span class="goodBye__letter">e</span>
                  <span class="goodBye__letter">t</span>
                  <span class="goodBye__letter">i</span>
                  <span class="goodBye__letter">n</span>
                  <span class="goodBye__letter">g</span>
                  <span class="goodBye__letter">&nbsp;</span>
                  <span class="goodBye__letter">O</span>
                  <span class="goodBye__letter">v</span>
                  <span class="goodBye__letter">e</span>
                  <span class="goodBye__letter">r</span>
              </div>
              <div class="goodBye__line goodBye__line--line2"></div>
          </div>
              <input class="goodBye__counter">&nbsp;</input>
        </h1>`;
  }

  /*
  * typically called at shutdown in order to prepare for next meeting
   */
  static prepFinale() {
    let meetingOver = document.getElementById('meetingOver');
    if (meetingOver) {
      meetingOver.remove();
    }
    meetingOver = document.createElement('div');
    meetingOver.id = 'meetingOver'
    meetingOver.classList.add('goodBye');
    meetingOver.innerHTML = TimerCountDown.#getFinaleHTML();
    _TimerCountDown.container.prepend(meetingOver);
    _TimerCountDown.finale = meetingOver;
  }

  static grandFinale() {
    if (!_TimerCountDown.finale) {
      TimerCountDown.prepFinale();
    }
    try {
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
              const bannerXY = Trash.getXY(
                _TimerCountDown.finale.querySelector('.goodBye__wrapper')
              );
              const emojiLeft = (
                +bannerXY.right
                - Trash.getXY(emoji).width
                - 100
              );
              //move emoji to compatible spot
              anime({
                targets : emoji,
                top     : bannerXY.bottom,
                left    : emojiLeft,
                opacity :
                  [0, 1],
                duration: 2000,
                easing  : 'easeInSine'
              });
              anime({
                targets    : document.querySelector('#gallery .dragTemp button'),
                'font-size': 45
              });
            } catch (e) {
              console.log(e)
            }
          } // complete
        })
        .add({
          targets : '#meetingOver .line',
          scaleX  : [0, 1],
          opacity : [0.5, 1],
          easing  : "easeOutExpo",
          duration: 700,
          offset  : '-=700'
        })
        .add({
          targets           : '#meetingOver',
          'background-color': 'rgba(0,0,0,.2)',
          duration          : 600000, //10 minutes
          complete          : a => {
            a.remove('*');
          }
        });
    } catch (e) {
      console.log('grand finale fail');
    }
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

const _Broom = {
  node      : null,
  interval  : null,
  doExamine : false,
  animationP: Promise.resolve(true),
  xy        : null
}

class Trash {
  // #trashBall;
  #type;
  #_ = {};
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
  constructor(container, emoji, trashCB) {
    this.#emoji = emoji
    this.#trashOffCB = trashCB;
    _Broom.node = _Broom.node || document.querySelector('.floor__broom');
    if (!_Broom.xy) {
      let h = Trash.getXY(container).height - Trash.getXY(_Broom.node).height - 40;
      _Broom.node.style.top = h + 'px'
    }

  }

  /*
    #setType() {
      if (this.#type === 'trash') {
        this.#_.canSpan = '🗑️'
      } else {
        this.#_.canSpan = '♻️'
      }
    }*/

  static getBroom() {
    return _Broom.node;
  }

  static stopBroom() {
    _Broom.interval && clearTimeout(_Broom.interval);
  }

  static forceBroom(broom, dustBunnies = [], cb) {
    cb = cb || function (a,next) {
      if (a.progress > 80 && !a.dust) {
        a.dust=true;
        next && next.remove();
      }
    };

    if (!dustBunnies.length) {
      dustBunnies = Trash.#getDustBunnies('.floor__trash');
    }
    broom = _Broom.node || document.querySelector('.floor__broom');
    //inherit XY properties from first dust bunny
    const dustXY = {};
    let newY;

    if (dustBunnies.length) {
      _Broom.nextDust = dustBunnies.shift();
      //   Object.assign(dustXY, Trash.getXY(_Broom.nextDust));
      Object.assign(dustXY, Trash.calcDiffXY(broom, _Broom.nextDust,).diff);
    }

    //make the broom target the dust bunny
    //const broomXY = Trash.getXY(broom);


    //  dustXY.bottom - (broomXY.height ** 2 + broomXY.width **2 ) ** .5;
    // XY.left = XY.left;

    let animation;
    _Broom.animationP.then(() => {
      anime.remove(broom);
      animation = anime.timeline({
        targets  : broom,
        direction: 'alternate',
        loop     : 2
      }).add({
        translateY: dustXY.bottom,
        translateX: 0,
        zIndex    : 24000
      }).add({
        translateX: [0, dustXY.left],
        duration  : 2000,
        begin     : a => {
          //animate the broom emoji
          anime({
            targets  : broom.firstElementChild,
            rotateZ  : [-45, -20],
            duration : 500,
            direction: 'aternate',
            easing   : 'easeInOutQuad',
            loop     : 6
          });
        },
        update    : a => {
          cb && cb(a,_Broom.nextDust);
        },
        complete : a=>{
          //TODO perhaps fire the next sweep if there is more dust?
        }
      }).add({
        zIndex: 0
      });//anime

      _Broom.animationP = animation.finished;

    }); //then
  }

  static
  #getDustBunnies(nodes) {
    let _nodes;
    if (!Array.isArray(nodes) && typeof nodes === 'string') {
      // is a selector
      _nodes = [...document.querySelectorAll(nodes)];
    } else if (nodes instanceof Element) {
      //is element
      _nodes = [...nodes.children];
      //is neither
    } else {
      _nodes = [];
    }
    return _nodes;
  }

  static addDust(nodes) {
    try {
      document.getElementById('floor').append(nodes);
      return true;
    } catch (e) {
      console.log('addDust', e);
      return false
    }
  }

  /*
  * every few minutes check if there is something to sweep up
  * TODO: items thrown in the garbage can that miss will need to be clean up
   */
  static goBroom(nodesToClean, broom) {
    _Broom.node = broom || _Broom.node || document.querySelector('.floor__broom');

    const examineFloor = () => {
      _Broom.interval = setTimeout(function () {
        //timeout will automatically expire if not recreated YAY!
        const dustBunnies = Trash.#getDustBunnies(nodesToClean);
        if (!dustBunnies.length) {
          //flip
          _Broom.animationP.then(() => {
            const animation = anime.timeline({
              targets  : _Broom.node,
              direction: 'alternate',
              loop: 1
            }).add({
              rotateY : 180,
              duration: 500
            });
            _Broom.animationP = animation.finished;
            examineFloor();
          });
        } else {
          //1. look at the XY location of the nodesToClean

          _Broom.animationP.then(() => {
            Trash.forceBroom(_Broom.node, dustBunnies);
            examineFloor();
          });
        } // if

      }, 20000); //interval
    } // fn
    examineFloor();
  } //goBroom

  static
  #setHiddenBall(emoji, innerNode) {
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
        translateX: 0,
        translateY: 0,
        width     : '100%',
        height    : '100%'
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
        left: +xy.left,
        top : +(anime.get(_Can.node, 'top') + '').replace('px', '')
      });
    } else {

      Object.assign(_Can.xy, {
        left: +(anime.get(_Can.node, 'left') + '').replace('px', ''),
        top : +(anime.get(_Can.node, 'top') + '').replace('px', '')
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


  //pull = reverse;  push =normal
  #pullCan() {
    console.log('pullCan.  is it in use?', _Can.inUse);
    //make sure is ready for normal (i.e. pull) direction
    if (!_Can.animateCan.reversed) {
      _Can.animateCan.reverse();
    }

    _Can.pullCan = new Promise((resolve, reject) => {
      let P = function (a) {
        a.finished.then(() => {
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
          a.finished.then(() => {
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
      Promise.all([_Can.pushCan, next]).then(() => {
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

  static putInCan(nodes) {
    try {

      Trash.getCanNode().querySelector('.trashCan__bottom').append(nodes);
    } catch (e) {
      console.log('putinCan', e);
    }
  }

  /*
  * use the co-ordinates of A and B to determine if they overlap
  *
  * fudge --> provide negative numbers to have a better chance of fitting
  * { left : -100p}
  *
  * fudge --> positive number to make it harder
  * { left : 100}
  *
  * fudge --> ratio (positive or negative) for similar effect
  *
   */
  static isAwithinB(A, B, fudge, doCenterOnly = false, ignore = ['left', 'right', 'top', 'bottom']) {

    let isWithin = false;
    const diff = {};
    //thresholds
    const compare = {
      left   : 0,
      top    : 0,
      bottom : 0,
      right  : 0,
      centerX: 0,
      centerY: 0
    }
    if (typeof fudge === 'object') {
      //TODO: support ratios in fudge

      for (let f in fudge) {
        //make xy narrower to have a better chance of "fitting"
        compare[f] = 0 + fudge[f];
      }
    } else if (!fudge) {
      fudge = {};
    }

    // get XY for the A object / node
    const xyA = Trash.getXY(A);

    //update XY based upon what is in the fudge adjustments. defaults are 0 fudge
    Object.assign(compare, fudge);
    for (let c in compare) {
      xyA[c] += compare[c];
    }
    Object.assign(diff, Trash.calcDiffXY(B, xyA, [2000, 2000]));

    if (!doCenterOnly) {
      isWithin = true;
      ignore.forEach(side => {
        if (isWithin) {
          if (side === 'left' || side === 'top')
            isWithin = (diff.diff[side] >= 0)
          if (side === 'right' || side === 'bottom')
            isWithin = (diff.diff[side] <= 0)
        }
      })
      return isWithin;
    } else if (doCenterOnly && !isNaN(diff.diff.centerX) && !isNaN(diff.diff.centerY)) {
      isWithin = true;
      if (ignore.indexOf('centerX') >= 0 || ignore.indexOf('centerY') >= 0) {
        //ignore = ignore
      } else {
        //default for center behaviours
        ignore = ['centerX', 'centerY']
      }
      ignore.forEach(side => {
        if (isWithin) {
          if (side === 'centerX')
            //if the center X line differences are smaller than the width of the container then it's good
            isWithin = (Math.abs(diff.diff[side]) <= diff.start.width)
          if (side === 'centerY')
            //if the center Y line differences are smaller than the height of the container then it's good
            isWithin = (Math.abs(diff.diff[side]) <= diff.start.height)
        }
      })
      return isWithin;

    } else {
      isWithin = false;
    }

    return false;
  }

  static getXY(nodeXY) {
    if (nodeXY instanceof Element) {
      nodeXY = nodeXY.getBoundingClientRect();
    }
    try {
      return (({top, left, height, width, bottom, right}) => ({
        top   : top,
        left  : left,
        height: height,
        width : width,
        bottom: bottom,
        right : right
      }))(nodeXY);

    } catch (e) {
      console.log('getXY', e);
      return {
        top   : 0,
        bottom: 0,
        left  : 0,
        right : 0,
        width : 0,
        height: 0
      };
    }
  } //getXY

  static getSpecificXY(XY, choices = ['left', 'top', 'width', 'height']) {
    if (XY instanceof Element) {
      XY = Object.assign({}, Trash.getXY(XY));
    }
    if (choices && typeof choices === 'string') {
      choices = [choices];
    }

    const O = {};
    if (Array.isArray(choices)) {

      choices.forEach(choice => {
        O[choice] = XY[choice];
      });
      return O;
    } else {
      return XY;
    }
  } //getSpecificXY

  static getSpecificDiffXY(start, end, choices = []) {
    Trash.calcDiffXY(start, end, [2000, 2000]);
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
        const centerY = bottom - height / 2;
        const centerX = right - width / 2;
        const endCY = endB - endH / 2;
        const endCX = endR - endW / 2;
        //end
        Object.assign(end, {
          centerX: endCY,
          centerY: endCY
        });
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
        end  : end,
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

        const hiddenBall = Trash.#setHiddenBall(emoji, trashBall.firstElementChild);

        //remove the real ball is done in the animation
        anime.set(hiddenBall, {rotate: Math.random() * 90});

        //if ball is near the can then put it in the can. otherwise leave it on the ground for cleanup
        let putInCan;

        //if the can is in it's original spot then we're fine
        putInCan = Trash.isAwithinB(_Can.xy, Trash.getXY(Trash.getCanNode()), {
          //no adjustment
          left : 0,
          right: 0
        }, true, ['centerX', 'centerY']);

        if (putInCan) {
          _Can.node.querySelector('.trashCan__bottom').append(hiddenBall);
        } else {
          //lay it on the floor cuz Can is elsewhere
          const dust = document.createElement('div');
          dust.classList.add('floor__trash');
          document.getElementById('floor').append(dust);
          anime.set(dust, Object.assign(
            {},
            (({top, left}) => ({
              top : +top,//+ (Math.random()*50-25),
              left: +left + (Math.random() * 100 - 50)
            }))(Object.assign(
              {},
              _Can.xy,
              {
                translateY: 0,
                translateX: 0,
                rotateX   : 75,
                rotateZ   : Math.random() * 90
              }))
          ));

          hiddenBall.firstElementChild.classList.remove(
            ...[...hiddenBall.firstElementChild.classList].filter(cl => /drag/i.test(cl))
          )
          dust.append(hiddenBall.firstElementChild);
        }
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
    } else if (emoji instanceof HTMLElement) {
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
    let duration = (anime.random(1, 20000) + _.adjustment);
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
    console.log('moving ' + direction[0])
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