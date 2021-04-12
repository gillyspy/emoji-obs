import Log from './Log.js'

const log = new Log(('disabled' == 'on'));
//const log = new Log(('enabled' === 'enabled'));

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
     ///   _this.impatientAnimation.pause();
      }

      //if necessary stop the flight animation
      if(_this.impatientAnimation && $el.hasClass('fakeMouse__button--flight')) {
        _this.genImpatientAnimation('pause');
        $el.removeClass('fakeMouse__button--flight');
        //unrotate the "ship"
        $div.css('transform', '');
      }
      //force the mouse to follow
      $el.css({
        left: ev.pageX - 20,
        top : ev.pageY
      });

    });
  } //startTracking

  //TOOD: turn this into a function instead
  genImpatientAnimation(action = 'restart',svg,target) {
    let _this = this;
    let start = this.config.impatientAnimation || false;
    if (!start) {
      //generate defaults
      this.config.impatientAnimation = {
        scale  : 1,
        opacity: 1,
        svg    : svg,
        target : target
      }
      start = this.config.impatientAnimation;
    }
    if (svg)
      start.svg = svg;
    if (target)
      start.target = target;
    let path = _this.anime.path(start.svg);

    log.browser(start, target, svg, path('y'));
    // deal with actions
    if (action === 'play') {
      this.impatientAnimation.play();
    } else  //pause
    if (action === 'pause') {
        this.impatientAnimation.pause();
    } else //else
    if (action === 'restart') {
//      delete this.impatientAnimation;

      this.impatientAnimation =
        _this.anime({
          targets   : start.target,
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
          duration  : (Math.random() * 20000 + 2000),
          complete  : function () {
            //restart this animation with new random values
            _this.genImpatientAnimation();
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
    _this.genImpatientAnimation('restart',svgPathSelector, animateSelector);

    /*
    * begin a clock...
    * update the countdown with the clock
    *
    *
    * if the countdown expires then the mouse animation is launched
     */
    setInterval(function () {
      log.browser('ctdown', _this.impatientCtDown);

      //if the countdown expires
      if (_this.impatientCtDown <= 0) {
        $el.css({
          left: 0,
          top : 0
        });
        $el.addClass('fakeMouse__button--flight');
        //resume
        _this.genImpatientAnimation('play');
      } else {
        _this.impatientCtDown -= 100;
      }
    }, //tick the clock
       100
    );
  }//initImpatientAction

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