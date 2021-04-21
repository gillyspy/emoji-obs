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

const _ = {
  scale       : 1,
  opacity     : 1,
  began       : false,
  adjustment  : 2000,
  idlerotation: true
};
var RP; //singleton


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

  durationJS(t = this.#_.duration) {
    return (this.#_.doMins ? t * 60 : t) * 1000;
  }

  #getStep(height, txt) {
    let borderFudge = 2; //TODO:
    let el = document.createElement('div');
    //add class
    el.classList.add('flexClock__step');
    el.style.height = (height - borderFudge) + 'px';

    //add number
    let subEl = document.createElement('span');
    subEl.innerText = txt;

    el.append(subEl);
    return el;
    /*
        <div class="flexClock__step"><span style="color:white">40</span></div>
     */
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

    //re-register callbacks (so that they can fire again)
    this.#registerCallbacks(this.#_.callbacks);

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
    let t, h, m, duration, future;
    const now = new Date();
    if (timeRequest instanceof Date) {
      future = timeRequest;
      duration = (future - now) / 1000 / 60
    } else if (timeRequest) {
      [ m, h ] = timeRequest.match(/^(\d{2})(\d{2})/).reverse();
      [m, h] = [+m,+h];



      let future = new Date();
      future.setHours(h, m, 0, 0);
      duration = (future - now) / 1000 / 60;

      if(duration > 240){
        future = new Date();
        future.setHours( future.getHours()+5,0,0,0);
        duration = this.translateInput( future );
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
      complete  : function () {
        anime.remove(this.sliderNode);
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
      cb.isDone = false; //flag to track its use
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
      onComplete: function () {
      }
    });

    this.#scaleAnimation.forEach(a => {
      a.restart();
      a.pause();
      a.remove('*');
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
      let turnOff = this.triggerNode.classList.contains('pressed')

      if (turnOff) {
        this.#isRunning = false;
        this.triggerNode.classList.remove('pressed');
        document.querySelector('.' + this.#_.showClass)
          .classList.add(this.#_.hideClass)

        this.#scaleAnimation.forEach(a => {
          a.restart();
          a.pause();
          a.remove('*');
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
        anime({
          targets: '' //TODO:
        })

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
    //this.#animateFill().restart();
  }

  pause() {

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
        translateY: (e, i) => {
          if (i === 0) {
            h.push(+e.style.height.match(/[^p]*/)[0]) + 3;
            return 3;
          } else {
            return (i - 1) * (+e.style.height.match(/[^p]*/)[0] + 1) + (h[0]) + 2;
          }
        },
        duration  : anime.stagger(100)
      })
    );

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
        opacity : [.8,.8],
        duration: duration,
        easing  : 'linear'
      })
    );

    /*  this.#scaleAnimation.push(anime({
        targets          : '.flexClock__sub--B .flexClock__step',  //'.' + this.#_.drainClass,//'#domAttr .demo-content',
        opacity          : 1,
        //duration         : duration,
        //background-color : 'rgba(255,0,0,0,2)'
        delay            : anime.stagger(stagger), // steps * 5000
        // easing           : stepsTime,// 'linear',

      }));*/

    const anime2 = anime.timeline({loop: 1});
    this.#scaleAnimation.push(anime2);


    //cause the numbers to disappear by becoming to small
    document.querySelectorAll('.flexClock__sub--A .flexClock__step span')
      .forEach(node => {
          anime2.add({
            targets          : node,  //'.' + this.#_.drainClass,//'#domAttr .demo-content',
            scale            : .1,
            duration         : (duration / that.#_.steps) - 300,
            easing           : 'easeInBack'// 'linear',
          }).add({
            targets : node,
            scale : 5,
            opacity : 0,
            duration : 300,
            easing : 'easeInQuad'
          });
        }
      );


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
      if (cbOpts && !cbOpts.isDone) {
        //cb.firedOn !== Math.ceil(minsLeft) ) {
        try {
          //pass in TimerCountDown instance
          let cb = cbOpts.cb.bind(that);
          cb(Math.ceil(minsLeft));
          cbOpts.firedOn = Math.ceil(minsLeft);
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

      //slide it down the next bit via transform
      sliderNode.style.transform = `translateY(${curY}px)`;
      return keepGoing;
    });

    /*
    let slider = anime({

      targets   : '.flexClock__slider',
      translateY: 525,
      duration  : duration,
      easing    : 'linear',
      delay     : ((50 / 568 * duration)), // this doesn't need a delayFudge
      update    : function (a) {
        console.log(secondsPast++, a.progress, this.#timePassed());
      }.bind(this),
      loop      : 1,
      autoplay  : false
    }); */

    /* anime({
       targets: '.flexClock__sub--A .flexClock__step',
       update : function (a) {
         //update each block to countdown their value
       }
     }); */


  } //animateDrain

  #animateFill() {
    return;
    return anime({
      targets          : '.' + this.#_.fillClass, //'#domAttr .demo-content',
      height           : [573, 3],
      //background : 'rgba( 50,255,50,1)',
      opacity          : [.8, .2],
      duration         : this.#_.duration,
      //transformZ : 5000,
      easing           : steps(this.durationToMinutes()), //'linear',
      border           : 0,
      'margin-top'     : [3, 573],
      //left : 0,
      'justify-content': 'start'
    });
  } //animateFill

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
            let ev2 = document.createEvent('MouseEvents')
            ev2.initEvent('dblclick', true, true);
            document.getElementById('✌🏻').dispatchEvent(ev2);
            anime({
              targets : document.querySelector('#gallery .dragTemp'),
              top     : 240,
              left    : 700,
              opacity : [0, 1],
              duration: 2000,
              easing  : 'easeInSine'
            })
            anime({
              targets :  document.querySelector('#gallery .dragTemp button'),
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

  show() {

  }

} //TimerCountDown

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
  TimerCountDown: TimerCountDown
}

/*


 */