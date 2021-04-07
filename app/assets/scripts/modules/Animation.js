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
    if(pin){
      this.pin = pin;
      this.pin.addClass(this.bothClass);
    }
    this.$ = this.$el.constructor;
    this.both = this.$el.closest('div');
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
    anime.timeline({loop: 1})
      .add({
        targets   : '.' + this.randomClass,
        scale     : [4, 1],
        opacity   : [0, 1],
        translateZ: 0,
        easing    : "easeOutExpo",
        duration  : 950,
        delay     : (el, i) => 70 * i
      }); /* from: https://tobiasahlin.com/moving-letters/#2 */
    return this;
  };
};

export default Animation

/*


 */