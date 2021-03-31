import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./Favorites";
import Animation from './Animation';
const $ = require("jquery");
const picker = new EmojiButton();

$(document).ready( function ($) {
  const trigger = document.querySelector('.trigger');
  var $highlight = [];
  const target = $('.target');
//$target.fadeOut(40000);//default
  const stickyButton = $('#stickybutton');
  const $outer = $('.outer');

  stickyButton.on('click', (ev) => {
    //make the current emoji sticky
    if (!myFavs.recallFave().sticky) {
      myFavs.toggleSticky();
      myAnimation.removeAnimation();
    }
    ev.preventDefault();
    return false;

  });

  const myFavs = new Favorites();
  myFavs.stashIt(target.text());

  const myAnimation = new Animation(target);
  Window.TEST = myFavs;
  myFavs.stashIt(target.text());
  console.log(myFavs);

  var archiveFave = function () {
    if ($highlight.length) {
      $highlight.removeClass('highlight');
    }
    $highlight = [];

    //add unique entry to the history
    if( $('#'+target.text() ).length === 0 ){
      $('#col1')
        .prepend('<span id="'+ target.text() + '" class="history">' + target.text() + '</span>');
    }

    //update size of icons
    var histCt = $('.history').length;
    var size = 675 / 50;
    if (histCt < 14) {
      size = Math.max(size, 50);
    }
    $('.history').css('font-size', size + 'px');
  }

  picker.on('emoji', selection => {
    // reset animation on every new emoji

    //a highlighted one means we have nothing to archive
    if(!$highlight.length){
      archiveFave();
    }
    var fave = myFavs.stashIt(selection.emoji);

    console.log('in picker.on', 'fave:', fave);
    console.log(fave);
    if (fave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.addAnimation();
    }

    target.text( selection.emoji );
    // $target.fadeOut( 20000 );
    return false;
  });

  var switchEmoji = function(direction) {
    if ($highlight.length) {
      //archive the current one
      archiveFave();
    }
    var lastFave = myFavs.recallIt(direction);
    target.text(lastFave.emoji);
    if (lastFave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.restartAnimation();
    }
  }

  $('#col1').on('click', 'span', function (ev) {
    archiveFave();

    $highlight = $(this).addClass('highlight');

    var fave = myFavs.stashIt($highlight.text(), false);

    target.text($highlight.text());
    if (fave.sticky) {
      myAnimation.removeAnimation();
    } else {
      myAnimation.addAnimation();
    }

  });

  $('body').on('keydown', (ev) => {
    var direction = 0;
    if (ev.which == 38) {
      direction = 1;
    } else if (ev.which == 40) {
      direction = -1;
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
    return false;
  });

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