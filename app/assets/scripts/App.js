import anime from "animejs";

const J$ = require("jquery").noConflict();
import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./modules/Favorites";
import A from './modules/Animation';
import Init from './modules/Init.js';
import Draw from 'draw-on-canvas';
import Log from './modules/Log.js';
import MouseActions from './modules/FollowMouse.js';
import ConfigViaCSS from './modules/ConfigViaCSS.js';

require("./modules/ArrayUpdates.js");
const cssConfig = new ConfigViaCSS(1); //1 for OBS
const Animation = A.Animation;
const IdlePath = A.RocketPath;
const MeetingCountDown = A.TimerCountDown;
const log = new Log(true);
var myMouseActions;

const myFavs = new Favorites();

console.log()
/*
http://10.0.0.10:3000/?defEmoji=%E2%98%95&defPoint=%E2%9C%8C%F0%9F%8F%BB&rocketSpeed=20000&idleTimeout=300000&rotation=false
 */


J$(document).ready(function ($) {
  var _x = cssConfig.getConfig();
  const Config = {};
  try {
    const urlParams = (new URL(window.location.href)).searchParams;
  /*  const Config = Object.assign((({
                      rocketspeedoffset,
                      defaultidleemoji,
                      defaultpointeremoji,
                      idletimeout,
                      idlerotation
                    }) => ({
          rocketspeedoffset,
          defaultidleemoji,
          defaultpointeremoji,
          idletimeout,
          idlerotation
        })
      )(Init)
    ,urlParams)*/


    Object.assign(Config, Init, (function (U) {
      let a = Init.urlParams;
      let o = {};
      U.searchParams.forEach((v, k) => o[a[a.indexOf(k)]] = v);
      return o;
    })(new URL(window.location.href)));
    //$('textarea').val( JSON.stringify(Config));
    //$('textarea').val(JSON.stringify(cssConfig.selectorList));
  } catch (e) {
     Object.assign(Config, Init);
  }
  //convert values
  Object.assign(Config, {
    linger :   (Config.linger === 'true'),
     idlerotation: (Config.idlerotation === 'true'),
      adjustment  : +(Config.idlespeedoffset)
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

  console.log('ready');


  const stickyButton = $('#stickybutton');
  const $picker = $('#picker');
  const picker = new EmojiButton({
    rootElement    : $picker[0],
    theme          : 'dark',
    rows           : 2,
    emojisPerRow   : 11,
    showRecents    : true,
    initialCategory: 'recents',
    showVariants   : true,
    /* position: {
       top: '100',
       left: '0'
     },*/
    position       : 'bottom-start',
    emojiSize      : '60px',
    showPreview    : false,
    recentsCount   : Init.historySize,
    zIndex         : 10000,
    plugins        : [Init.stickyHandler, Init.closeHandler], //
    stickyHandler  : {
      element: stickyButton,
      event  : 'click'
    }, //
    kwijibo        : 'did my property get set?'

  });

  const trigger = document.querySelector('.trigger');
  var $highlight = [];
  const $target = $('#emoji');
  const $pin = $('#pin');
  const myAnimation = new Animation($target, $pin);

  const emojiWrapperAnimation = new Animation($('.targetWrapper__emoji'));
  const $afk = $('.AFK');
  const $emojipreview = $('#emojipreview');

  const $history = $('#history');
  const $moveHistory = $('#moveHistory');
  const $hideButton = $('#hideEmoji');
  const trashButton = document.getElementById('trashEmoji');
  const $drawing = $('#drawing').hide();
  const $drawingTarget = $('#drawingPane');
  const $drawButton = $('button.draw');
  const $drawButton2 = $('button.nogrid');
  const $Grid = $('#Grid');
  $Grid.find('.grid').css('min-height', Init.visibleHeight + 'px');
  const Drawing = new Draw($drawingTarget[0], window.innerWidth, Init.visibleHeight, Init.canvas);

  $drawing.on('click', 'button', function () {
    let $this = $(this);

    if ($this.hasClass('reset')) {
      return Drawing.reset();
    } else if ($this.hasClass('stop')) {
      $drawButton.click();
      return;
    } else if ($this.hasClass('nogrid')) {
      $('#Grid').toggle();
      $this.toggleClass('pressed');
      return;
    }
    //change color
    $drawing.find('.pens').removeClass('pressed');
    $this.addClass('pressed');
    if ($this.hasClass('redDraw')) {
      Drawing.strokeColor = 'red';
    } else if ($this.hasClass('orangeDraw')) {
      Drawing.strokeColor = 'orange';
    } else if ($this.hasClass('blueDraw')) {
      Drawing.strokeColor = 'blue';
    } else if ($this.hasClass('greenDraw')) {
      Drawing.strokeColor = 'green';
    } else if ($this.hasClass('purpleDraw')) {
      Drawing.strokeColor = 'purple';
    }
  });

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

  //  let fontSize = +($M.css('-size').match(/\d*/)[0]);
    //$M.width < $drawingTarget.width &&

    while (
      // if message target is too big
    ($M.height() /  $('#chromaKey').height() ) > .95
      ) {
      Math.min(Math.max(12, --fontSize), 90);
      $M.css('font-size', fontSize);
   //   ratio = $('#chromaKey').height() / $M.height();

    }
    //  ratio =    $('#chromaKey').width() /  $M.width() ;
    //fontSize *= ratio ;


    /*
    if ($M.height() < $('#chromaKey').height()) {
      //scale back up
       while ( $M.height() < $('#chromaKey').height() && fontSize<90) {
        fontSize++;
        //have to update the fontsize here so that the $M.width can be re-evaulated for the loop condition
        $M.css('font-size', fontSize);
      }
       fontSize = 90;
       $M.css('font-size', fontSize);
    } else {

      while ( $M.height() > $('#chromaKey').height() ) {
        fontSize--;
        //have to update the fontsize here so that the $M.width can be re-evaulated for the loop condition
        $M.css('font-size', fontSize);
      }
    }*/

    return true;
  });

  $drawButton.on('click', () => {
    if ($drawing.is(':hidden')) {
      $drawing.show();
      $drawButton.addClass('pressed');
      //$('#Grid').show();
    } else {
      $drawing.hide();
      $drawButton.removeClass('pressed');
      $('#Grid').hide();
    }
  });

  $('#MessageWrapper').on('click', function () {
    /* refresh the animation when the message area is clicked
    Assumption here is that someone is only clicking on the message area when:
    - drawing canvas is hidden
    - ### thus they want to drag the emoji ###
     */
    var fav = myFavs.recallFave($target.text());
    if (fav) {
      if (fav.sticky) {
        myAnimation.removeAnimation();
      } else {
        myAnimation.restartAnimation();
      }
    }
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
      $('button.AFK').removeClass('pressed');
    });

    if (doShow) {
      randomId = '#afk' + (Math.floor(Math.random() * 1000) % 3 + 1);
      let $this = $(randomId);
      //store the previous element on the afk button object
      $afk.data('beforeAfk', myFavs.recallFave().emoji);
      $('#' + '💤').click();
      $this.removeClass('afkImages--hide');
      // stickyButton.click();
      $('button.AFK').addClass('pressed');
    }

    ev.preventDefault();
    return false;
  });

  $hideButton.on('click', function () {
    //archiveFave();
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
  trashButton.addEventListener('click', function (ev) {
    //emojis get crumpled into a trashBall and thrown into a trashCan

    // whether in the gallery or in history the candidate is always with highlight class
    const emoji = document.querySelector('.highlight');
    if (emoji) {
      const inGallery = emoji.classList.contains('history--draggable');
      const candidate = emoji.parentElement;
      const trashCan = document.querySelector('.trashCan');
      const trashBall = document.createElement('div');
      const trashBallHide = document.querySelector('.trashCan__ball2');
      trashBall.classList.add('trashCan__ball');

      //make the trashCan slide on the screen.
      let canMovesX = 200;

      const canAnimePt2 = {
        translateX: canMovesX,
        duration  : 1500,
        easing    : 'easeInQuint'
      };
      const canAnime = anime.timeline().add({
        targets: '.trashCan__hand',
        rotate : [0, 90],
        begin  : a => {
          trashBallHide.classList.add('trashCan__ball2--hide');
        }
      }).add(
        Object.assign({
          targets: trashCan
        }, canAnimePt2)
      );

      canAnime.finished.then(() => {


          //remove any current animations
          anime(candidate).remove('*');

          //make a different emoji active so we can delete the candidate
          let deletePosition = myFavs.position;

          //before delete
          document.getElementById('scrollDown').click();

          trashBall.classList.add('history--draggable');
          //remove candidate from the current position in dom hiearchy
          //promote it to an element at (0,0)
          // document.body.append(trashBall);

          //store where the current element is
          // calculate the difference from start location to final-trash-location
          const startXY = {};
          const diffXY = {};
          (({top, left, height, width}, {top: endT, left: endL}) => {
            Object.assign(startXY, {
              top   : top,
              left  : left,
              height: height,
              width : width
            });
            Object.assign(diffXY, {
              top : (endT) - top, //TODO: consider trashCan translateX ?
              left: endL - left
            });
          })(emoji.getBoundingClientRect(), trashCan.getBoundingClientRect())

          trashBall.append(emoji);
          document.body.append(trashBall);
          //size the container before remove candidate
          //make the candidate appear like it has not moved
          anime.set(trashBall,
            Object.assign({}, startXY)
          );


          if (candidate.classList.contains('history--draggable')) {
            //TODO: not sure if this is a different case
          } else {

            //prevent the history list from collapsing
            //TODO:prevent the history list from collapsing

            trashBall.classList.add('history--draggable');
          }

          //track the other elements related to candidate ( for later removal)
          let draggableClasses = [...(candidate.classList)].filter(c => /draggable\d/.test(c));

          //JSON.parse(JSON.stringify(candidate.getBoundingClientRect())));

          let arcTop = diffXY.top - 500;

          const Xfudge = inGallery ? 0 : 30;
          const Yfudge = inGallery ? -150 : -80;

          //animate the emoji into a trashball
          const ballFlight = anime({
              targets   : trashBall, // document.querySelector('.highlight'),
              translateY: [
                {
                  value   : arcTop,
                  duration: 1000,
                  easing  : 'easeOutQuad'
                },
                {
                  value   : diffXY.top + Yfudge,
                  duration: 800,
                  easing  : 'easeInQuad'
                },
                {

                  value   : diffXY.top +Yfudge +20,
                  duration: 200,
                  easing  : 'linear'

                }
              ],
              translateX: [
                {
                  value   : diffXY.left + Xfudge,
                  duration: 1800,
                  easing  : 'linear'
                }
              ],
              scale     : [
                {
                  value   : 1,
                  duration: 1000
                },
                {
                  value   : .5,
                  duration: 1000,
                  easing  : 'linear'
                }
              ],
              begin     : a => {
                //spin emoji inside the ball
                anime({
                  targets: emoji,
                  rotate : [{
                    value   : 90,
                    duration: 1000,
                    easing  : 'easeInQuad'
                  },
                    {
                      value   : 720,
                      duration: 1000,
                      easing  : 'linear'
                    }]
                })
              },
              update    : a => {
                //ball-up/crumple in the last half of the flight
                let olda = emoji.textContent;
                if (a.progress > 95) {
                  emoji.textContent = olda;
                } else if (a.progress > 50) {
                  emoji.textContent = '🏐'
                }
              }
            })
          ;

          ballFlight.finished.then(() => {
            //delete emoji animations
            ballFlight.remove('*');
            //delete emoji objects
            console.log('completed... would be removed');
            // myFavs.trashFave(deletePosition);

            //delete emoji and candidate elements
            draggableClasses.forEach(draggables => {
              [...document.getElementsByClassName(draggables)].forEach(el => el.remove());
            });

            //remove the real ball
            trashBall.remove();
            //replace it with a fake one that is in the can
            trashBallHide.classList.remove('trashCan__ball2--hide');
            //slide trashcan out of view
            canAnime.reverse();
            canAnime.play();
            canAnime.finished.then(() => {
              //slide ball with trashCan
              trashBallHide.classList.add('trashCan__ball2--hide');
            })
          });
        }
      );
    }
  });

  stickyButton.on('click', function (ev) {
    //make the current emoji sticky
    var fav = myFavs.recallFave($target.text());
    if (fav) {
      fav.sticky = !fav.sticky;
      if (fav.sticky) {
        myAnimation.removeAnimation();
        stickyButton.addClass('pressed');

      } else {
        myAnimation.restartAnimation();
        stickyButton.removeClass('pressed');
      }
      highlightFave($target.text(), fav.sticky);
    }
    //ev.preventDefault();
    return false;
  });

  //
  const highlightFave = function (emoji, sticky = false) {
    emoji = emoji || $target.text();
    $('.highlight').removeClass('highlight');
    $highlight = $('#' + emoji).addClass('highlight');
    //if emoji is sticky then make it "pressed"
    if (sticky) {
      $('#' + emoji).addClass('pressed');
    } else {
      $('#' + emoji).removeClass('pressed');
    }

  } // highlightFave

  //put the emoji in the "dock"
  const archiveFave = function (sticky = false, emoji) {
    var firstClass = sticky ? 'history pressed history__btn' : 'history history__btn';
    $('.highlight').removeClass('highlight');
    $highlight = [];
    emoji = emoji || $target.text();
    //add unique entry to the history
    if ($('#' + emoji).length === 0) {
      $history.find('#letters')
        .prepend('<span class="letters"><button id="' + emoji + '" class="' + firstClass + '">' + emoji + '</button></span>');

    }
    //update size of icons
    var histCt = $('.history').length;
    var size = (675 / 25) + 5;
    if (histCt < 14) {
      size = Math.max(size, 80);
    }
    $('.history').css('font-size', size + 'px');
  } //archiveFave

  //add to the emojiPicker cache
  const populateDock = function () {

    let myA = myFavs.getStash();
    for (var i = (myA.length - 1); i >= 0; i--) {
      let fave = myA[i];
      if (!fave) {
        continue;
      }
      if (i == 0) {
        if (fave.sticky) {
          myAnimation.removeAnimation();
        } else {
          myAnimation.addAnimation();
        }
        $target.text(fave.emoji);
      }
      archiveFave(!!fave.sticky, fave.emoji);
      //try to highlight in history
      highlightFave(fave.emoji, !!fave.sticky);
    }
  } //populateDock
  populateDock();

  //stickyButton.click(); //initialize sticky  for the last emoji

  const injectSelection = function (selection) {
    //a highlighted one means we have nothing to archive
    var fave = myFavs.stashIt(selection);

    myAnimation.addAnimation();
    if (fave.sticky) {
      myAnimation.removeAnimation();
      stickyButton.addClass('pressed');
    } else {
      stickyButton.removeClass('pressed');
    }
    $target.text(fave.emoji);
    archiveFave(fave.sticky, fave.emoji);
    //try to highlight in history
    highlightFave($target.text(), fave.sticky);
    return false;
  }
  /*******************/
  picker.on('emoji', selection => {
    // reset animation on every new emoji
    injectSelection(selection);
    $('#' + selection.emoji).dblclick();

  });

  var switchEmoji = function (direction, wrap = true) {
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
      stickyButton.addClass('pressed');
    } else {
      stickyButton.removeClass('pressed');
      myAnimation.restartAnimation();
    }
  } //switchEmoji
  switchEmoji.bump = 1; //we start at the top already

  $('.dragTemp').on('click', function () {
    //always put the last clicked last in gallery
    //$(this).appendTo('#gallery');
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
        let fave = myFavs.recallFave($this.text());
        let pin = $('<span class="dragTemp__pin history--draggable">📌</span>')
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
        let adjustment = {
            left: $this.width() / 2,
            top : $this.height() / 2
          }
        ; //same as animation scale
        //  let adjustment = $this.width() * 3; //same as animation scale

        //return it back to history via doubleclick on new draggable
        $temp.one('dblclick', function (ev) {
          //return back to history
          let emoji = $this.text();
          $temp.find('.dragTemp__pin').hide();
          //let randomClass = $temp.data('draggable').randomClass;
          //  let location = $temp.data('draggable').location;
          top = top - $temp[0].getBoundingClientRect().top;
          //   left = $temp[0].getBoundingClientRect().left - left;

          myAnimation.doTimeline(randomClass + 'To', 'stop');
          // myAnimation.doTimeline(randomClass + 'To', 'stop');
          myAnimation
            .timeline(randomClass + 'From', {loop: 1})
            .addToTimeline(randomClass + 'From', {
                targets : $this[0],//$this[0],
                scale   : [1, .1],
                opacity : [1, 0],
                duration: 2000,
                delay   : 0,
                easing  : "easeOutExpo",
                complete: function () {
                  //put it back in history at "front"
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
                complete : function(){
                   anime.remove( '.' + randomClass );
                }
              },
              'destroyIt'
            );


          /* from: https://tobiasahlin.com/moving-letters/#2 */

          //injectSelection(emoji);
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
                mouseupCB  : function (el) {
                  //resume the "linger" animation after mouseup
                  Config.linger && MouseActions.linger(el);
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
          .removeClass('history__btn')
          .prependTo($temp)
          .addClass('history--draggable');
        let randomY = Math.floor(400 * Math.random()) - 100;
        let randomX = Math.floor(800 * Math.random());

        myAnimation.timeline(randomClass + 'To', {loop: 1})
          .addToTimeline(randomClass + 'To', {
              targets   : $temp[0],
              scale     : 5,
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
  $history.on('click', 'button', function (ev) {
    let $this = $(this);
    let emoji = $this.text();
    //if it's draggable then click does nothing
    let to = setTimeout(function () {
        if (!$this.hasClass('history--draggable')) {
          $target.text(emoji);

          var fave = myFavs.stashIt(emoji, true);
          archiveFave(fave.sticky, emoji);
          highlightFave(emoji, fave.sticky);

          myAnimation.addAnimation();
          if (fave.sticky) {
            myAnimation.removeAnimation();
            stickyButton.addClass('pressed');
          } else {
            stickyButton.removeClass('pressed');
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
  });

  $('body').on('keydown', function (ev) {
    // let direction = 0;
    // let Halign = 0;
    //handle ESC key to toggle drawing drawing
    if ($('.emoji-picker__wrapper').is(':hidden') && ev.which === 27) {
      $drawButton.click();
    }

    // if emoji selector is being navigated then do nothing
    if ($('.emoji-picker__wrapper').is(':visible')) {
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

  $('#drawingPane').on('dblclick', function () {
    $drawButton.click();
  });

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

  trigger.addEventListener('click', (ev) => {
    ev.preventDefault();
    picker.togglePicker($('#col1b')[0]); //trigger);
    $('.emoji-picker__wrapper').css('margin-top', '100px')
      // $('.emoji-picker__container')
      .on('mouseover', 'button.emoji-picker__emoji', function () {
        $('#emojipreview > .emoji_preview-emoji').text($(this).text());
        $('.emoji_preview-name').text($(this).attr('title'))
      });

    return false;
  });

  /*
  *  whatever most recent emoji from the dock is in the gallery is what the emojipreview works on
  *
   */
  $('.emojipreview__pin').on('click', function () {
    //last item in the gallery is the most recent [because of implied z-index]
    $('#gallery').find('.dragTemp:last').each(function () {
      let $temp = $(this);
      let fave = myFavs.recallFave($temp.find('button').text());
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
    injectSelection({
      emoji: $emojipreview.find('.emoji_preview-emoji').text()
    })
    if ($(this).hasClass('sticky')) {
      stickyButton.click();
    }
  });


//when this button is toggled then the idle path animation can happen
  const $mouseFollowButton = $('.emojipreview__follow');
  $mouseFollowButton.data('pressed', $mouseFollowButton.hasClass('pressed') );
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
      el.style.left = (mouse.pageX - 20) + 'px';
      el.style.top = mouse.pageY + 'px';
    }
  );
  myMouseActions.makeFollow();


  $moveHistory.on('click', function () {
    //$('.history').hide();
    // if ($history.parent('#col1a').length > 0) {

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
    console.log('hi');
    let targetModifiers = [
      'messageTarget__pre--off',
      'messageTarget__pre--narrow',
      'messageTarget__pre--full',
      'messageTarget__pre--left',
      'messageTarget__pre--right',
      'messageTarget__pre--fullBottom',
      'messageTarget__pre--leftBottom',
      'messageTarget__pre--rightBottom'
    ];

    let buttonModifiers = [
      'pressed'
    ];
//⏯️↕️⏮️⏯️↕️↔️⏮️  ️⏬
    let buttonContents = ['⏏️', '↕️', '↔️',
      '↖️', '↗️', '⬇️', '↙️', '↘️'];
    //determine which index currently have.
    for (var i = 0; i < targetModifiers.length; i++) {
      let j = i;
      btn.classList.add('pressed');
      if ($ms.hasClass(targetModifiers[i])) {
        //remove the class
        $ms.removeClass(targetModifiers[i]);
        j = i + 1;
        if (j === targetModifiers.length) {
          //start over next loop
          j = 0;
          //also 0 ==> "off"
          btn.classList.remove('pressed');
        }
        //go to the next class
        $ms.addClass(targetModifiers[j]);
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

  const meetingCountDown = new MeetingCountDown(
    document.querySelector('.emojipreview__clock'),
    document.querySelector('.emojipreview__clocknum'),
    document.querySelector('.flexClock__steps'), //flexClock__steps
    {
      callbacks: [
        {
          times: [5,10],
          cb      : (minsLeft) => {
            let shadow = document.querySelector('.flexClock__shadow');
            let spotlight = document.querySelector('.flexClock__spotlight');
            if (!spotlight || !shadow) {
              return;
            }
            if(Config.clocklocation==='left'){
              shadow.classList.add('flexClock__shadow--left');
              spotlight.classList.add('flexClock__spotlight--left');
            }

            anime(shadow).remove();
            anime(spotlight).remove();

            anime.timeline({}).add({
              duration  : 3000,
              targets   : spotlight,
              scale     : [5, 1],
              translateY: 35,
              opacity   : (e) => {
                e.textContent = minsLeft;
                return 1;
              },
              easing    : 'easeOutBounce'
            }).add({
              duration: 10000,
              targets : spotlight,
              // scale: 1.2,
              opacity : 0,
              easing  : 'easeInBounce', //translateY : -50,
            }).add({
              targets   : spotlight,
              translateY: 0,
              complete  : a => {
                a.remove()
              }
            });

            anime.timeline({
              //
            }).add({
              targets   : shadow,
              opacity   : 1,
              duration  : 3000,
              scale     : [.1, 1],
              translateY: 0,
              easing    : 'easeOutBounce'
            }).add({
              duration: 10000,
              targets : shadow,
              opacity : 0,
              easing  : 'easeInBounce', // translateY : 50,
            }).add({
              targets   : shadow,
              translateY: 0,
              complete  : a => {
                a.remove()
              }
            });
          }
        },
        {
          times: [0], //essentially on expiry
          cb   : function (minsLeft) {
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
                      .addEventListener('click',oneClick);
                  }
                }
              ); //animation
          }
        }
      ]
    },
    //on
    function () {
      $('#flexClock').show();
      //reset classes

      //control left vs ride side
      if( Config.clocklocation==='left'){
        let classes = ['flexClock__slider', 'flexClock'];
        document.querySelector('.flexClock__slider')
          .classList.add('flexClock__slider--left');
        document.querySelector('.flexClock')
          .classList.add('flexClock--left');
        document.querySelector('.flexClock__slider__button')
          .classList.add('flexClock__slider__button--left');
      }
      //restart countdown
    },
    //off
    function () {
      anime({
        targets  : '.flexClock__sub--A .flexClock__step',
        translateY: 0,
        duration : anime.stagger(100, {direction : 'reverse'}),
        complete : ()=>{
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
    });


  /**************/
  Window.anime = anime;
  Window.mTimer = A.TimerCountDown;

  $drawButton.click(); // default

  $history.find('.highlight').click();

})
;

if (module.hot) {
  module.hot.accept();
}
