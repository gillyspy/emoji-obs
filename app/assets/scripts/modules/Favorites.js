import Log from './Log.js';
const log = new Log(false);

class Favorites {
  constructor(firstItem) {
    this.stash = {}; //a stash of favorites
    this.nameIndex = [];
    this.position = 0;
    this.max = 1000; // max size cached
    if (firstItem) {
      this.stashIt(firstItem);
    }
  }

  getNameFromIndex(position) {
    if (typeof position === 'undefined') {
      return this.nameIndex[this.position];
    } else {
      this.position = position;
      return this.nameIndex[position];
    }
  }

  animateCurrent(direction) {
    if (direction === 'out') {
      $target.fadeOut(40000);//default
    } else {//in
      $target.stop().show().fadeIn(1000);
    }
  }

  toggleSticky(position, favorite) {
    if (favorite) {
      favorite.sticky = !favorite.sticky;
      return favorite;
    } else {

      if (typeof position === 'undefined' || isNaN(position)) {
        //current
        favorite = this.stash[this.getNameFromIndex(this.position)];    //TODO [this.position];
      } else {
        this.position = position;
        favorite = this.stash[this.getNameFromIndex(position)];
      }
    }
    log.browser('toggleSticky', this.position, favorite, this);
    favorite.sticky = !favorite.sticky;
    // favorite = this.toggleSticky(this.position, favorite); //recursively set sticky on now-known favorite
    log.browser(favorite);
    return favorite;
    //return favorite.sticky;
  }

  stashIt(emoji, addHistory) {
    if(typeof addHistory === 'undefined'){
      addHistory = true;
    }
    log.browser('stashIt', emoji);
    if (this.nameIndex.length >= this.max) {
      //remove the oldest one
      delete this.stash(this.nameIndex[0]);
      this.nameIndex.shift();
    }

    if (this.stash[emoji]) {
      //do nothing
    } else {
      //add it
      if(emoji.emoji){
        emoji = emoji.emoji;
       // alert('wtf, how did we get here');
      }
      this.stash[emoji] = {
        emoji   : emoji,
        key : emoji,
        sticky  : false,
        position: this.nameIndex.length // this is correct at the time because index does not have it yet
      }
      // add to NameIndex
      if( addHistory) {
        this.nameIndex.push(emoji);
      }
    }
    let fave = this.stash[emoji];

    //update position to this position
    this.position = fave.position;  // (this.nameIndex.length - 1);
    log.browser('stashed', this.stash)
    return fave;
  }

  // favorite is one particular stash entry
  recallFave(favorite) {
    if (!favorite) {
      log.browser('no favourite', this.stash)
      favorite = this.stash[this.getNameFromIndex()];
    } else {
      favorite = this.stash[favorite];
    }
    this.position = favorite ? favorite.position : this.position;
    return favorite;
  }

  recallIt(direction = 'backwards') {
    //log.browser(this.stash, this.index, this.position);
    //if we're going backwards then return the previous one to the index
    if (direction === 'backwards' || direction === 1) {
      this.position--;
      this.position = Math.max(this.position, 0);
    } else if( direction === 'forwards' || direction === -1) { //forwards || -1
      this.position++;
      this.position = Math.min(this.nameIndex.length - 1, this.position);
    } else {
      this.position = direction;
    }
    return this.stash[this.getNameFromIndex(this.position)];
  }
}

export default Favorites