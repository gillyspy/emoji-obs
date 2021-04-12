import Log from './Log.js'

const log = new Log(('disabled' == 'on'));

class FollowMouse {
  constructor($, selector, outerSelector = document, event = 'mousemove') {
    this.$ = $;
    this.selector = selector;
    this.outerSelector = outerSelector;
    this.$el = this.$(selector);
    this.timeout;
    this.impatientMax = 40000;
    this.impatientCtDown = 5000;
    this.impatientAnimation;
    //should be a jquery object
  }

  startTracking() {
    let $el = this.$el;
    let iA = this.impatientAnimation;
    let _this = this;
    let $div = $el.closest('div');

    this.$(this.outerSelector).on('mousemove', function (ev) {
      _this.impatientCtDown = _this.impatientMax;
      if (_this.impatientAnimation) {
        _this.impatientAnimation.pause();
      }
      $div.css('transform', '');

      $el.removeClass('fakeMouse__button--flight');

      $el.css({
        left: ev.pageX - 20,
        top : ev.pageY
      });

    });
  } //startTracking

  //TOOD: turn this into a function instead
  impatientAnimation(){


  };

  initImpatientAction(anime, svgPathSelector, animateSelector) {
    let path = function (parm) {
      let P = anime.path(svgPathSelector);
      switch (parm) {
        case 'x' :
        case 'angle':
          return P(parm);
        case 'y':
          console.log(P(parm));
          return P(parm);

      }
    }

    let _this = this;
    let $el = this.$el;
    setInterval(function () {

      log.browser('ctdown', _this.impatientCtDown);
      if (_this.impatientCtDown <= 0) {
        $el.css({
          left: 0,
          top : 0
        });
        $el.addClass('fakeMouse__button--flight');
        _this.impatientAnimation.play();

      } else {
        _this.impatientCtDown -= 100;
      }
    }, 100);

    let old = {
      opacity: 1,
      scale  : 1
    }
    this.impatientAnimation = anime.timeline({loop: true})
      .add({
        targets   : animateSelector,
        translateX: path('x'),
        translateY: path('y'),
        scale     : function () {
          let range = [old.scale];
          old.scale = (Math.random() * 8 + 1.5);
          range.push(old.scale);
          return range;
        },
        rotate    : path('angle'),
        //rotateX : 90,
        easing    : 'linear',
        opacity   : function () {
          let range = [old.opacity];
          old.opacity = (Math.max(Math.random(), .5))
          range.push(old.opacity);
          return range;
        },
        duration  : (Math.random() * 20000 + 10000),
        //loop      : true
      }).add({
        targets   : animateSelector,
        translateX: path('x'),
        translateY: path('y'),
        scale     : [old.scale,1],
        rotate    : path('angle'),
        //rotateX : 90,
        easing    : 'linear',
        opacity   : [old.opacity,1],
        duration  : (Math.random() * 20000 + 10000),
        loop      : true
      });

    /*add({
      targets  : '#fakeMouse button',
      keyframes: [{
        'font-size': '40px'
      }, {
        'font-size': '10px'
      },
      ],
      //  duration : 2000,
      easing   : 'linear',
      loop : true
    });*/
  }//

  makeDraggable(adjustments = {
    left: 0,
    top : 0
  }) {
    let $el = this.$el;
    Object.assign({
      left: 0,
      top : 0
    }, adjustments);
    let isDragging = false;
    let $that = this.$(this.outerSelector);

    this.$(this.outerSelector).on('mousedown', function (ev) {
      if (ev.detail === 2) {
        $that.trigger('dblclick');
        return false;
      }
      log.browser('begin drag', ev)
      isDragging = true;


      if (adjustments.mousedown) {
        adjustments.mousedown()
      }
      // return false;
    });

    this.$(this.outerSelector).on('mousemove', function (ev) {
      if (isDragging) {
        log.browser(' draggin!')
        $el.css({
          left: ev.pageX - adjustments.left,// -($el.width()/2) - adjustments.left,
          top : ev.pageY - adjustments.top // - ($el.height()/2) - adjustments.top
        });
      }
    });

    this.$(this.outerSelector).on('mouseup', function (ev) {
      log.browser('stop drag')
      isDragging = false;
      //return false;
    });

    this.$(this.outerSelector).on('mouseout', function (ev) {
      isDragging = false;
      return false;
    });
    log.browser('draggable now!')
    // return this;
  }

}

export default FollowMouse