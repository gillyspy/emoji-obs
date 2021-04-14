import Log from './Log.js'

//onst log = new Log(('disabled' == 'on'));
const log = new Log(('enabled' === 'enabled'));
var $;
var FM;
const m = {
  createContainer: function (id) {
    let el = document.createElement('div');
    el.id = id || 'container' + Math.floor(Math.random() * 10000);
    return el;
  },
  makeFollow() {
    /* when the mouse moves do the following:
    * - restart the idle timeout to beginning
    *
    * - whenActiveCB
    *
     */
    _.context.addEventListener('mousemove', (ev) => {
      let wasIdle = _.isIdle;
      _.isIdle = false;
      _.countDown = this.idleMax;
      //if transitioning to non-idle do the callback
      if (wasIdle && !_.isIdle) {
        //remove any artifacts of being idle
        _.container.classList.remove(_.options.idleClass);

        //make it active
        _.container.classList.add(_.options.activeClass);


      }
      m.whenActiveCB(ev);
      //keep the moust updated
      _.mouse = ev;
    });

    setInterval(function () {
        let wasIdle = _.isIdle;
        //when the current countdown had already run out earlier
        if (_.countDown <= 0 && _.isIdle) {
          //do nothing but keep checking
          return;
        } else //when the countdown has just run out
        if (_.countDown <= 0 && !_.isIdle) {
          //stop counting
          _.isIdle = true;

          //do something
          if (!wasIdle && _.isIdle) {
            _.container.classList.remove(_.options.activeClass);
            _.container.classList.add(_.options.idleClass);
            m.whenIdleCB(_.node);
          }

        } else //not Idle yet
        {
          //keep counting down
          _.countDown -= _.tick;
        }
        //  console.log('tick')
      }, //tick the clock
      _.tick); //interval
  } //init()
};

const _ = {
  tick          : 100,
  followDefaults: {
    context     : document.body,
    event       : 'mousemove',
    idleMax     : 90000,
    idleClass   : 'followMouse--idle',
    activeClass : 'followMouse--active',
    neutralClass: 'followMouse',
    idleTodo    : function () {
      return;
    }
  },
  container     : m.createContainer()
};

/*
class FollowMouseX{
  constructor(node){
    new FollowMouse2(node);
  }
}
*/

class MouseActions {
  constructor(node, opts, whenIdleCB = function () {
  }, whenActiveCB = function () {
  }) {
    FM = this;
    _.node = node;


    m.whenIdleCB = whenIdleCB && whenIdleCB.bind(this);
    m.whenActiveCB = whenActiveCB && whenActiveCB.bind(this);
    this.followMouse(opts);
  }

  //make the current follower unfollow
  abandonMouse() {
    //remove classes
    _.container.classList.remove(_.options.neutralClass);
    _.container.classList.remove(_.options.activeClass);
    _.container.classList.remove(_.options.idleClass);
    //empty the container
    _.container.textContent = '';
  }

  follower() {
    return _.node;
  }

  makeFollow() {
    //make a new follower
    m.makeFollow.apply(this);
  }

  container() {
    return _.container;
  }

  /*
  * a node that is following the mouse is _NOT actually_ following the mouse!
  * what happens is that a copy of its contents gets put into a container
  * and that container is following
  *
  * The container is part of the options.
  *
  * The container operates within a context -- (opts.context)
  * which is probably the entire document but might only be a portion
   */
  followMouse(opts) {
    //new variables merged with defaults as fallbacks
    _.options = Object.assign({}, _.followDefaults, opts);

    this.idleMax = _.options.idleMax;
    this.idleClass = _.options.idleClass;
    this.activeClass = _.options.activeClass;
    this.neutralClass = _.options.neutralClass;

    _.countDown = this.idleMax;
    _.context = _.options.context;

    //if there is already follower then make it abandon
    this.abandonMouse()

    //set contents of the container based on source node
    _.container.textContent = _.node.textContent;
    _.container.classList.add(this.neutralClass);

    //insert it into the dom (in context)
    _.context.prepend(_.container);

  } //followMouse()

  makeDraggable(
    adjustments = {
      left: 0,
      top : 0
    }) {
    let target = _.node;
    Object.assign({
      left: 0,
      top : 0
    }, adjustments);
    let isDragging = false;

    target.addEventListener('mousedown', function (ev) {
      // this.$(this.outerSelector).on('mousedown', function (ev) {
      if (ev.detail === 2) {
     //   target.dblclick();
        let ev2 = document.createEvent('MouseEvents')
        ev2.initEvent('dblclick', true, true);
        target.dispatchEvent(ev2);
        return false;
      }
      log.browser('begin drag', ev)
      isDragging = true;

      if (adjustments.mousedown) {
        adjustments.mousedown()
      }
      // return false;
    });

    target.addEventListener('mousemove', function (ev) {
      if (isDragging) {
        log.browser(' draggin!')
        target.style.left = (ev.pageX - adjustments.left) + 'px';
        target.style.top = (ev.pageY - adjustments.top) + 'px';
      }
    });

    target.addEventListener('mouseup', function (ev) {
      log.browser('stop drag')
      isDragging = false;
      //return false;
    });

    target.addEventListener('mouseout', function (ev) {
      isDragging = false;
      return false;
    });
    log.browser('draggable now!')
    // return this;
  } //makeDraggable

} //class MouseActions

class FollowMouse {
  constructor($el, outerSelector = document, event = 'mousemove') {
    this.$ = $el.constructor;
    this.selector = $el;
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
      if ($el.hasClass('fakeMouse__button--flight')) {
        $el.removeClass('fakeMouse__button--flight');
        _this.genImpatientAnimation('pause');
        _this.config.impatientAnimation.running = false;
        _this.config.impatientAnimation.style = $div.attr('style');
        //   $div.attr('style', '');
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
        target : target,
        style  : ''
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
    if (action === 'stop') {
      this.impatientAnimation.stop();
    } else //play
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
            start.opacity = (Math.max(Math.random(), .5));
            range.push(start.opacity);
            return range;
          },
          duration  : (Math.random() * 20000 + 2000),
          autoplay  : false,
          begin     : function () {
            _this.config.impatientAnimation.running = true;
          },
          complete  : function () {
            //restart this animation with new random values
            _this.genImpatientAnimation('restart');
          }
          //loop      : true
        });
      this.impatientAnimation.play();
      this.config.impatientAnimation.running = true;
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
    let $div = this.$(animateSelector);
    _this.genImpatientAnimation('restart',svgPathSelector, animateSelector);

    /*
    * begin a clock...
    * update the countdown with the clock
    *
    * if the countdown expires then the mouse animation is launched
     */
    setInterval(function () {
        log.browser('ctdown', _this.impatientCtDown);

        //if the countdown expires AND ONLY If it has just expired
        if (_this.impatientCtDown <= 0 && _this.impatientCtDown > -5000) {
          //setting this to -10000 will make sure it fires once per idle
          _this.impatientCtDown = -10000;

          //remove the css offsets from the mouse
          $el.css({
            left: 0,
            top : 0
          });

          //resume idle animation
          if (!$el.hasClass('fakeMouse__button--flight')) {
            //     $div.attr('style', _this.config.impatientAnimation.style);
            $el.addClass('fakeMouse__button--flight');
            _this.genImpatientAnimation('restart');
          }
        } else if (_this.impatientCtDown > 0) {
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


export default MouseActions