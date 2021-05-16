import Log from './Log.js';
import anime from "animejs";
//anime.suspendWhenDocumentHidden = false; // default true
const log = new Log(('disabled' == 'on'));
//const log = new Log(('enabled' === 'enabled'));
var FM;
const m = {
  createContainer: function (id) {
    let el = document.createElement('div');
    el.id = id || 'container' + Math.floor(Math.random() * 10000);
    let subEl = document.createElement('span');
    el.append(subEl);
    return el;
  },
  makeFollow() {
    /* when the mouse moves do the following:
    * - restart the idle timeout to beginning
    *
    * - whenActiveCB
    *
     */

    _.context.addEventListener('mousemove', _.mousemoveCB.bind(this));

    setInterval(
      _.intervalCB.bind(this), //tick the clock
      _.tick); //interval
  } //init()
};

const _ = {
  tick          : 100,
  followDefaults: {
    context     : document.body,
    event       : 'mousemove',
    idleMax     : 10000, //5minutes is default
    idleClass   : 'followMouse--idle',
    activeClass : 'followMouse--active',
    neutralClass: 'followMouse',
    startIdle   : false,
    idleTodo    : function () {}
  },
  container     : m.createContainer(),
  mousemoveCB: function (ev) {
    let wasIdle = _.isIdle;
    _.isIdle = false;
    _.countDown = FM.idleMax;


    //if transitioning to non-idle do the callback
    if (wasIdle && !_.isIdle) {
      //remove any artifacts of being idle
      _.container.classList.remove(_.options.idleClass);

      //make it active
      _.container.classList.add(_.options.activeClass);


    }
    this.whenActiveCB(ev);
    //keep the moust updated
    _.mouse = ev;
  },
  intervalCB : function () {
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
        this.whenIdleCB(_.node);
      }

    } else //not Idle yet
    {
      //keep counting down
      _.countDown -= _.tick;
    }
    //  console.log('tick')
  }

};

/*
class FollowMouseX{
  constructor(node){
    new FollowMouse2(node);
  }
}
*/

class MouseActions {
  constructor(node, opts, whenIdleCB, whenActiveCB) {
    FM = this;
    _.node = node;

    this.whenIdle(whenIdleCB);
    this.whenActive(whenActiveCB);
    this.followMouse(opts);
  }

//allows changing the idle callback
  whenIdle(cb) {
    if (typeof cb === 'undefined') {
      this.whenIdleCB = function () {
      }.bind(this);
    } else {
      this.whenIdleCB = cb.bind(this);
    }
  }

  //allows changing the idle callback
  whenActive(cb) {
    if (typeof cb === 'undefined') {
      this.whenActiveCB = function () {

      }.bind(this);
    } else {
      this.whenActiveCB = cb.bind(this);
    }
  }

  setContent(node) {

    if (node instanceof HTMLElement) {
      _.node = node;
    } else if (typeof node === 'string') {
      _.node = {
        textContent: node,
        type       : 'unknown'
      };
    }
    let c = _.container.firstElementChild || _.container;
    c.textContent = _.node.textContent;
    return true;
  }

  //make the current follower unfollow
  abandonMouse() {
    //remove classes
    _.container.classList.remove(_.options.neutralClass);
    _.container.classList.remove(_.options.activeClass);
    _.container.classList.remove(_.options.idleClass);
    //empty the container
    _.container.firstElementChild.textContent = '';
  }

  follower() {
    return _.node;
  }

  forceIdle() {
    _.countDown = 0;
    this.whenIdleCB(_.node);
  }

  makeFollow() {
    //make a new follower
    m.makeFollow.apply(this);
    if(  _.options.startIdle ) {
      this.forceIdle();
    }
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
    this.setContent(_.node);

    //neutral to start
    _.container.classList.add(this.neutralClass);

    //insert it into the dom (in context)
    _.context.prepend(_.container);

  } //followMouse()

  static fadeIt(el){


  } //fadeIt


  static startFade(el){


  }

  static stopFade(el){


  }

