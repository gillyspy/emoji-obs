class FollowMouse {
  constructor($, selector, outerSelector = document, event = 'mousemove') {
    this.$ = $;
    this.selector = selector;
    this.outerSelector = outerSelector;
    this.$el = this.$(selector);
    this.timeout;
    //should be a jquery object
  }

  startTracking() {
    let $el = this.$el;
    this.$(this.outerSelector).on('mousemove', function (ev) {

      $el.css({
        left: ev.pageX - 20,
        top : ev.pageY
      });
    });
  } //startTracking

  makeDraggable(adjustments={left: 0, top : 0}) {
    let $el = this.$el;
    Object.assign( { left : 0, top : 0}, adjustments);
    let isDragging = false;
    this.$(this.outerSelector).on('mousedown', function (ev) {
      console.log('begin drag')
      isDragging = true;
      return false;
    });
    this.$(this.outerSelector).on('mousemove', function (ev) {
      if (isDragging) {
        console.log(' draggin!')
        $el.css({
          left: ev.pageX -($el.width()/2) - adjustments.left,
          top : ev.pageY - ($el.height()/2) - adjustments.top
        });
      }
    });

    this.$(this.outerSelector).on('mouseup', function (ev) {
      console.log('stop drag')
      isDragging = false;
      return false;
    });

    this.$(this.outerSelector).on('mouseout', function (ev) {
      isDragging = false;
      return false;
    });
    console.log('draggable now!')
    return this;
  }

}

export default FollowMouse