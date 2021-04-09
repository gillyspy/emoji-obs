const J$ = require("jquery").noConflict();
import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./modules/Favorites";
import Animation from './modules/Animation';
import Init from './modules/Init.js';
import Draw from 'draw-on-canvas';
import Log from './modules/Log.js';
import FollowMouse from './modules/FollowMouse.js';

const log = new Log(true);

Array.prototype.unique = function (property, firstWins = true) {
  var a = this.concat();
  if (typeof property !== 'undefined') {
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
    for (var i = 0; i < a.length; ++i) {
      for (var j = i + 1; j < a.length; ++j) {
        if (a[i] === a[j])
          a.splice(j--, 1);
      }
    }
  }
  return a;
} // unique

const followMouse = new FollowMouse(J$, '#fakeMouse>button');
const myFavs = new Favorites();


J$(document).ready(function ($) {
    console.log('ready');
    followMouse.startTracking();
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
    dragEmoji.makeDraggable();

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
      } else if ($reset.attr('type') === 'reset') {
        $M.text('');
        $('#Message').text('');
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
      $hideButton.toggleClass('pressed');
      if($hideButton.hasClass('pressed')){
        $('.history--draggable').addClass('history--hidden');
      } else {
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
      var firstClass = sticky ? 'history pressed' : 'history';
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
      var size = (675 / 50) + 5;
      if (histCt < 14) {
        size = Math.max(size, 50);
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
      if (typeof switchEmoji.bump === 'undefined') {
        switchEmoji.bump = 0;
      }
      var lastFave = myFavs.recallIt(direction);

      //get last history emoji and compare
      if (lastFave.position === 0) {
        switchEmoji.bump++;
      } else if (lastFave.position === myFavs.nameIndex.length - 1) {
        switchEmoji.bump++;
      } else {
        switchEmoji.bump = 0;
      }
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
        if (switchEmoji.bump < 2) {
          myAnimation.restartAnimation();
        }
      }
      if (switchEmoji.bump > 1 && direction > 0 && wrap) {
        direction = myFavs.nameIndex.length - 1;
        switchEmoji.bump = 0;
        switchEmoji(direction, false);
      } else if (switchEmoji.bump > 1 && direction < 0 && wrap) {
        direction = 0;
        switchEmoji.bump = 0;
        switchEmoji(direction, false);
      }
    } //switchEmoji
    switchEmoji.bump = 1; //we start at the top already

    $history.on('dblclick', 'button', function (ev) {
        let $this = $(this);
        $this.data('dblclick', true);

        if (!$this.data('draggable')) {
          var top = $this[0].getBoundingClientRect().top
          var left = $this[0].getBoundingClientRect().left
          let randomClass = 'draggable' + Math.floor(Math.random() * 1000);
          let $temp = $('<span class="randomClass dragTemp"></span>');
          //$temp.append('<span class="dragTemp__closer">x</span>');
          let $origin = $this
            .closest('span').addClass(randomClass)

          //temporary variable to enclose it
          $temp
            .data('draggable', {
                location   : {
                  top : $this[0].getBoundingClientRect().top,
                  left: $this[0].getBoundingClientRect().left
                },
                randomClass: randomClass,  //cache its source location
                Draggable  : (new FollowMouse($, $temp, $temp)).makeDraggable({top:80,left:80})
              }
            )
            .prependTo('body')
            .css({
                left: left,
                top : top
              }
            )
            .addClass('history--draggable')
            .addClass(randomClass);

          //return it back to history via doubleclick on new draggable
          $temp.one('dblclick', function (ev) {
            //return back to history
            let emoji = $this.text();
            let $temp = $this.closest('span');
            let randomClass = $temp.data('draggable').randomClass;
          //  let location = $temp.data('draggable').location;
            top = $this[0].getBoundingClientRect().top - top ;
            left = $this[0].getBoundingClientRect().left - left;

            myAnimation.anime.timeline({loop: 1}).add({
              targets   : '#' + emoji,
              scale     : [20, 1],
              opacity   : [1, .5],
            /*   translateY: top,
              translateX: left, */
              easing    : "easeOutExpo",
              duration  : 1950,
              delay     : 0 //(el, i) => 70 * i
            }); /* from: https://tobiasahlin.com/moving-letters/#2 */
            //remove it from the page
            $this
          //    .css(location)
              //.remove();
              //put it back in history in same spot
              .appendTo($origin)
              .removeClass('history--draggable');

            $temp.removeData('draggable').remove();
            //injectSelection(emoji);
            return false;
          });
          $this.addClass(randomClass)
            .prependTo($temp)
            .addClass('history--draggable');

          myAnimation
            .anime.timeline({loop: 1}).add({
            targets   : 'span.' + randomClass,
            scale     : [1, 5],
            opacity   : 1,
            translateZ: 0,
            translateY: -10,
            easing    : "easeOutExpo",
            duration  : 950,
            delay     : 200 //(el, i) => 70 * i
          }); /* from: https://tobiasahlin.com/moving-letters/#2 */

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
      switchEmoji(1);
      ev.preventDefault();
      return false;
      // $target.show().fadeIn(1000);
    });
    $('#scrollDown').on('click', (ev) => {
      //  var direction = ev.shiftKey ? 1 : -1;
      switchEmoji(-1);
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
//
    $emojipreview.on('click', 'button', function () {

      injectSelection({
        emoji: $emojipreview.find('.emoji_preview-emoji').text()
      })
      if ($(this).hasClass('sticky')) {
        stickyButton.click();
      }
    });

  $moveHistory.on('click', function(){
    //$('.history').hide();
   // if ($history.parent('#col1a').length > 0) {

    //send all the floating big history back home
    $('.history--draggable')
      .removeClass('history--hidden')
      .trigger('dblclick');

     // $history.appendTo($('#letters'));
      myAnimation.anime.timeline({loop: 1})
        .add({
          targets   : '#history .history',
          scale     : [0.3, 1],
          opacity   : [0, 1],
          translateZ: 0,
          easing    : "easeOutExpo",
          duration  : 600,
          delay     : (el, i) => 70 * (i + 1)
        })
        .add({
        targets : '.text-wrapper .line',
        scaleX  : [0, 1],
        opacity : [0.5, 1],
        easing  : "easeOutExpo",
        duration: 700,
        offset  : '-=700',
        delay   : (el, i, l) => 80 * (l - i)
      }).add({
        targets : '.text-wrapper .line',
        opacity : 0,
        duration: 1000,
        easing  : "easeOutExpo",
        delay   : 1000
      });
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
      if($ms.css('margin-left')[0] === '0'){
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
      ↩ : change width of text area (cuz teams cutting the screen)
      ◀️▶️ : scroll recents in order of their use
      ⛔ : toggle hide of the emoji
      💤 : bring up AFK screen
      🔎 : search for a new emoji
      
      Keys:
      - Esc => toggle drawing   (when emoji picker is not visible)
      - Esc => close emoji picker (when emoji picker is visible)
      - Arrows => move the emoji around
      
      Mouse: 
      - double-click on history emoji => toggle BIG mode
      - double-click => or toggle drawing
      - click+drag => drag ANY BIG emoji
      - click+drag => draw on canvas when visible
      v1.1
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


  }
)
;

if (module.hot) {
  module.hot.accept();
}