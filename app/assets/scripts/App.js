const $ = require("jquery");
import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./Favorites";
import Animation from './Animation';


const picker = new EmojiButton();
const myFavs = new Favorites();
const myAnimation = new Animation();
$(document).ready(function () {
  const trigger = document.querySelector('.trigger');
  var $highlight = [];
  const target = $('#target');
//$target.fadeOut(40000);//default
  const stickyButton = $('#stickybutton');
  const $outer = $('.outer');
  const $afk = $('.AFK');
  const $emojipreview = $('#emojipreview');
  myAnimation.init(target);

  Window.TEST = $;

  const init = ['💩', '🔇', '🏳️', '👍🏻', '🔥', '✅', '❌', '👂🏻', '🧠',
    '🐧', '🦈', '☁️','⛈️', '🌮', '🎧', '🔋', '🛠️',
    '🧲', '📅', '🛏️', '💤', '⁉️', '‍️⚠️', '🔫', '🤦🏻‍♂️', '🥓',
    '👋🏻', '✋🏻', '💡', '✌🏻'];
  const stickyInit = {
    "🔇": true
  }

  $afk.on('click', function (ev) {
    let $this = $('#afk');
    $this.toggle();
    if ($this.is(':hidden')) {
      $('#' + '✌🏻').click();
    } else {
      $('#' + '💤').click();
      stickyButton.click();
    }
    ev.preventDefault();
    return false;
  });

  stickyButton.on('click', (ev) => {
    //make the current emoji sticky
    var fav= myFavs.recallFave(target.text() );
    if(fav){
      fav.sticky = !fav.sticky;
      if( fav.sticky){
          myAnimation.removeAnimation();
      } else {
        myAnimation.restartAnimation()
      }

    }
    ev.preventDefault();
    return false;
  });

  var highlightFave = function (emoji) {
    emoji = emoji || target.text();
    $highlight = $('#' + emoji).addClass('highlight');
  }
  var archiveFave = function () {
    $('.highlight').removeClass('highlight');
    $highlight = [];

    //add unique entry to the history
    if ($('#' + target.text()).length === 0) {
      $('#col1')
        .prepend('<span id="' + target.text() + '" class="history">' + target.text() + '</span>');
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
  init.forEach((emoji) => {
    archiveFave();

    var fave = myFavs.stashIt(emoji);
    fave.sticky = !!(stickyInit[fave.emoji])

    if (fave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.addAnimation();
    }
    target.text(emoji);

    //try to highlight in history
    highlightFave(target.text());
  }); // init for each

  stickyButton.click(); //initialize sticky  for the last emoji

  const injectSelection = function (selection) {
    //a highlighted one means we have nothing to archive
    archiveFave();

    var fave = myFavs.stashIt(selection.emoji);

    if (fave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.addAnimation();
    }

    target.text(selection.emoji);

    //try to highlight in history
    highlightFave(target.text());

    return false;
  }
  /*******************/
  picker.on('emoji', selection => {
    // reset animation on every new emoji
    return injectSelection(selection);

  });

  var switchEmoji = function (direction) {

    //archive the current one
    archiveFave();

    var lastFave = myFavs.recallIt(direction);
    target.text(lastFave.emoji);
    //lookup the emoji in the history for highlighting
    highlightFave(target.text());

    if (lastFave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.restartAnimation();
    }
  }

  $('#col1').on('click', 'span', function (ev) {
    archiveFave();
    target.text($(this).text());

    highlightFave(target.text() );

    var fave = myFavs.stashIt($highlight.text(), false);

    myAnimation.addAnimation();
    if (fave.sticky) {
      myAnimation.removeAnimation();
    } else {

    }

  });

  $('body').on('keydown', (ev) => {
    var direction = 0;
    if (ev.which == 38) {
      direction = -1;
    } else if (ev.which == 40) {
      direction = 1;
    }
    if (direction != 0) {
      switchEmoji(direction);
    }
  });


  $outer.on('click', (ev) => {
    var direction = ev.shiftKey ? 1 : -1;

    switchEmoji(direction);
    ev.preventDefault();
    return false;
    // $target.show().fadeIn(1000);
  });

  trigger.addEventListener('click', (ev) => {
    ev.preventDefault();
    picker.togglePicker(trigger);
    $('.emoji-picker__wrapper').css('margin-top', '190px')
      // $('.emoji-picker__container')
      .on('mouseover', 'button.emoji-picker__emoji', function () {
        $('#emojipreview > .emoji_preview-emoji').text($(this).text());
        $('#emojipreview > .emoji_preview-name').text($(this).attr('title'))
      });

    return false;
  });

  $emojipreview.on('click','button', function () {

     injectSelection({
      emoji: $emojipreview.find('.emoji_preview-emoji').text()
    })
    if( $(this).hasClass('sticky')){
      stickyButton.click();
    }
  })
  /*
    target.html(
      target.text()
        .replace(/\S/g, "<span class='letter'>$&</span>")
    );
  */


  /*


  import { EmojiButton } from '@joeattardi/emoji-button';

const picker = new EmojiButton();
const trigger = document.querySelector('.trigger');

picker.on('emoji', selection => {
  trigger.innerHTML = selection.emoji;
});

trigger.addEventListener('click',
() => picker.togglePicker(trigger));
   */

});

if( module.hot) {
  module.hot.accept();
}