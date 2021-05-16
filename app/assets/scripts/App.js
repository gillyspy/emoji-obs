import '../styles/styles.css'
import anime from "animejs";
//anime.suspendWhenDocumentHidden = false; // default true
const J$ = require("jquery").noConflict();
import Favorites from "./modules/Favorites";
import A from './modules/Animation';
import P from './helpers/promiseFactory.js';
import PP from './modules/PPromise.js'
import pickerHelper from './helpers/picker.js';
import _u from './helpers/_utils.js';

import Init from './modules/Init.js';

import Log from './modules/Log.js';
import Drawing from './modules/Drawing.js';
import MouseActions from './modules/FollowMouse.js';

require("./helpers/ArrayUpdates.js");
const Animation = A.Animation;
const IdlePath = A.RocketPath;
const TrashCan = A.TrashCan;
const MeetingCountDown = A.TimerCountDown;
const log = new Log(false /* do not show */);
var myMouseActions;

const myFavs = new Favorites();

console.log()
/*
http://10.0.0.10:3000/?defEmoji=%E2%98%95&defPoint=%E2%9C%8C%F0%9F%8F%BB&rocketSpeed=20000&idleTimeout=300000&rotation=false
 */
try {
  J$(document).ready(function ($) {

    const Config = {};
    const App = {};
    App.Fn = {};
    App.Animations = {};
    App.Promises = {};

    const Nodes = {
      spiderTrigger: document.querySelector('.web__trigger')
    };
    try {

      Object.assign(Config, Init, (function (U) {
        let a = Init.urlParams;
        let o = {};
        U.searchParams.forEach((v, k) => o[a[a.indexOf(k)]] = v);
        return o;
      })(new URL(window.location.href)));
    } catch (e) {
      Object.assign(Config, Init);
    }
    //convert values
    Object.assign(Config, {
      linger           : (Config.linger === 'true'),
      idlerotation     : (Config.idlerotation === 'true'),
      idlespeedoffset  : +(Config.idlespeedoffset),
      trashoffset      : +(Config.trashoffset),
      rocketspeedoffset: +(Config.rocketspeedoffset)
    });

    const RP = new IdlePath(
      document.querySelector('#idleAnimation'),
      document.querySelector('#mousePath'),
      {
        idlerotation: Config.idlerotation,
        adjustment  : Config.idlespeedoffset

      }
    );
    RP.setTarget(Config.defaultidleemoji)

    Nodes.screenNode = document.getElementById('screen');
    Nodes.stickyButton = $('#stickybutton');
    Nodes.gallery = document.getElementById('gallery');
    Nodes.twemojiToggle = document.querySelector('.controls__twemojiToggle');
    const $picker = $('#picker');

    Nodes.emojiPickerTrigger = document.getElementsByClassName('controls__emojiPicker')[0];
    //var $highlight = [];
    const $target = $('#emoji');
    const $pin = $('#pin');
    const myAnimation = new Animation($target, $pin);

    const $afk = $('.controls__btn__AFK');
    const $emojipreview = $('#emojipreview');

    const $history = $('#history');
    const $moveHistory = $('#moveHistory');
    const $hideButton = $('#hideEmoji');
    const trashButton = document.getElementById('trashEmoji');


    const $drawButton = $('button.draw');

    /* message console */
    $('#MessageSource').on('keyup click change', 'textarea, button', function (ev) {
      let $M = $('#MessageTarget');
      let $reset = $(this);
      if (ev.type === 'keyup') {
        $M.text($('#Message').val());
      } else if ($reset.attr('type') === 'reset' || $M.text() === '') {
        $M.text('');
        $('#Message').text('');
        $M.css('font-size', ''); //celar font size
        // return true;
      }
      //check if the element is wider or higher than the panel on the screen
      //if it is then diminish the font until it is 20px
      //restore font
      let fontSize = 90;
      $M.css('font-size', fontSize);

      while (
        // if message target is too big
      ($M.height() / $('#chromaKey').height()) > .95
        ) {
        Math.min(Math.max(12, --fontSize), 90);
        $M.css('font-size', fontSize);
        //   ratio = $('#chromaKey').height() / $M.height();

      }

      return true;
    });

    $afk.on('click', function (ev) {
      var randomId, $this;
      var doShow = true;
      $('#afkImages').find('div:visible').each(function () {
        doShow = false;
        $this = $(this);
        $('#' + $afk.data('beforeAfk')).click();
        $this.addClass('afkImages--hide');
        //$('#' + '✌🏻').click();
        $afk.removeClass('pressed');
      });

      if (doShow) {
        randomId = '#afk' + (Math.floor(Math.random() * 1000) % 3 + 1);
        let $this = $(randomId);
        //store the previous element on the afk button object
        $afk.data('beforeAfk', myFavs.recallFave().emoji);
        $('#' + '💤').click();
        $this.removeClass('afkImages--hide');
        // stickyButton.click();
        $afk.addClass('pressed');
      }

      ev.preventDefault();
      return false;
    });

    //probably obsolete
    $hideButton.on('click', function () {
      var fav = myFavs.recallFave($target.text());
      myAnimation.toggleHide(fav.sticky);
      if ($target.is(':hidden')) {
        $hideButton.addClass('pressed');
        $('.history--draggable').addClass('history--hidden');
      } else {
        $hideButton.removeClass('pressed');
        $('.history--draggable').removeClass('history--hidden');
      }
    });

    /********** TRASH CAN ************/
    TrashCan.initCan(Config.trashoffset);
    //0. prepare the wrap
    const dragWrap = (x => {
      x.classList.add('trashCan__dragWrap');
      return x;
    })(document.createElement('div'));

    document.body.append(dragWrap);
    MouseActions.makeDraggable(TrashCan.getCanNode(), {
      mousedownCB: (ev) => {
        //1.make it identical size, etc
        //   anime.set(dragWrap, );
        //2. wrap it
        //  dragWrap.append(TrashCan.getCanNode());
        anime({
          targets: TrashCan.getCanNode(),
          scale  : 1.5
        });
        //3. put an animation on it. ?
        //Object.assign( trackCanXYDelta , TrashCan.getCanNode().getBoundingClientRect());

        //track the XY travelled.
      },
      mouseupCB  : (ev) => {
        //undo #2
        anime({
          targets : TrashCan.getCanNode(),
          scale   : 1,
          //re-init the animation
          complete: a => TrashCan.initAnimation(100)
        });
        //track the XY and update the wrapper

        //TrashCan.updateCanXY();
      },
    }, false /**/);


    trashButton.addEventListener('click', async function (ev) {
      //emojis get crumpled into a trashBall and thrown into a trashCan
      try {
        const btn = this;
        btn.classList.add('pressed');
        btn.classList.remove('pressed--error');
        // whether in the gallery or in history the candidate is always with highlight class
        const emoji = document.querySelector('.highlight');
        const parent = emoji.parentElement;
        const fave = emoji.textContent;
        if (emoji) {

          //make a different emoji selected
          document.getElementById('scrollDown').click();

          //candidate and artifacts have draggable classes
          let draggableClassesToRemove =
            [...(parent.classList)].filter(c => /draggable\d/.test(c));

          const emojiTrash = new TrashCan(Nodes.screenNode, emoji);
          emojiTrash.tossIt(false).then(() => {

            if (1 /* delete the elements now */) {
              //delete emoji and parent elements
              draggableClassesToRemove.forEach(draggables => {
                [...document.getElementsByClassName(draggables)].forEach(el => el.remove());
              });

            }
            //delete additional  requested selectors
            [/*selectorsToCleanup*/].forEach(sel => {
              [...document.querySelectorAll(sel)].forEach(el => el.remove())
            });

            document.querySelector('#trash' + fave).remove();

            //delete the emoji from history
            //  console.log(`${fave} would be trashed now!`);
            btn.classList.remove('pressed');
            myFavs.trashFave(fave);
          })
        }
      } catch (e) {

      }

    });

    //TODO:obsolete. replace with lookup in gallery
    Nodes.stickyButton.on('click', function (ev) {
      //make the current emoji sticky
      var fav = myFavs.recallFave($target.text());
      if (fav) {
        fav.sticky = !fav.sticky;
        if (fav.sticky) {
          myAnimation.removeAnimation();
          Nodes.stickyButton.addClass('pressed');

        } else {
          myAnimation.restartAnimation();
          Nodes.stickyButton.removeClass('pressed');
        }
        highlightFave($target.text(), fav.sticky);
      }
      //ev.preventDefault();
      return false;
    });


    //TODO: obsolete. Find another highlight method
    const highlightFave = function (emoji, sticky = false) {
      emoji = emoji || $target.text();
      $('.highlight').removeClass('highlight');
      //TODO: remove this?
      let $highlight = $('#' + emoji).addClass('highlight');
      //if emoji is sticky then make it "pressed"
      if (sticky) {
        $('#' + emoji).addClass('pressed');
      } else {
        $('#' + emoji).removeClass('pressed');
      }

    } // highlightFave

    //put the emoji in the "dock"
    const archiveFave = function (sticky = false, emoji, url, name, preferTwemoji = false) {
      var firstClass = sticky ? 'history pressed history__btn' : 'history history__btn';
      $('.highlight').removeClass('highlight');
      //$highlight = [];
      emoji = emoji || $target.text();
      let twemojiOpacity = +preferTwemoji;
      let emojiOpacity = +(!twemojiOpacity);
      //add unique entry to the history
      if ($('#' + emoji).length === 0) {
        if( Config.twemoji === 'flag'  ){
          url = /^flag[:]/.test(name) ? url : undefined;
        }

        if (typeof url !== 'undefined') {
          $history.find('#letters')
            .prepend(
              `<span class="letters">`
              + `<button id="${emoji}" class="${firstClass}">`
                + `<span style="background-image:url(${url});position:absolute;opacity:${twemojiOpacity}" class="history_emojiURL">${emoji}</span>`
                + `<span style="position:absolute;opacity:${emojiOpacity}" class="history__emoji">${emoji}</span>`
              + `</button>`
              +`</span>`
            );
          //              + `<img src="${url}" alt="${emoji}" style="position:relative;"/>`

        } else {
          $history.find('#letters')
            .prepend(
              `<span class="letters">
                  <button id="${emoji}" class="${firstClass}">
                    <span style="position:absolute;" class="history__emoji">${emoji}</span>
                  </button>
              </span>`
            );
        }

      }
      //update size of icons
      let histCt = $history.length;
      let area = $history.width * $history.height
      let size = Math.min((area / histCt) ^ .5, 80);

      $history.css('font-size', size + 'px');

    } //archiveFave

    //add to the emojiPicker cache
    const populateDock = function () {

      let myA = myFavs.getStash();
      for (var i = (myA.length - 1); i >= 0; i--) {
        let fave = myA[i];
        if (!fave) {
          continue;
        }
        if (i === 0) {
          if (fave.sticky) {
            myAnimation.removeAnimation();
          } else {
            myAnimation.addAnimation();
          }
          $target.text(fave.emoji);
        }
        archiveFave(!!fave.sticky, fave.emoji, fave.url, fave.name);
        //try to highlight in history
        highlightFave(fave.emoji, !!fave.sticky);
      }
    } //populateDock
    populateDock();

    //stickyButton.click(); //initialize sticky  for the last emoji

    App.Fn.injectSelection = function (selection) {
      //a highlighted one means we have nothing to archive
      var fave = myFavs.stashIt(selection);

      myAnimation.addAnimation();
      if (fave.sticky) {
        myAnimation.removeAnimation();
        Nodes.stickyButton.addClass('pressed');
      } else {
        Nodes.stickyButton.removeClass('pressed');
      }
      $target.text(fave.emoji);
      archiveFave(fave.sticky, fave.emoji, fave.url, fave.name);
      //try to highlight in history
      highlightFave($target.text(), fave.sticky);
      return false;
    } //injectSelection

    var switchEmoji = function (direction) {
      var lastFave = myFavs.recallIt(direction);
      //get last history emoji and compare
      log.browser(direction, myFavs.stash);
      log.browser(myFavs, lastFave, switchEmoji.bump);
      //archive the current one
      $target.text(lastFave.emoji);
      //if target text already equals the
      //lookup the emoji in the history for highlighting
      highlightFave($target.text(), lastFave.sticky);
      //if the previous run was a bump then we need to wrap

      if (lastFave.sticky) {
        myAnimation.removeAnimation();
        Nodes.stickyButton.addClass('pressed');
      } else {
        Nodes.stickyButton.removeClass('pressed');
        myAnimation.restartAnimation();
      }
    } //switchEmoji
    switchEmoji.bump = 1; //we start at the top already

    $('.dragTemp').on('click', function () {
      //always put the last clicked last in gallery
      //$(this).appendTo('#gallery');
    });

    //this should persist through the session
    //TODO: make it such that this setting is initiated when selecting the emoji / twemoji and when reloading
    //cached emojis (e.g. when restoring your session)
    Nodes.twemojiToggle.addEventListener('click', (ev) => {
      const twemoji = gallery.lastElementChild.querySelector('.history__emoji');
      const emoji = gallery.lastElementChild.querySelector('.history_emojiURL');

      if (twemoji.style.opacity === '0' || twemoji.style.opacity === 0) {
        twemoji.style.opacity = 1;
        emoji.style.opacity = 0;
      } else {
        twemoji.style.opacity = 0;
        emoji.style.opacity = 1;
      }
      //visual feedback of the click
      anime({
        targets: ev.target,
        rotateY : 360,
        duration : 1000
      });


    });

    /* *
    * clicking on a history emoji makes it:
    * - come to the top z-index
    * - get reprioritized to the front of the history
     */
    $history.on('dblclick', 'button', function (ev) {
        let $this = $(this);
        $this.data('dblclick', true);
        /*
        * draggable is the method to determine if it has been elevated to the gallery
        * draggble data => means it is in the gallery already
         */
        if (!$this.data('draggable')) {
          let top = $this[0].getBoundingClientRect().top
          let left = $this[0].getBoundingClientRect().left
          let randomClass = 'draggable' + Math.floor(Math.random() * 1000);
          while (myAnimation.animationCache[randomClass]) {
            randomClass = 'draggable' + Math.floor(Math.random() * 1000);
          }
          let $temp = $('<span class="randomClass dragTemp"></span>');


          /*
          if it is sticky then give it a pin
           */
          let emoji = this.id;
          let fave = myFavs.recallFave(emoji);
          let pin = $('<span class="dragTemp__pin">📌</span>')
          pin.hide()
          $temp.append(pin);
          if (fave && fave.sticky) {
            $temp.addClass('history--sticky');
            pin.show();
          }
          myFavs.promoteFave(fave);

          //$temp.append('<span class="dragTemp__closer">x</span>');
          let $origin = $this
            .closest('span').addClass(randomClass);

          /* reprioritize */
          //change the origin location to be the first entry in the dock
          $origin.prependTo('#letters');

          //return it back to history via doubleclick on new draggable
          $temp.one('dblclick', function (ev) {
            //return back to history
            $temp.find('.dragTemp__pin').hide();
            //let randomClass = $temp.data('draggable').randomClass;
            //  let location = $temp.data('draggable').location;
            top = top - $temp[0].getBoundingClientRect().top;
            //   left = $temp[0].getBoundingClientRect().left - left;

            myAnimation.doTimeline(randomClass + 'To', 'stop');

            //half the time (just to mix it up) do a trash animation here
            //there is no callback to throw it out though

            if (Math.random() > .8) {
              const parentNode = $this[0].parentElement;
              const emojiTrash = new TrashCan(Nodes.screenNode, $this[0]);
              let a = anime({
                targets : parentNode,
                scale   : 1,
                duration: 2000
              });
              emojiTrash.tossIt(true, $this[0], a.finished).then(() => {
                //    parentNode.remove()
                $this
                  .appendTo($origin)
                  .removeClass('history--draggable')
                  .addClass('history__btn');
                $temp.removeData('draggable').remove();
                anime({
                  targets   : '.' + randomClass,
                  scale     : 1,  //.2,
                  opacity   : [0, 1],
                  rotate    : 0,
                  duration  : 3000,
                  translateY: 0,
                  translateX: 0,
                  delay     : 0,
                  easing    : 'linear',
                  //  complete  : a => anime.remove('.' + randomClass)
                });
              });

              // TrashCan.animateOnce(, true, 0).then(a => {

              // });
              return;
            } //if


            //to fall to where the broom level already is
            const newY =
              (({top, height}) => top + height)(
                TrashCan.getXY(TrashCan.getBroom(), ['top', 'height'])
              );

            //TODO : make a copy of them lie flat and wait to be "swept up"

            myAnimation
              .timeline(randomClass + 'From', {loop: 1})
              .addToTimeline(randomClass + 'From', {
                targets   : $this[0].parentElement,//$this[0],
                scale     : 1, //.2, //.8, //
                opacity   : 1,
                duration  : 500,
                rotateY   : [{
                  value   : 0,
                  duration: 1500
                }, {value: Math.random() * 40 - 20}],
                translateX: 0,
                translateY: 0,
                top       : [{
                  value   : newY - Math.random() * 100,
                  duration: 1600,
                  delay   : 400
                }],
                rotateX   : [{
                  value   : 70,
                  duration: 500
                }, {
                  value   : 70,
                  duration: 1500
                }],
                easing    : "easeOutExpo",
                complete  : a => {
                  //put a "copy" on the floor as splat
                  if ($this[0].parentElement) {
                    const splat = $this[0].parentElement.cloneNode(true);
                    splat.classList.add('floor__trash');
                    //remove draggable classes
                    splat.classList.remove(...
                      [...splat.classList].filter(cl => /drag/i.test(cl))
                    );
                    if (TrashCan.addDust(splat)) {
                      console.log('dust added');
                    }
                    //if landed in the trash that's great
                    if (_u.isAwithinB(splat, TrashCan.getCanNode(), {}, true)) {
                      TrashCan.putInCan(splat);
                      splat.classList.remove('floor__trash');
                      splat.style.top = null;
                      splat.style.left = null;
                    } else {
                      TrashCan.addDust(splat) && console.log('dust added');
                    }

                  }

                  //put the original back in history at "front"
                  $this
                    .appendTo($origin)
                    .removeClass('history--draggable')
                    .addClass('history__btn');
                  $temp.removeData('draggable').remove();
                }
                }
              )
              .addToTimeline(randomClass + 'From',
                {
                  targets : '.' + randomClass,
                  scale   : 1,
                  opacity : 1,
                  duration: 1000,
                  delay   : 0,
                  easing  : 'linear',
                  complete: function () {
                      anime.remove('.' + randomClass);
                  }
                },
                'destroyIt'
              );
            /* from: https://tobiasahlin.com/moving-letters/#2 */

            //App.Fn.injectSelection(emoji);
            return false;
          });

          //temporary variable to enclose it
          $temp
            .data('draggable', {
              location   : {
                top : $this[0].getBoundingClientRect().top,
                left: $this[0].getBoundingClientRect().left
              },
              randomClass: randomClass,  //cache its source location
              Draggable  : MouseActions.makeDraggable(
                $temp[0], {
                  mousedownCB: function (el) {
                    // on each drag... move it to the "end"" of the gallery (so that it has highest z-index)
                    $temp.appendTo('#gallery');

                    //refresh the Fade-out animation when dragged
                    myAnimation.doTimeline(randomClass + 'Fade', 'restart');
                    if ($temp.hasClass('history--sticky')) {
                      myAnimation.doTimeline(randomClass + 'Fade', 'pause');
                    }
                  },
                  mouseupCB: function (ev, node) {
                    //resume the "linger" animation after mouseup
                    Config.linger && MouseActions.linger(node);
                  }
                })
            })
            .appendTo('#gallery')
            .css({
                left: left,
                top : top
              }
            )
            .addClass('history--draggable')
            .addClass(randomClass);

          $this.addClass(randomClass)
            .prependTo($temp)
            .removeClass('highlight')
          // .removeClass('history__btn')
          //.addClass('history--draggable');
          anime.set($temp[0],
            (({left, top, height, width}) => ({
                top   : top,
                left  : left,
                height: height,
                width : width
              })
            )($this[0].getBoundingClientRect())
          );

          //TODO: get screen dimensions and calculate a number here. also try to keep center circle area clear
          //cuz that's the center of the video

          let randomY = Math.floor(530 * Math.random()) + 10;
          let randomX = Math.floor(950 * Math.random()) + 10;

          myAnimation.timeline(randomClass + 'To', {loop: 1})
            .addToTimeline(randomClass + 'To', {
                targets   : $temp[0],
                scale     : 3, //scale here instead of in css such that there is "growth"
                opacity   : 1,
                translateZ: 0,
//            translateY: randomY,//random distance
                //  translateX : randomX,
                left      : randomX,
                top       : randomY,
                begin     : function () {
                  console.log('begin dock animation');
                },
                easing    : "easeOutExpo",
                duration  : 950,
                //    autoplay : false,
                delay     : 200,
                complete  : function () {
                  //if (fave.sticky) {     //only linger sticky items?
                  Config.linger && MouseActions.linger($temp[0]);
                  //}

                  /*
                  * add a fade function after the emoji is animated to the gallery
                   */
                  myAnimation.timeline(randomClass + 'Fade', {}) //loop?
                    .addToTimeline(randomClass + 'Fade', {
                      targets : $temp[0].querySelector('button'),// 'span.' + randomClass,
                      opacity : [1, .1],
                      duration: 40000,
                      delay   : 1000,
                      easing  : 'linear',
                      begin   : function (anim) {
                        /*
                        ** if the emoji should be sticky then
                        ** pause the fade and do the linger animation
                        *
                        * fade can be resume later
                         */
                      },
                      complete: function () {
                        if ($temp.hasClass('history--sticky')) {
                          myAnimation.doTimeline(randomClass + 'Fade', 'restart');
                          myAnimation.doTimeline(randomClass + 'Fade', 'pause');
                          return;
                        }
                        if ($temp.hasClass('history--draggable')) {
                          $temp.trigger('dblclick');
                        }
                      }
                    });
                }
              },
              'destroyIt'
            );
          /* from: https://tobiasahlin.com/moving-letters/#2 */


          ev.preventDefault();
          return false;
        }
      }
    );//history.on

    //recall from history dock it should also update browser cache/history
    /*$history.on('click', 'button', function (ev) {
      let $this = $(this);
      let emoji = this.id; //$this.text();
      //if it's draggable then click does nothing
      let to = setTimeout(function () {
          if (!$this.hasClass('history--draggable')) {
            $target.text(emoji);

            var fave = myFavs.stashIt(emoji, true);
            archiveFave(fave.sticky, emoji, fave.url, fave.name);
            highlightFave(emoji, fave.sticky);

            myAnimation.addAnimation();
            if (fave.sticky) {
              myAnimation.removeAnimation();
              Nodes.stickyButton.addClass('pressed');
            } else {
              Nodes.stickyButton.removeClass('pressed');
            }
            return;
          } else //is draggable
          {
            //bring to the front of gallery by putting as he last element of the gallery
            $this.closest('span').appendTo('#gallery');
          }
        },
        //if the user double clicks within this time period then it is ok
        // if they single click then it will wait
        800);
    });*/

    $('body').on('keydown', function (ev) {
      // let direction = 0;
      // let Halign = 0;
      //handle ESC key to toggle drawing drawing
      const $emojiwrapper = $('.emoji-picker__wrapper');
      if ($emojiwrapper.is(':hidden') && ev.which === 27) {
        $drawButton.click();
      }

      // if emoji selector is being navigated then do nothing
      if ($emojiwrapper.is(':visible')) {
        //only move the emoji when the picker is hidden
        return;
      }

      //lastly, move most recent emoji with arrow key controls
      if (ev.which >= 37 && ev.which <= 40)
        $('#gallery').find('.dragTemp:last').each(function () {
          myAnimation.moveTarget(ev.which, 20, $(this));
          Config.linger && MouseActions.linger(this);
        })

      //emojiWrapperAnimation.moveTarget(ev.which); //

    });//body on click


    $('#scrollUp').on('click', (ev) => {
      //  var direction = ev.shiftKey ? 1 : -1;
      switchEmoji(-1);
      ev.preventDefault();
      return false;
      // $target.show().fadeIn(1000);
    });
    $('#scrollDown').on('click', (ev) => {
      //  var direction = ev.shiftKey ? 1 : -1;
      switchEmoji(1);
      ev.preventDefault();
      return false;
      // $target.show().fadeIn(1000);
    });

    /*
    *  whatever most recent emoji from the dock is in the gallery is what the emojipreview works on
    *
     */
    $('.emojipreview__pin').on('click', function () {
      //last item in the gallery is the most recent [because of implied z-index]
      $('#gallery').find('.dragTemp:last').each(function () {
        let $temp = $(this);
        let fave = myFavs.recallFave($temp.find('button').id); //.text());
        let randomClass = $temp.data('draggable').randomClass;

        if (fave && fave.sticky)
          //if they are already sticky then remove that and start the fade
        {
          //remove sticky
          fave.sticky = false;
          $temp.removeClass('history--sticky');

          //hide the pin
          $temp.find('.dragTemp__pin').hide();

          //reverse any fade by restart
          myAnimation.doTimeline(randomClass + 'Fade', 'restart');
        } else
          //else they should now become sticky
        {
          //reverse the fade
          $temp.addClass('history--sticky');
          myAnimation.doTimeline(randomClass + 'Fade', 'restart');
          myAnimation.doTimeline(randomClass + 'Fade', 'pause');

          //make them sticky
          fave.sticky = true;
          //show the pin
          $temp.find('.dragTemp__pin').show();
        }
        Config.linger && MouseActions.linger(this);

      });
      return;

    }); //preview pin

    $('.emoji_preview__emoji').on('click', function () {
      App.Fn.injectSelection({
        emoji: $emojipreview.find('.emoji_preview-emoji').text()
      })
      if ($(this).hasClass('sticky')) {
        Nodes.stickyButton.click();
      }
    });


//when this button is toggled then the idle path animation can happen
    const $mouseFollowButton = $('.emojipreview__follow');
    $mouseFollowButton.data('pressed', $mouseFollowButton.hasClass('pressed'));
    $mouseFollowButton.on('click', function (e) {
      let becomePressed = !$mouseFollowButton.data('pressed')
      try {
        //button appears pressed
        if (becomePressed) {
          $mouseFollowButton.addClass('pressed');

          //update mouse follow to match ?
          //myMouseActions.setContent(emojisource);
          let emojisource = $('#gallery').find('.dragTemp:last').find('button');
          if (emojisource.length === 0) {
            emojisource = $('.highlight')
          }
          emojisource = emojisource[0]
          //make the idle animation use a new emoji text content
          if (emojisource) {
            document.querySelector('.idleAnimation__span').textContent = emojisource.textContent;
          }
          myMouseActions.forceIdle();

        } else {
          $mouseFollowButton.removeClass('pressed');
        }

        //update data after successes above
        $mouseFollowButton.data('pressed', becomePressed);
      } catch (e) {
        console.log('error in mouse animation toggle', e)
      }
    });
    myMouseActions = new MouseActions(
      Config.defaultpointeremoji, //default
      {
        startIdle: true,
        idleMax  : +(Config.idletimeout)
      },
      //idle animation
      function (e) {
        if // if the user desires animation
        ($mouseFollowButton.data('pressed')) {
          RP.resume();
          RP.getTarget().style.display = '';
        }
        anime({
          targets : $mouseFollowButton[0],
          rotate  : '360',
          duration: 1000,
          scaleX  : (el) => {
            return (/scaleX[(][-]+/).test(el.style.transform) ? 1 : -1;
          },
          complete: (a) => {
            a.remove('*')
          }
        });

      },
      //action when user is moving mouse
      function (mouse) {
        RP.getTarget().style.display = 'none';
        RP.animation.pause();
        let el = myMouseActions.container();
        let {width, height} = TrashCan.getXY(el);
        anime.set(el, {
          left: mouse.pageX - width - 2,
          top : mouse.pageY - 2// - height/2
        })

      }
    );
    myMouseActions.makeFollow();

    /*********** add the drawing canvas to the screen ********/
    new Drawing(
      document.getElementById('drawing'),
      document.getElementById('drawingButtons'),
      document.getElementById('controls').querySelector('.controls__btn__draw'),
      {},
      {
        setupCB: function () {
          //turn off by default
          this.hide();
        },
        hideCB : function () {
          let properties = this.getProps();
          let pointer = document.body.querySelector('.followMouse');
          //let canvas = this
          let borderColor = properties.isVisible ? properties.color : 'rgba(255,255,255,0.3)';
          if (pointer) {
            Object.assign(pointer.style, {
                borderColor: borderColor
              }
            );
          }

          if (properties.nodes && properties.nodes.wrapper) {
            Object.assign(
              properties.nodes.wrapper.style, {
                borderColor: borderColor,
                borderWidth: '4px'
              })
          }
          return true;
        },
        penCB  : function () { // (pen, properties) => {
          this.getProps().callbacks.hide();
        }
      }
    );



    $moveHistory.on('click', function () {

      //send all the floating big history back home
      $('.history--draggable')
        .removeClass('history--hidden')
      $('span.history--draggable').trigger('dblclick');

      // $history.appendTo($('#letters'));
      /* if all the emojis are docked then splash them on the screen */
      if ($('#gallery').find('span').length === 0) {

        //create an async task
        let i = 0
        $history.find('button').each(function () {
          let $this = $(this)
          setTimeout(function () {
            $this.dblclick();
            i = i + (Math.random() * 600)
          }, i);
          return true;
        });
      } else if (myAnimation.timeline('history')) {
        myAnimation.doTimeline('history', 'restart')
      } else {
        myAnimation.timeline('history', {loop: 1})
          .addToTimeline('history', {
            targets   : '#history .history',
            scale     : [0.3, 1],
            opacity   : [0, 1],
            translateZ: 0,
            easing    : "easeOutExpo",
            duration  : 600,
            delay     : (el, i) => 70 * (i + 1)
          })
          .addToTimeline('history', {
            targets : '.text-wrapper .line',
            scaleX  : [0, 1],
            opacity : [0.5, 1],
            easing  : "easeOutExpo",
            duration: 700,
            offset  : '-=700',
            delay   : (el, i, l) => 80 * (l - i)
          })
          .addToTimeline('history', {
            targets : '.text-wrapper .line',
            opacity : 0,
            duration: 1000,
            easing  : "easeOutExpo",
            delay   : 1000
          });
      }
    }); //moveHistory

    //button to change width of the message
    $('.messageSource__changeW').on('click', function (ev) {
      let btn = ev.target;
      let $ms = $('.messageTarget__pre');
      let $mt = $('.messageTarget');
      let preModifiers = [
        'messageTarget__pre--full', //4
        'messageTarget__pre--narrow', //5
        'messageTarget__pre--left',//6
        'messageTarget__pre--left', //7
        'messageTarget__pre--full', //8
        'messageTarget__pre--off', //0
        'messageTarget__pre--narrow', //1
        'messageTarget__pre--right', //2
        'messageTarget__pre--right',//3
      ];

      let targetModifiers = [
        'messageTarget--bottom', //4
        'messageTarget--bottom',//6
        'messageTarget--bottom',//6
        'messageTarget--top',//7
        'messageTarget--top',//8
        'messageTarget--nothing',
        'messageTarget--top', //1
        'messageTarget--top',//2
        'messageTarget--bottom'//3
      ];

      //⏯️↕️⏮️⏯️↕️↔️⏮️  ️⏬
      let buttonContents = [
        '↔️',
        '⬇️',
        '↙️',
        '↖️',
        '↕️',
        '⏏️',
        '⬆️',
        '↗️',
        '↘️'
      ];
      //determine which index currently have.
      for (var i = 0; i < preModifiers.length; i++) {
        let j = i;
        btn.classList.add('pressed');
        if ($ms.hasClass(preModifiers[i]) && $mt.hasClass(targetModifiers[i])) {
          //remove the class
          $ms.removeClass(preModifiers[i]);
          $mt.removeClass(targetModifiers[i]);
          j = i + 1;
          if (j === preModifiers.length) {
            //start over next loop
            j = 0;
            //also 0 ==> "off"
            btn.classList.remove('pressed');
          }
          //go to the next class
          $ms.addClass(preModifiers[j]);
          $mt.addClass(targetModifiers[j]);
          btn.textContent = buttonContents[j];

          //trigger keyup for resize
          $('#Message').keyup();
          break;
        }
        continue;
      }
      return false;
    });

    $('#PageHelp > .pageHelp__button').on('click', function (ev) {
      let help = Init.help;
      let $this = $(this);
      if (!$this.hasClass('pressed')) {
        $this.addClass('pressed');
        //add help via message tool
        $('#Message').text(help).keyup();

        // add a one-time handler to reset sponge in case that is used
        $('#MessageSource').find('.messageSource__reset').one('click', function () {
          $this.removeClass('pressed');
          return true;
        });
      } else {
        $this.removeClass('pressed');
        $('#MessageSource').find('.messageSource__reset').click(); // fire that reset
        //  ev.preventDefault();
        //  ev.stopPropagation();
        return false;
      }
      return false;
    });

    /***********
     *
     * clicking the timer button creates a new instance of meeting countdown.
     *
     * clicking it again destroys it and recreates it.
     *
     * TODO:??
     * You can pause the visual part of animation (by clicking on the sliding hour glass),
     * but it continues to count down.
     * This is because it is going towards a time and not trying to accomplish a duration.
     * When you resume it will catch up (warp)
     *
     */
    //setup some animations the MeetingCountDown callbacks will use
    App.Fn.sliderRotate = function (node, dur, delay) {
      return anime({
        targets: node, //slider.firstElementChild,
        rotateZ: [
          {
            value   : 0,
            duration: 0
          },
          {
            value   : -45,
            easing  : 'linear',
            duration: dur
          }
          , {
            value   : -90,
            easing  : 'linear',
            duration: dur,
            delay   : delay
          }, {
            value   : 0,
            easing  : 'easeInOutQuad',
            duration: 3000
          }
        ]
      });
    }

    document.querySelector('#clockForm').addEventListener('submit', (ev) => {
      ev.preventDefault()
      document.querySelector('.emojipreview__clock').click();
      return false;
    });
    new MeetingCountDown(
      Nodes.screenNode,
      document.querySelector('.emojipreview__clock'),
      document.querySelector('.emojipreview__clocknum'),
      document.querySelector('.flexClock__steps'), //flexClock__steps
      {
        callbacks: [{
          times: [-3],
          cb   : (minsLeft, opts) => {
            Nodes.spiderTrigger.click();
          }
        },
          {
            times: [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10],
            cb   : (minsLeft, opts) => {

              let randomIdx = Math.floor(Math.random() * 4.99);
              if (!opts.spam) {
                opts.spam = ['🤬', '😰', '👿', '💩', '💣'];
              }
              let spam = document.getElementById(opts.spam[randomIdx]);
              if (spam) {
                let ev2 = document.createEvent('MouseEvents')
                ev2.initEvent('dblclick', true, true);
                spam.dispatchEvent(ev2);
              }
            }
          },
          { //these are the times when the slider resets.
            times    : [5, 10],
            completed: [],
            cb       : (minsLeft, opts) => {

            }
          },
          { /* spotlight & shadow */
            times    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60],
            completed: [],
            cb       : (minsLeft) => {
              const shadow = MeetingCountDown.makeWarning(' ', 'flexClock__shadow');
              const spotlight = MeetingCountDown.makeWarning(minsLeft, 'flexClock__spotlight');
              if (!spotlight || !shadow) {
                return;
              }

              const wrap = spotlight.parentElement;

              //if double digits then make the spotlight font smaller
              if (minsLeft >= 9) {
                spotlight.classList.add('flexClock__spotlight--doubledigit');
              } else {
                spotlight.classList.remove('flexClock__spotlight--doubledigit');
              }

              //only do this the if its not draggable
              if (!MouseActions.isDraggable(wrap)) {
                MouseActions.makeDraggable(wrap, {}, false);
              }

            const spotlightAnimation = anime.timeline({
              autplay: false,
              targets: spotlight
            }).add({
              duration: 3000,
              scale   : [10, 3],
              //translateY: [, -1],
              opacity : 1,
              easing  : 'easeOutBounce'
            }).add({
              duration: 3000, //wait 3 seconds here
              easing  : 'easeInBounce',
            }).add({
              scale     : 1,
              duration  : 1500,
              translateY: 0,
              easing    : 'easeOutQuint',
              complete  : a => {
                // console.log(a.progress, spotlight.getBoundingClientRect())
              }
            }); /**/

            const shadowAnimation = anime.timeline({
              autoplay: false,
              targets : shadow
            }).add({
              opacity   : 1,
              duration  : 3000,
              scale     : [.1, 3],
              translateY: 1,
              easing    : 'easeOutBounce'
            }).add({
              duration: 3000,
              easing  : 'easeInBounce', //translateY : -50,
            }).add({
              scale   : .1,
              opacity : 0,
              duration: 1500,
              easing  : 'easeOutQuint'
            }); /**/

              //using the child will strip off all the animation transformations

              const spotlightToss = new TrashCan(Nodes.screenNode, spotlight);

              //resolve early
              //TrashCan.animateOnce(spotlightAnimation, spotlightAnimation, 3000)
              spotlightAnimation.finished.then(a => {
                  //spotlight is actually wrapped so we want it's first child
                  spotlightToss.tossIt(false, spotlight, spotlightAnimation.finished).then(x => {

                    //more visible in the trash
                    spotlight.style.overflow = 'visible';
                    // spotlight.remove();//dont remove it cuz we like seeing it in the trash
                    //  spotlightAnimation.remove();
                  }); /**/
                }
              );

              shadowAnimation.finished.then(() => {
                shadowAnimation.remove();
                //       shadow.remove();
              });

              spotlightAnimation.play();
              shadowAnimation.play();

            }
        },
          {
            times: [0], //essentially on expiry
            cb   : function (
              /* integer */ minsLeft,
              /* Object */ opts
            ) {
              const slider = MeetingCountDown.getSlider();
              const sliderBtn = slider.firstElementChild;

              if (sliderBtn) {
                sliderBtn.style.borderColor = '';
                sliderBtn.style.backgroundColor = '';
                sliderBtn.classList.remove('flexClock__slider__button--green', 'flexClock__slider__button--red');
              }
              //restore sloth rotation by quick-setting it

              //kill other animations on it;
              anime.remove(slider);
              //anime.remove(sliderBtn);
              //slide back up in 10 seconds ... while also rotating

              anime({
                targets   : slider,
                duration  : 10000,
                translateY: 0,
                easing    : 'linear'
              });

              let triggerNode = this.triggerNode;
              MeetingCountDown.grandFinale();
              let oneClick = function (ev) {
                clearInterval(intervalFn);
                //remove this event after firing once
                ev.currentTarget.removeEventListener('click', oneClick);
              }
              let updateCounter = function (el) {
                el.value = new Date().toLocaleTimeString("en-US",
                  {
                    timeZone: "Canada/Eastern",
                    hour12  : false,
                    hour    : "2-digit",
                    minute  : "2-digit",
                    second  : "2-digit"
                  })
              };
              let counterNode = document.querySelector('.goodBye__counter');
              updateCounter(counterNode);
              let intervalFn;

              anime.timeline({loop: 1})
                .add({
                  targets   : counterNode,
                  scale     : 1,
                  duration  : 10000,
                  opacity   : [0, 0],
                  translateY: 150,
                  complete  : () => {
                    intervalFn = setInterval(function () {
                      updateCounter(counterNode);
                    }, 500);
                  }
                })
                .add({
                  targets   : counterNode,
                  opacity   : [0, 1],
                  duration  : 5000,
                  translateY: 0
                })
                .add({
                    targets : counterNode,
                    scale   : 1,
                    duration: (10 * 60 * 60 * 1000),
                    update  : function (a) {
                      /* this will probably get killed before completion so
                      setup a handler on the clock's triggerNode to
                       */
                      triggerNode
                        .addEventListener('click', oneClick);
                    }
                  }
                ); //animation
            }
          }
        ]
      },

//go callback (fired on every refresh of the internal timer animation)
      function (opts) {
        //rotate sloth
        const slider = MeetingCountDown.getSlider();
        const sliderBtn = slider.firstElementChild;
        const rotationDuration = 84.8528137423857 / this.speed;
        const secondStageDelay = this.duration - rotationDuration * 2;

        let returnValue;

        sliderBtn && sliderBtn.classList.add('flexClock__slider__button--green');

        // 84.8528137423857 is distance from center point to corner of sliderBtn's boundingRect
        if (App.Animations.sliderRotate)
          App.Animations.sliderRotate.restart()
          && App.Animations.sliderRotate.pause()
          && App.Animations.sliderRotate.remove('*');
        App.Animations.sliderRotate =
          App.Fn.sliderRotate(sliderBtn, rotationDuration, secondStageDelay);

        //add to the cleanupprocess
        App.Promises.clockCleanup.then(() => {
          App.Animations.sliderRotate.remove();
        })
        this.goReturnValue = App.Promises.sliderRotate;

      },
      //on
      function (opts) {
        //start/refresh a cleanup queue that will be triggered at "off"
        if (App.Promises.clockCleanup)
          //resolve any existing
          App.Promises.clockCleanup.resolve();

        //start a new one
        App.Promises.clockCleanup = PP.getDeferred();

        const clock = document.getElementById('flexClock');
        clock.classList.remove('flexClock--hide');

        /* 1. create a body trigger to get mouse
        * 2. check on position of the clock v mouse
        * 3. determine if the mouse is over the clock
        * 4. elevate the clock z-index and trigger mousedownCB
        * 5. proceed to drag
        * 6. on mouse release lower the Z again
         */
        //1.
        Nodes.screenNode.addEventListener('mousedown', function (ev) {
          const mouseLocation = {};
          //transpose mouselocation onto 1-dimensional rectangle co-ordinates
          (({pageX, pageY}, XY) => {
            Object.assign(XY, {
              left  : pageX,
              top   : pageY,
              bottom: pageY,
              right : pageX
            });
          })(ev, mouseLocation)
          let isMouseOver = _u.isAwithinB(mouseLocation, clock);

          if (!isMouseOver)
            return true;

          if (clock.classList.contains('isDraggable')) {
            //trigger the click that was already made
            clock.dispatchEvent(new Event('mousedown'));
            //already draggable..quit early
            return true;
          }

          //TODO:
          //2.

          //3b
          if (!isMouseOver) {
            return;
          }
          //4.


          //5.make clock draggable

          //5.
          MouseActions.makeDraggable(clock, {
            mousedownCB: function (ev) {
              console.log('zoomin', this);
              anime.set(this, {
                'z-index': 23000
              });
              //console.log('dragging the clock');

            },
            mousemoveCB: function () {
              //if we're past the center point on horizontal (X-asis) then flip the slider

              const bodyXY = (({innerHeight, innerWidth}) => {
                return {
                  height: innerHeight,
                  width : innerWidth,
                  right : innerWidth
                }
              })(window);
              MeetingCountDown.locate()
              /*
              sliderBtn.classList.add('flexClock__slider__button--left');
            } else {
              sliderBtn.classList.remove('flexClock__slider__button--left');
            }
            const clockXY = TrashCan.calcDiffXY(clock, bodyXY, [2000, 2000]);
            const sliderBtn = MeetingCountDown.getSlider().firstElementChild
            if (clockXY.diff.centerX < 0) {
              //right

              MeetingCountDown
            } else {
              //left

            }

               */

            },
            mouseupCB  : function (ev) {
              //send backward
              console.log('send backward');
              anime.set(this, {
                'z-index': 0
              });
            }
          }); //makedraggable

          //4
          anime.set(this.target, {
            'z-index': 23000
          });
          //trigger the click that was already made
          clock.dispatchEvent(new Event('mousedown'));

        }); //body mousedown

        /*************************
         * start broom
         *
         *
         */
        TrashCan.goBroom('.floor__trash');

        //restart countdown
      },
      //off
      function () {
        //animations to clean up

        //fire the cleanup Promise
        App.Promises.clockCleanup.resolve();

        anime({
          targets   : '.flexClock__sub--A .flexClock__step',
          translateY: 0,
          duration  : anime.stagger(100, {direction: 'reverse'}),
          complete  : () => {
            $('#flexClock').hide();
          }
        });
        document.querySelector('.goodBye__counter').value = '';
        anime.remove('#meetingOver');
        anime.remove('#meetingOver *');
        anime({
          targets           : '#meetingOver',
          'background-color': 'rgba(0,0,0,.8)',
          opacity           : 0,
          duration          : 100
        });
        anime({
          targets : document.querySelector('.goodBye__counter'),
          opacity : 0,
          duration: 100
        });
        document.querySelector('.emojipreview__clocknum').value = '';
        anime.remove(document.getElementById('meetingOver').childNodes);

        //turn off Broom
        TrashCan.stopBroom();
      }
    );

    /* TODO: make the broom draggable.. similar problem to the  clock because it is
    * buried in it z-index depth
     */
    new TrashCan(Nodes.screenNode);
    document.body.addEventListener('mousedown', function (ev) {
      const broom = TrashCan.getBroom();
      var distanceTravelled = 0;
      const mouseLocation = {};
      //transpose mouselocation onto 1-dimensional rectangle co-ordinates
      (({pageX, pageY}, XY) => {
        Object.assign(XY, {
          left  : pageX,
          top   : pageY,
          bottom: pageY,
          right : pageX
        });
      })(ev, mouseLocation)
      let isMouseOver = _u.isAwithinB(mouseLocation, broom);

      if (!isMouseOver)
        return true;

      if (broom.classList.contains('isDraggable')) {
        //trigger the click that was already made
        broom.dispatchEvent(new Event('mousedown'));
        //already draggable..quit early
        return true;
      } else {


        MouseActions.makeDraggable(broom, {
          mousedownCB: function (ev) {
            console.log('zoomin', this);
            anime.set(broom, {
              'z-index': 23000
            });

            broom.classList.add('floor__broom--click');
            //init flag to detect movement
            distanceTravelled = 0;
            return true;

          },
          mousemoveCB: function (ev) {
            console.log('dragging the broom');
            distanceTravelled++;
            return true;

          },
          mouseupCB  : function (ev) {
            //send backward
            console.log('send backward');
            anime.set(broom, {
              'z-index': 0
            });
            broom.classList.remove('floor__broom--click');
            if (distanceTravelled < 100) {
              console.log(distanceTravelled);
              //if it hasn't moved then a sweep was requested

              distanceTravelled = 0;
              TrashCan.forceBroom();
            }
            return true;
          }
        }, false);
        //fired once
      }

    }); //mousedown

    /**************/
    //  $drawButton.click(); // default

    $history.find('.highlight').click();

    Nodes.screenNode.addEventListener('mousedown', function (ev) {
      const mouseLocation = {};
      const spiderWeb = document.querySelector('.web__draggable');
      const cobWeb = document.querySelector('.web__cob');
      //transpose mouselocation onto 1-dimensional rectangle co-ordinates
      (({pageX, pageY}, XY) => {
        Object.assign(XY, {
          left  : pageX,
          top   : pageY,
          bottom: pageY,
          right : pageX
        });
      })(ev, mouseLocation)
      let isMouseOver = _u.isAwithinB(mouseLocation, cobWeb);

      if (!isMouseOver)
        return true;

      if (spiderWeb.classList.contains('isDraggable')) {
        //trigger the click that was already made
        spiderWeb.dispatchEvent(new Event('mousedown'));
        //already draggable..quit early
        return true;
      }

      MouseActions.makeDraggable(
        spiderWeb, {
          mousedownCB: function (ev) {
            console.log('zoomin', this);
            anime.set(this, {
              'z-index': 23000
            });
            //console.log('dragging the web');

          },
          mousemoveCB: function () {
          },
          mouseupCB  : function (ev) {
            //send backward
            console.log('send backward');
            anime.set(this, {
              'z-index': 0
            });
          }
        }, false); //makedraggable

      //4
      anime.set(this.target, {
        'z-index': 23000
      });
      //trigger the click that was already made
      spiderWeb.dispatchEvent(new Event('mousedown'));

    }); // body click

    const spiderAnimations = [];
    const spiderIntervalFn = function () {
      setTimeout(function () {

        const fadeIn =
          anime({
            targets : '.web__draggable',
            opacity : 1,
            duration: 3000
          });

        //spider rotate around web
        const rotate =
          anime.timeline({
            targets  : '.web__spider__wheel',
            loop     : true,
            direction: 'alternate'
          }).add({
            rotate  : -1350,
            duration: 25000,
            easing  : 'linear'


          }).add({
            begin   : a => {
              //extend to bottom
              anime.timeline({
                targets: '.web__thread',
                //   direction:'alternate',
                loop   : 1 //50000
              }).add({
                width   : 500,
                duration: 8000,
                easing  : 'easeOutQuad'
              }).add({
                scale   : 1,
                rotateY : 70,
                duration: 8000
              }).add({
                rotateY : 0,
                width   : 10,
                duration: 4000,
                easing  : 'easeOutQuad'
              });
            },
            scale   : 1,
            duration: 20000
          });

        //thread
        const thread =
          anime({
            targets  : '.web__thread',
            direction: 'alternate',
            loop     : 20, //50000
            width    : 150,
            duration : 2500
          });


        //spider wiggle
        const wiggle =
          anime({
            targets  : '.web__spider',
            direction: 'alternate',
            loop     : true, //50000
            rotateZ  : [
              {
                value   : 20,
                duration: 500
              },
              {
                value   : -20,
                duration: 500
              },
              {
                value   : -45,
                duration: 500
              },
              {
                value   : -25,
                duration: 500
              },
              {
                value   : 0,
                duration: 500
              }
            ],
            complete : a => {
              /*   anime.timeline({
                   targets  : '.web__spider',
                   direction: 'alternate',
                 }).add({
                   translateY: 500,
                   rotateY   : 80,
                   easing    : 'easeOutQuad',
                   duration  : 5000  //55000
                 }).add({
                   rotateZ : 360,
                   duration: 15000,
                   easing  : 'linear',
                   complete: a => {
                     wiggle.restart();
                     rotate.restart();
                     wiggle.play();
                     rotate.play();
                   }
                 });*/
            }
          });

        const cob =
          anime({
            targets: '.web__cob',
            scale  : [
              {
                value   : .7,
                duration: 12000
              },
              {
                value   : 1,
                duration: 32000
              },
              {
                value   : .8,
                duration: 4000
              },
              {
                value   : .9,
                duration: 52000
              }
            ],
            loop   : true
          });

        //all
        const all =
          anime({
            targets: '.web',
            opacity: [
              {
                value   : .7,
                duration: 10000
              },
              {
                value   : 0,
                duration: 10000
              },
              {
                value   : 0.1,
                duration: 20000
              },
              {
                value   : 0.4,
                duration: 10000
              }
            ],
            loop   : true
          });

        spiderAnimations.push(cob, all, wiggle, rotate);
      }, 5000);
    }

    //trigger spider stuff
    Nodes.spiderTrigger.addEventListener('click', function () {
      const web = document.querySelector('.web__draggable');

      if (this.classList.contains('controls__button--pressed')) {
        //was visible and on .... now turn off
        this.classList.remove('controls__button--pressed');

        web.classList.add('web__draggable--hide');

        spiderAnimations.forEach(a => {
          a.finished.then(() => {
            a.pause();
          })
        });
      } else {
        //turn on
        this.classList.add('controls__button--pressed');

        web.classList.remove('web__draggable--hide');
        if (!spiderAnimations.length) {
          spiderIntervalFn();
          return true;
        }

        let P = []
        spiderAnimations.forEach(a => {
          P.push(a.finished);
        });

        Promise.all(P).then(() => {
          spiderAnimations.forEach(() => {
            a.restart();
            a.play();
          });
        })
      }
    });

    Nodes.emojiPickerName = document.getElementsByClassName('emoji_preview-name')[0];
    //document.getElementsByClassName('emoji-picker__wrapper')[0];
    Nodes.pickerWrapper = document.getElementById('picker');
    App.myPicker = new pickerHelper(
      Nodes.pickerWrapper,
      Nodes.emojiPickerTrigger,
      Nodes.emojiPickerName,
      {
        emojisPerRow: 31,
        rows        : 5,
        style       : (Config.twemoji === 'false' ? 'native' : 'twemoji')
      });
    App.myPicker.addPlugin('stickyHandler');
    App.myPicker.addPlugin('closeHandler');
    //App.myPicker.launch();
    App.myPicker.registerCB('emoji', function (p) {
      const props = App.myPicker.getProps();
      if (props.options.makeEmojiSticky) {
        //click the pin button
        Nodes.stickyButton.click();
      }
    });
    /*******************/
    App.myPicker.registerCB('emoji', selection => {
      // reset animation on every new emoji
      App.Fn.injectSelection(selection);
      $('#' + selection.emoji).dblclick();
    });
    /*
         if (picker.options.makeEmojiSticky) {
              doHandlerOnHide = true;
            } else {
              //unset the temporary flag
              doHandlerOnHide = false
            }
            return;
          });


          picker.on('hidden', function () {
            if (doHandlerOnHide) {
              picker.options.stickyHandler['element'].trigger(picker.options.stickyHandler['event']);

*/
    Window.anime = anime;
    Window.App = App;
    Window.TimerCountDown = MeetingCountDown;
    Window.Trash = TrashCan;

    Window.PP = PP;
  }); //doc ready
} catch (e) {
  document.body.textContent = JSON.stringify(e);
}

if (module.hot) {
  module.hot.accept();
}
