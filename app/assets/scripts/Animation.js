const $ = require('jquery');
class Animation {
  constructor(){
    this.$el;
    this.debug=true;
    this.pin;
    this.maxFade = 40000;
    //el might not be jQuery object
  }
  init(el){
    this.$el = $(el);
    this.pin = $('#pin');
  }
  removeAnimation(sticky){
    this.pin.show();
    this.$el.stop().fadeIn(100)
      .show();

    return this;
  }

  restartAnimation(){
    this.pin.hide();
    this.$el.show().stop()
      .fadeIn(1000)
      .stop()
      .css('opacity',1.0 )
      .fadeOut(this.maxFade,);
    return this;
  }

  addAnimation(){
    if(this.debug){
      console.log('addAnimation');
    }
    return this.restartAnimation();
  }
}

export default Animation