import {EmojiButton} from '@joeattardi/emoji-button';
import Favorites from "./Favorites";
import Animation from './Animation';
const $ = require("jquery");
const picker = new EmojiButton();

$(document).ready( function ($) {
  const trigger = document.querySelector('.trigger');

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

  picker.on('emoji', selection => {
    // reset animation on every new emoji
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

  var switchEmoji = function(direction){
    var lastFave = myFavs.recallIt(direction);
    target.text( lastFave.emoji );
    if( lastFave.sticky){
      myAnimation.removeAnimation();
    } else {
      myAnimation.restartAnimation();
    }
  }
  $('body').on('keydown', (ev) =>{
    var direction=0;
    if(ev.which == 38 ) {
      direction = 1;
    } else if ( ev.which== 40) {
      direction = -1;
    }
    if( direction != 0) {
      switchEmoji(direction);
    }
  });

  $outer.on('click keydown', (ev) => {
    var direction= ev.shiftKey ? 1 : 0;

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