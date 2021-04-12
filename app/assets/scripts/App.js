const J$ = require("jquery").noConflict();
import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./modules/Favorites";
import Animation from './modules/Animation';
import Init from './modules/Init.js';
import Draw from 'draw-on-canvas';
import Log from './modules/Log.js';
import FollowMouse from './modules/FollowMouse.js';

const log = new Log(true);

Array.prototype.unique = function (property = false, firstWins = true) {
  var a = this.concat();
  if (!!property) {
    if (firstWins) {


      for (var i = 0; i < a.length; ++i) {
        a[i].position = i;
        for (var j = i + 1; j < a.length; ++j) {
          if (a[i][property] === a[j][property])
            a.splice(j--, 1) //: a.splice(--j, 1))
        }
      }
    } else {
      for (var i = a.length - 1; i >= 0; --i) {
        a[i].position = i;
        for (var j = i - 1; j >= 0; --j) {
          if (a[i][property] === a[j][property])
            a.splice(j--, 1);
        }
      }
    }
  } else {
    if (firstWins) {
      for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
          if (a[i] === a[j])
            a.splice(j--, 1);
        }
      }
    } else {
      for (var i = a.length - 1; i >= 0; --i) {
        for (var j = i - 1; j >= 0; --j) {
          if (a[i] === a[j])
            a.splice(j--, 1);
        }
      }
    }
  }
  return a;
} // unique

Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};


const myFavs = new Favorites();


