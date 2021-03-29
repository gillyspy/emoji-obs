//alert('hello world!!!');

import { EmojiButton } from '@joeattardi/emoji-button';

const picker = new EmojiButton();
const trigger = document.querySelector('.trigger');
const target = document.querySelector('.target');

picker.on('emoji', selection => {
  target.innerHTML = selection.emoji;
});

trigger.addEventListener('click', () => picker.togglePicker(trigger));

class Favorites {
  constructor(){

  }

  stashFavorite(){

  }
}


if( module.hot) {
  module.hot.accept();
}