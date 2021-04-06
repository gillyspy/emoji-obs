class FollowMouse {
  constructor($,selector) {
    this.$ = $;
    this.selector = selector;
    this.$el;

    //should be a jquery object
  }
  startTracking() {
    let $el = this.$(this.selector);
    this.$(document).mousemove( function(e) {

     $el.find('button').css({
        left: e.pageX-20,
        top : e.pageY
      });
    });
  }
}

export default FollowMouse