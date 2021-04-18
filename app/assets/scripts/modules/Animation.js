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

  timeline(name, params, addDestroy = false) {
    //get a timeline with no params
    if (this.animationCache[name]) {
      return this;
    } else
      //new or updated timeline
    if (typeof params === 'object') {
      let c = this.animationCache;
      if (addDestroy) {
        let d = this.destroyTimeline.bind(this);
        let cb = params.complete;
        params.complete = function () {
          d(name);
          if (cb) {
            cb();
          }
        }
      }
      this.animationCache[name] = this.anime.timeline(params);
      return this;
    }
    return false;
  } //timeline

  destroyTimeline(name) {
    return delete this.animationCache[name];
  }

  addToTimeline(name, params, addDestroy = false) {
    let tl = this.timeline(name);
    if (tl) {
      if (addDestroy) {
        let d = this.destroyTimeline.bind(this);
        let cb = params.complete;
        params.complete = function () {
          d(name);
          if (cb) {
            cb();
          }
        }
      }
      tl.animationCache[name].add(params);
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
      this.animationCache[name].play();
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
      stepSize        : 5
    };
    this.#_ = Object.assign({}, this.#_, opts);
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
  }

  queueFunc(fn, tick = 100, timeout) {
    let startTime = function () {
        return this.#timeStarted
      }.bind(this),
      canPoll = true,
      now,
      sPassed;
    timeout = this.durationJS.bind(this);

    (function p() {
      now = new Date().getTime();
      sPassed = (now - startTime());
      //  canPoll = sPassed <= timeout();
      if (fn(sPassed) && canPoll) { // ensures the function executes
        setTimeout(p, tick);
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


  #injectStep(step) {
    const nodes = document.getElementsByClassName(this.#_.subClass);
    [...nodes].forEach((el, i) => {
      el.append(step[i]);
    });
  }

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
    this.sliderNode.style.transform = `translateY(0px)`;

    //reset any anime-based animations
    anime.remove(this.targetNode.childNodes);

    //remove old steps
    [...this.targetNode.querySelectorAll('div')].forEach((e) => {
      e.innerHTML = '';
    });

    this.#_.sunsetTriggered = false;

    //break it up into steps. e.g. 60 minutes into 12 5 minute steps
    this.#_.delayFudge = (dur % this.#_.stepSize);
    //this.#_.duration = dur - this.#_.delayFudge;
    let adjustedDuration = dur - this.#_.delayFudge;

    stepsNeeded = Math.floor((this.#_.duration) / this.#_.stepSize);

    this.#_.timeOnEach = (this.durationJS() / stepsNeeded);
    stepHeight = this.targetNode.getBoundingClientRect().height / stepsNeeded

    //populate those steps
    for (let i = 0; i < stepsNeeded; i) {
      stepText = adjustedDuration - (++i * this.#_.stepSize); //

      step = [
        this.#getStep(stepHeight, stepText),
        this.#getStep(stepHeight, stepText)
      ];
      steps.push(step);
      this.#injectStep(step);
    }
  }

  static durationToTopOfHour() {
    const {now, next} = {
      now : (new Date()),
      next: (new Date())
    }
    let hourBump = 0
    //if within 15minutes of next hour then set for the top of the following hour
    if (now.getMinutes() > 45) {
      hourBump = 1;
    }
    next.setHours(now.getHours() + hourBump, 59, 59, 0);
    return (next.getTime() - now.getTime()) / 1000 / 60; //TODO
  }

  translateInput(i) {
    /*parse text input such as 1430h into a time */
    let t, h, m, nothing, duration;
    if (i) {
      [nothing, h, m] = i.match(/^(\d{2})(\d*)[^\d]*/);
      let now = new Date();
      let nextHour = new Date();
      nextHour.setHours(h, m, 0, 0);
      duration = (nextHour.getTime() - now.getTime()) / 1000 / 60;
    } else {
      duration = TimerCountDown.durationToTopOfHour();
    }

    switch (true) {
      case duration <= 2:
        // display seconds with larger steps
        this.#_.stepSize = 10;
        this.#_.doMins = false;
        duration *= 60;
        break;
      case duration <= 5:
      case duration <= 10:
        this.#_.stepSize = 1;
        break;
      case duration <= 25:
        this.#_.stepSize = 2;
        break;
    }
    this.#_.duration = duration;
    return duration;
  }

  init() {
    this.sliderNode = document.querySelector('.' + this.#_.sliderClass);

    //add click handler to the triggerNode that will initiate
    this.triggerNode.addEventListener('click', function () {
      let turnOff = this.triggerNode.classList.contains('pressed')

      if (turnOff) {
        this.triggerNode.classList.remove('pressed');
        document.querySelector('.' + this.#_.showClass)
          .classList.add(this.#_.hideClass)
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
          targets: ''
        })

        this.#timeStarted = new Date().getTime();
        this.start();
        this.#onCB();
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

  #timePassed() {
    let now = (new Date()).getTime();
    let dif = now - this.#timeStarted;
    return Math.abs(dif / 1000);
  }

  #animateDrain() {
    let duration = this.durationJS();
    let delayFudge = this.durationJS(this.#_.delayFudge);
    let secondsPast = 0;
    let stagger = this.#_.timeOnEach * .5;
    let stepsTime = 'steps(' + (this.#_.duration * .5) + ')';
    let sliderNode = this.sliderNode;
    let valueNode = this.valueNode;
    let updateTimeLeft = function (t) {
      this.#_.minutesRemaining = t;
    }.bind(this);
    let getMinsRemaining = function () {
      return this.#_.minsRemaining;
    }.bind(this);
    let that = this;

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
      let minsLeft = (duration - milliPassed) / 60000;
      updateTimeLeft(minsLeft);

      try {
        valueNode.value = (minsLeft + '').match(/^\d+([.]\d)?/)[0];
      } catch (e) {
      }

      if (milliPassed < milliDelay) {
        keepGoing = true;
      } else if (ratioTimePassed >= 0 && ratioTimePassed <= 1) {
        curY = ratioTimePassed * pxDistance;
        keepGoing = true;
      } else {
        curY = pxDistance;
        keepGoing = false;
      }

      if(!that.#_.sunsetTriggered && minsLeft < 5 ){
        that.#_.sunsetTriggered = true;
        anime({ targets : '#chromaKey',
          'background-color' : 'rgba(0,0,0,1)',
          duration :5*60000
        });
      }

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

    anime.timeline({
      delay: delayFudge
    }).add({
      targets          : '.flexClock__sub--B .flexClock__step',  //'.' + this.#_.drainClass,//'#domAttr .demo-content',
      opacity          : [1, 0],
      duration         : duration,
      delay            : anime.stagger(stagger), // steps * 5000
      easing           : stepsTime,// 'linear',
      'justify-content': 'start'
    });

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
    if (!RP) {
      RP = this;
      this.initAnimation();
    } else {
      this.animation = RP.animation;
    }


  }

  adjustRotation(doRotate) {
    _.idlerotation = !!idlerotation;
  }

  adjustSpeed(adjustment) {
    _.adjustment = Math.max(
      Math.min(adjustment, 2000),
      300000
    );
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
    if (RP.animation) {
    //  delete RP.animation;
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
      duration  : (Math.random() * 20000 + _.adjustment),
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