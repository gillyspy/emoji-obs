const $ = require('jquery');
import anime from 'animejs';

class Animation {
  constructor(el){
    this.$el;
    this.debug=true;
    this.pin;
    this.maxFade = 40000;
    this.target = 'aniLetter';
    this.wrapper = 'wrapper'
    //el might not be jQuery object
  }
  init(el){
    this.$el = $(el).addClass(this.target);
    this.pin = $('#pin');
  }
  removeAnimation(sticky){
    this.pin.show();
    this.$el.stop().fadeIn(100)
      .show();

    return this;
  }
  /*
  add */

  restartAnimation(){
    this.pin.hide();
    this.$el.show().stop()
      .fadeIn(1000)
      .stop()
      .css('opacity',1.0 )
      .fadeOut(this.maxFade,);

    anime.timeline({loop: 1})
      .add({
        targets   : '.' + this.wrapper + ' .' + this.target,
        scale     : [4, 1],
        opacity   : [0, 1],
        translateZ: 0,
        easing    : "easeOutExpo",
        duration  : 950,
        delay     : (el, i) => 70 * i
      }).add({
      targets : '.' + this.target,
      opacity : 0,
      // duration: this.maxFade,
      easing  : "easeOutExpo",
      delay   : this.maxFade
    });

    return this;
  }

  addAnimation(){
    if(this.debug){
      console.log('addAnimation');
    }
    return this.restartAnimation();
  };
};

export default Animation

/*


 */