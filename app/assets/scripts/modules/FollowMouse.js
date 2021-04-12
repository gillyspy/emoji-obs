import Log from './Log.js'

//const log = new Log(('disabled' == 'on'));
const log = new Log(('enabled' === 'enabled'));

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
    this.config = {};
    this.anime;
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
  genImpatientAnimation(svg,target,action = 'restart') {
    let _this = this;
    let path = function (parm) {
      let P = _this.anime.path(svg);
      switch (parm) {
        case 'x' :
        case 'angle':
          return P(parm);
        case 'y':
          console.log(P(parm));
          return P(parm);
      }
    }
    if (!this.config.impatientAnimation) {
      //generate defaults
      this.config.impatientAnimation = {
        scale  : 1,
        opacity: 1
      }
    }
    let start = this.config.impatientAnimation;

    // deal with actions
    if (action === 'play') {
      this.impatientAnimation.play();
    } else //else
    if (action === 'restart') {
//      delete this.impatientAnimation;

      this.impatientAnimation =
        _this.anime({
            targets   : target,
            translateX: path('x'),
            translateY: path('y'),
            scale     : function () {
              let range = [start.scale];
              start.scale = (Math.random() * 8 + 1.5);
              range.push(start.scale);
              return range;
            },
            rotate    : path('angle'),
            //rotateX : 90,
            easing    : 'linear',
            opacity   : function () {
              let range = [start.opacity];
              start.opacity = (Math.max(Math.random(), .5))
              range.push(start.opacity);
              return range;
            },
            duration  : (Math.random() * 20000 + 10000),
            complete  : function () {
              //restart this animation with new random values
              _this.genImpatientAnimation(svg,target);
            }
            //loop      : true
          });
      /*.add({
          targets   : animateSelector,
          translateX: path('x'),
          translateY: path('y'),
          scale     : [old.scale, 1],
          rotate    : path('angle'),
          //rotateX : 90,
          easing    : 'linear',
          opacity   : [old.opacity, 1],
          duration  : (Math.random() * 20000 + 10000),
          loop      : true
        });*/
    }

    return this.impatientAnimation;
  };

  initImpatientAction(anime, svgPathSelector, animateSelector) {
    this.anime = anime;

    let _this = this;
    let $el = this.$el;
    _this.genImpatientAnimation(svgPathSelector, animateSelector,'restart');
    setInterval(function () {

      log.browser('ctdown', _this.impatientCtDown);
      if (_this.impatientCtDown <= 0) {
        $el.css({
          left: 0,
          top : 0
        });
        $el.addClass('fakeMouse__button--flight');


      } else {
        _this.impatientCtDown -= 100;
      }
    }, 100);

    let old = {
      opacity: 1,
      scale  : 1
    }


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