J$(document).ready(function ($) {
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
    const dragEmoji = new FollowMouse($, '.targetWrapper__emoji', '#MessageWrapper');
    dragEmoji.makeDraggable({
      left: emojiWrapperAnimation.$el.width() / 2,
      top : emojiWrapperAnimation.$el.width() / 2
    });

//$target.fadeOut(40000);//default
    //const $outer = $('.outer');
    const $afk = $('.AFK');
    const $emojipreview = $('#emojipreview');

    const $history = $('#history');
    const $moveHistory = $('#moveHistory');
    const $hideButton = $('#hideEmoji');
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
      } else if ($reset.attr('type') === 'reset' || $M.val() ==='') {
        $M.text('');
        $('#Message').text('');
        $M.css('font-size', ''); //celar font size
        // return true;
      }
      //check if the element is wider or higher than the panel on the screen
      //if it is then diminish the font until it is 20px

      var fontSize = $M.css('font-size').match(/\d*/)[0]++;
      while (($M.width() > $('#chromKey').width() || $M.height() > $('#chromaKey').height()) &&
      fontSize > 20  ){
        fontSize--;
        $M.css('font-size', fontSize);
      }

      //restore font
      if($M.width < $drawingTarget.width && $M.height < $drawingTarget.height){
        $M.css('font-size', '90px');
      }
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

    $('#MessageWrapper').on('click', function(){
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
        $this.hide();
        //$('#' + '✌🏻').click();
        $('button.AFK').removeClass('pressed');
      });

      if (doShow) {
        randomId = '#afk' + (Math.floor(Math.random() * 1000) % 3 + 1);
        let $this = $(randomId);
        //store the previous element on the afk button object
        $afk.data('beforeAfk', myFavs.recallFave().emoji);
        $('#' + '💤').click();
        $this.show();
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
      return injectSelection(selection);
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
            pin.show();
          }
          myFavs.promoteFave(fave);

          //$temp.append('<span class="dragTemp__closer">x</span>');
          let $origin = $this
            .closest('span').addClass(randomClass);

          /* reprioritize */
          //change the origin location to be the first entry in the dock
          $origin.prependTo('#letters');

          let adjustment = $this.width() * 3; //same as animation scale

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
                    $this
                      //    .css(location)
                      //.remove();
                      //put it back in history in same spot
                      .appendTo($origin)
                      .removeClass('history--draggable')
                      .addClass('history__btn');
                    $temp.removeData('draggable').remove();
                    //    myAnimation
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
                }, true
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
                Draggable  : (new FollowMouse($, $temp, $temp))
                  .makeDraggable({
                    top      : adjustment,
                    left     : adjustment,
                    mousedown: function () {
                      $temp.appendTo('#gallery');
                    }
                  })
              }
            )
            //           .appendTo('body')
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
          let randomX = Math.floor(1000 * Math.random());

          console.log(randomX, randomY);
          myAnimation.timeline(randomClass + 'To', {loop: 1})
            .addToTimeline(randomClass + 'To', {
              targets   : $temp[0],
              scale     : [1, 5],
              opacity   : [.5, 1],
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
              delay     : 200 //(el, i) => 70 * i
            });
          myAnimation.timeline(randomClass + 'Fade', {}) //loop?
            .addToTimeline(randomClass + 'Fade', {
              targets : $temp[0],// 'span.' + randomClass,
              opacity : [1, 0],
              duration: 40000,
              delay   : 1000,
              easing  : 'linear',
              complete: function () {
                if ($temp.hasClass('history--draggable')) {
                  if (!$temp.css('opacity')) {
                    $temp.trigger('dblclick')
                  }
                }
              }
            });
          if (fave.sticky) {          //fade it
            myAnimation.doTimeline(randomClass + 'Fade', 'pause');
          }
          //.doTimeline(randomClass,'play'); /* from: https://tobiasahlin.com/moving-letters/#2 */

          //    $temp.appendTo('#gallery')
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
      }, 500);
    });

    $('body').on('keydown', function (ev) {
      // let direction = 0;
      // let Halign = 0;
      //handle ESC key to toggle drawing drawing
      if( $('.emoji-picker__wrapper').is(':hidden') && ev.which === 27) {
        $drawButton.click();
      }

      // if emoji selector is being navigated then do nothing
      if ($('.emoji-picker__wrapper').is(':visible')) {
        //only move the emoji when the picker is hidden
        return;
      }

      //lastly, move emoji with arrow key controls
      if (ev.which >= 37 && ev.which <= 40)
        emojiWrapperAnimation.moveTarget(ev.which); //
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
    $emojipreview.on('click', 'button', function () {

      //last item in the gallery is the most recent [because of implied z-index]
      $('#gallery').find('.dragTemp:last').each(function () {
        let $temp = $(this);
        let fave = myFavs.recallFave($temp.find('button').text());
        let randomClass = $temp.data('draggable').randomClass;
        if (fave && fave.sticky) //if they are sticky then remove that and start the fade
        {
          $temp.find('.dragTemp__pin').hide();

          fave.sticky = false;
          myAnimation.doTimeline(randomClass + 'Fade', 'reverse');

        } else //else //reverse the fade
        {
          myAnimation.doTimeline(randomClass + 'Fade', 'reverse');
          //make them sticky
          fave.sticky = true;
          $temp.find('.dragTemp__pin').show();
        }

      });
      return;

      injectSelection({
        emoji: $emojipreview.find('.emoji_preview-emoji').text()
      })
      if ($(this).hasClass('sticky')) {
        stickyButton.click();
      }
    });

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
            i = i + (Math.random()*600)
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
      /*  }else{
            $history.appendTo($('#col1a'));
          myAnimation.anime.timeline({loop : 1})
            .add({
              targets   : '#history .history',
              scale     : [0.3, 1],
              opacity   : [0, 1],
              translateZ: 0,
              easing    : "easeOutExpo",
              duration  : 600,
              delay     : (el, i) => 70 * (i + 1)
            })
        }*/
    }); //moveHistory

    $('.messageSource__changeW').on('click', function () {
      let $ms = $('.messageTarget__pre');
      if ($ms.css('margin-left')[0] === '0') {
        $ms.css('margin-left', '20%');
        $ms.css('width', '60%');
        $('.messageSource__changeW').addClass('pressed');
      } else {
        $ms.css('margin-left', 0);
        $ms.css('width', '100%');
        $('.messageSource__changeW').removeClass('pressed');
      }
      return false;
    });

    $('#PageHelp > .pageHelp__button').on('click', function (ev) {
      let help = `
      ✍🏻 : Toggle Draw menu.
      🧽 : wipe drawing or text
      📉 : toggle grid assist for drawing
      🟥 : change color of pen
      📌 : toggle sticky of the current emoji (and remember this setting)
      📌*:toggle sticky of current undocked emoji
      ↩ : change width of text area (cuz teams cutting the screen)
      ◀️▶️ : scroll recents in order of their use
      ⛔ : toggle hide of the emoji
      💤 : bring up AFK screen
      🔎 : search for a new emoji
      📜 : splash screen if all secondary emojis are docked| else dock all emojis
      
      Keys:
      - Esc => toggle drawing   (when emoji picker is not visible)
      - Esc => close emoji picker (when emoji picker is visible)
      - Arrows => move the primary emoji around
      
      Mouse: 
      - double-click on any history emoji => toggle BIG|dock mode
      - double-click => or toggle drawing
      - click => any alt emoji becomes the focused secondary
      - click+drag => drag ANY BIG emoji
      - click+drag => draw on canvas when visible
      v1.2
      `;
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

    $('.messageSource__changeW').click(); //skinny by default
    $drawButton.click(); // default
    //  $moveHistory.click();
    $history.find('.highlight').click();


    //mouse animation when idle
    try {
      const followMouse = new FollowMouse(J$, '#fakeMouse>button');
      followMouse.initImpatientAction(myAnimation.anime, '#mousePath', '#fakeMouse');
      followMouse.startTracking();
    } catch (e) {
      console.log(e);
    }
  }
)
;

if (module.hot) {
  module.hot.accept();
}