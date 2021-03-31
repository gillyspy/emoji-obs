var $ = require('jquery');
class Animation {
  constructor(el){
    this.$el = el;
    this.debug=true;
    this.pin = $('.pin');
    //el might not be jQuery object
  }

  removeAnimation(sticky){
    this.$el.stop().fadeIn(100)
      .show();
    this.pin.show();
    return this;
  }

  restartAnimation(){
    this.pin.hide();
    this.$el.show().stop()
      .fadeIn(1000)
      .stop()
      .css('opacity',1.0 )
      .fadeOut(5000,);
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