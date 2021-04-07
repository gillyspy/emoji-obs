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

  makeDraggable() {
    let $el = this.$el;

    let isDragging = false;
    this.$(this.outerSelector).on('mousedown', function (ev) {
      isDragging = true;
      return false;
    });
    this.$(this.outerSelector).on('mousemove', function (ev) {
      if (isDragging) {
        $el.css({
          left: ev.pageX -$el.width()/2,
          top : ev.pageY - $el.height()/2
        });
      }
    });

    this.$(this.outerSelector).on('mouseup', function (ev) {
      isDragging = false;
      return false;
    });

    this.$(this.outerSelector).on('mouseout', function (ev) {
      isDragging = false;
      return false;
    });
  }

}

export default FollowMouse