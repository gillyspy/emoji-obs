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
  scale     : 1,
  opacity   : 1,
  began     : false,
  adjustment: 2000,
  doRotate  : true
};
var RP; //singleton

class RocketPath {
  constructor(target, pathNode,opts) {
    this.path = anime.path(pathNode);
    this.target = target;
    if(opts) {
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
    _.doRotate = !!doRotate;
  }

  adjustSpeed(adjustment) {
    _.adjustment = Math.max(
      Math.min(adjustment, 2000),
      300000
    );
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
        return _.doRotate ? RP.path('angle') : 0;
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
  Animation : Animation,
  RocketPath: RocketPath
}

/*


 */