  static linger(el) {
    const {left, top} = el.style;
    let firstTimeDone=false;
    const _linger = function (el, originalX, originalY) {
      //const {x,y} = el.getBoundingClientRect();
      const {left, top} = el.style
      const [x, y] = [left, top];
      const xAdjust = x > originalX ? -1 : 1;
      const yAdjust = y > originalY ? -1 : 1;
      const newX = anime.random(0, 10) * xAdjust;
      const newY = anime.random(0, 30) * yAdjust;

      if(!firstTimeDone){
        anime({
          targets : el,
          //scale : 5,
          duration : 1000
        }).remove()  ;
        firstTimeDone = true;
      }

      //cannot do opacity because of overlapping opacity needs of the fade
      anime({
        targets   : el,
        translateX: newX,
        translateY: newY,
        opacity : ()=>{
          if( el.classList.contains('history--sticky')){
            anime.random(.8,1)
          }
      },
        easing    : 'easeInOutSine', //easeInOutQuad
        duration  : anime.random(20000, 30000),
        delay     : anime.random(0, 200),
        complete  : function () {
          anime.remove(el);
          _linger(el);
        }
      });
    }
    _linger(el, left, top);
  }//linger

} //class MouseActions

MouseActions.isDraggable = function(node){
  return node.classList.contains('isDraggable');
}

MouseActions.makeDraggable =
  function (node, opts = {}, useButton = true) {
    if(node.classList.contains('isDraggable')){
      //already draggable..quit early
      return;
    }
    const target = node;

    let isDragging = false;
    const startXY = {};

    target.classList.add('isDraggable');

    target.addEventListener('mousedown', function (ev) {
      console.log('dragging',ev.target);
      if (ev.detail === 2) {
        //   target.dblclick();
        let ev2 = document.createEvent('MouseEvents')
        ev2.initEvent('dblclick', true, true);
        target.dispatchEvent(ev2);
        return false;
      }

      //initialize the position of element w.r.t the mouse
      let {width, height, top, left} =
        useButton
          ? node.querySelector('button').getBoundingClientRect()
          : node.getBoundingClientRect();

      opts = Object.assign({
          left: 0,
          top : 0
        },
        opts,
        {
          left: width / 2,
          top : height / 2
        });

      isDragging = true;

      startXY.X = ev.pageX;
      startXY.Y = ev.pageY;
      startXY.tX = anime.get(target, 'left');
      startXY.tY = anime.get(target, 'top');
      startXY.S = anime.get(target, 'scale');
      startXY.tX = startXY.tX ? +startXY.tX.replace('px', '') : 0
      startXY.tY = startXY.tY ? +startXY.tY.replace('px', '') : 0

      log.browser('startXY',startXY);
      //perform client callback
      opts.mousedownCB && opts.mousedownCB.apply(this,[ev,node]);

      // return false;
    });

    target.addEventListener('mousemove', function (ev) {
      if (isDragging) {
        //in case ev was fired through a handler
        if( !startXY.X){
          startXY.X = ev.pageX;
        }
        if( !startXY.Y){
          startXY.Y = ev.pageY;
        }

        target.style.left = (startXY.tX + (ev.pageX - startXY.X))+'px';
        target.style.top =( startXY.tY + (ev.pageY - startXY.Y))+'px';
        log.browser(target instanceof Element);
        log.browser(' draggin!', startXY, target, ev.target, opts, ev.pageX, ev.pageY)
        log.browser('left', (startXY.tX + (ev.pageX - startXY.X))+'px');
        log.browser('top', ( startXY.tY + (ev.pageY - startXY.Y))+'px');

        opts.mousemoveCB && opts.mousemoveCB.apply(this,[ev,node]);
      }
    });

    target.addEventListener('mouseup', function (ev) {
      log.browser('stop drag')
      isDragging = false;
      opts.mouseupCB && opts.mouseupCB.apply(this,[ev,node] );

      //return false;
    });

    target.addEventListener('mouseout', function (ev) {
      isDragging = false;
      return false;
    });
    log.browser('draggable now!')
    // return this;

  } //makeDraggable

class FollowMouse {
  constructor($el, outerSelector = document, event = 'mousemove') {
    this.$ = $el.constructor;
    this.selector = $el;
    this.outerSelector = outerSelector;
    this.$el = this.$(selector);
    this.timeout;
    this.impatientMax = 10000; //5 minutes
    this.impatientAnimation;
    this.config = {};
    this.anime;
    //should be a jquery object
  }

  startTracking() {
    let $el = this.$el;
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
      this.impatientAnimation.remove('*');
      //this.impatientAnimation.stop();
    } else //play
    if (action === 'play') {
      this.impatientAnimation.play();
    } else  //pause
    if (action === 'pause') {
      this.impatientAnimation.pause();
    } else //else
    if (action === 'restart') {
//      delete this.impatientAnimation;
      _this.anime.remove(start.target);

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
    }
    return this.impatientAnimation;
  };


}


export default MouseActions