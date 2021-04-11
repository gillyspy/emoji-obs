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

  moveTarget(direction, pixels = 10) {
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
    let $ = this.$el.constructor;
    /* loop through both cuz they have different old and new values */
    this.$el.each(function () {
      let $this = $(this);
      $this.css(
        direction[0],
        $this.css( direction[0]).match(/^[-]?\d*/)[0]++ + (pixels * direction[1]) //calculate from old
      );
    });
    return;
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
export default Animation

/*


 */