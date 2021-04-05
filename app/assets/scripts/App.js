const $ = require("jquery");
import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./modules/Favorites";
import Animation from './modules/Animation';
import Init from './modules/Init.js';
import Draw from 'draw-on-canvas';

Array.prototype.unique = function (property) {
  var a = this.concat();
  if (typeof property !== 'undefined') {
    for (var i = 0; i < a.length; ++i) {
      for (var j = i + 1; j < a.length; ++j) {
        if (a[i][property] === a[j][property])
          a.splice(j--, 1);
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


const myFavs = new Favorites();
const myAnimation = new Animation();

$(document).ready(function () {
    const stickyButton = $('#stickybutton');
    const picker = new EmojiButton({
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
      recentsCount   : 50,
      zIndex         : 10000,
      plugins        : [Init.setDefaults()], //
      stickyHandler  : {
        element: stickyButton,
        event  : 'click'
      }, //
      kwijibo        : 'did my property get set?'

    });


    const trigger = document.querySelector('.trigger');
    var $highlight = [];
    const target = $('#target');
//$target.fadeOut(40000);//default
    const $outer = $('.outer');
    const $afk = $('.AFK');
    const $emojipreview = $('#emojipreview');
    const $history = $('#history');
    const $moveHistory = $('#moveHistory');
    const $hideButton = $('#hideEmoji');
    myAnimation.init(target);
    const $drawing = $('#drawing').hide();
    const $drawButton = $('button.draw');
    const $drawButton2 = $('button.nogrid');
    const $Grid = $('#Grid');
    $Grid.find('.grid').css('min-height', Init.visibleHeight + 'px');
    const Drawing = new Draw($drawing.find('#drawingPane')[0], window.innerWidth, Init.visibleHeight, Init.canvas);
    var emojiCache = JSON.parse(localStorage.getItem('emojiPicker.recent'));

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

    $('#MessageSource').on('keyup click', 'form', function (ev) {
      if (ev.type === 'keyup') {
        $('#MessageTarget').text($('#Message').val());
      } else {
        $('#MessageTarget').text('');
      }
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

    $afk.on('click', function (ev) {
      var randomId, $this;
      var doShow = true;
      $('#afkImages').find('div:visible').each(function () {
        doShow = false;
        $this = $(this);
        $this.hide();
        $('#' + '✌🏻').click();
        $('button.AFK').removeClass('pressed');
      });

      if (doShow) {
        randomId = '#afk' + (Math.floor(Math.random() * 1000) % 3 + 1);
        let $this = $(randomId);
        $this.show();
        $('#' + '💤').click();
        // stickyButton.click();
        $('button.AFK').addClass('pressed');
      }

      ev.preventDefault();
      return false;
    });

    $hideButton.on('click', function () {
      //archiveFave();
      var fav = myFavs.recallFave(target.text());
      myAnimation.toggleHide(fav.sticky);
      $hideButton.toggleClass('pressed');
    })

    stickyButton.on('click', function (ev) {
      //make the current emoji sticky
      var fav = myFavs.recallFave(target.text());
      if (fav) {
        fav.sticky = !fav.sticky;
        if (fav.sticky) {
          myAnimation.removeAnimation();
          stickyButton.addClass('pressed');

        } else {
          myAnimation.restartAnimation();
          stickyButton.removeClass('pressed');
        }
        highlightFave(target.text(), fav.sticky);
      }
      //ev.preventDefault();
      return false;
    });

    //
    const highlightFave = function (emoji, sticky = false) {
      emoji = emoji || target.text();
      $('.highlight').removeClass('highlight');
      $highlight = $('#' + emoji).addClass('highlight');
      //if emoji is sticky then make it "pressed"
      if (sticky) {
        $('#' + emoji).addClass('pressed');
      } else {
        $('#' + emoji).removeClass('pressed');
      }

    }
    const archiveFave = function (sticky = false, emoji) {
      var firstClass = sticky ? 'history pressed' : 'history';
      $('.highlight').removeClass('highlight');
      $highlight = [];
      emoji = emoji || target.text();
      //add unique entry to the history
      if ($('#' + emoji).length === 0) {
        $history
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

    /**********************/
    Init.init.forEach(function (emoji, i, a) {


      var fave = myFavs.stashIt(emoji);
      fave.sticky = !!(Init.stickyInit[fave.emoji]);
      let name = fave.name || emoji;

      //put our emojis into a nice format
      a[i] = {
        emoji: emoji,
        name : 'myInit' + i,
        key  : name
      };

      if ((i + 1) === Init.init.length) {
        if (fave.sticky) {
          myAnimation.removeAnimation();
        } else {
          myAnimation.addAnimation();
        }
        target.text(emoji);
      }

      archiveFave(fave.sticky, emoji);
      //try to highlight in history
      highlightFave(target.text(), fave.sticky);
    }); // init for each

    //add to the emojiPicker cache
    if (emojiCache.length) {
      var newArray = Init.init.concat(emojiCache).unique('emoji').slice(0, 50);

      localStorage.setItem(
        "emojiPicker.recent",
        JSON.stringify(newArray)
      );
    }

    //stickyButton.click(); //initialize sticky  for the last emoji

    const injectSelection = function (selection) {
      //a highlighted one means we have nothing to archive


      var fave = myFavs.stashIt(selection.emoji);

      myAnimation.addAnimation();
      if (fave.sticky) {
        myAnimation.removeAnimation();
        stickyButton.addClass('pressed');
      } else {
         stickyButton.removeClass('pressed');
      }


      target.text(selection.emoji);

      archiveFave(fave.sticky, selection.emoji);
      //try to highlight in history
      highlightFave(target.text(), fave.sticky);

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
      console.log(lastFave, myFavs.position, myFavs.nameIndex.length, switchEmoji.bump, direction);
      //archive the current one
      target.text(lastFave.emoji);
      //if target text already equals the
      //lookup the emoji in the history for highlighting
      highlightFave(target.text(), lastFave.sticky);
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

    $history.on('click', 'button', function (ev) {
      target.text($(this).text());

      var fave = myFavs.stashIt(target.text(), false);
      archiveFave(fave.sticky, target.text());
      highlightFave(target.text(), fave.sticky);

      myAnimation.addAnimation();
      if (fave.sticky) {
        myAnimation.removeAnimation();
        stickyButton.addClass('pressed');
      } else {
        stickyButton.removeClass('pressed');
      }

    });

    $('body').on('keydown', function (ev) {
      // let direction = 0;
      // let Halign = 0;
      if ($drawing.is(':visible')) {
        if (ev.which === 27) {
          $drawButton.click();
        }
      }

      if ($('.emoji-picker__wrapper').is(':visible')) {
        //only move the emoji when the picker is hidden
        return;
      }
      const o = {};
      switch (ev.which) {
        case 38:
          o.top = -10
          break;
        case 40:
          o.top = 10
          break;
        case 37: //left
          o.left = -10;
          break;
        case 39:
          o.left = +10;
          break;
      }
      for (var direction in o) {
        let curMargin = $('.wrapper').css('margin-' + direction);
        let newMargin;
        newMargin = (curMargin.match(/.?\d*/)[0] * 1 + o[direction]) + 'px';
        $('.wrapper').css('margin-' + direction, newMargin);
      }

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
    if ($history.parent('#col1a').length > 0) {

      $history.appendTo($('#letters'));
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
        targets : '.ml1 .line',
        scaleX  : [0, 1],
        opacity : [0.5, 1],
        easing  : "easeOutExpo",
        duration: 700,
        offset  : '-=875',
        delay   : (el, i, l) => 80 * (l - i)
      }).add({
        targets : '.ml1 .line',
        opacity : 0,
        duration: 1000,
        easing  : "easeOutExpo",
        delay   : 1000
      });
    }else{
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
    }
  }); //moveHistory

    $drawButton.click(); // default
    $moveHistory.click();
    $history.find('.highlight').click();


  }
)
;

if (module.hot) {
  module.hot.accept();
}