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
    console.log('toggleSticky', this.position, favorite, this);
    favorite.sticky = !favorite.sticky;
    // favorite = this.toggleSticky(this.position, favorite); //recursively set sticky on now-known favorite
    console.log(favorite);
    return favorite;
    //return favorite.sticky;
  }

  stashIt(emoji) {
    console.log('stashIt', emoji);
    if (this.nameIndex.length >= this.max) {
      //remove the oldest one
      delete this.stash(this.nameIndex[0]);
      this.nameIndex.shift();
    }

    if (this.stash[emoji]) {
      //do nothing
    } else {
      //add it
      this.stash[emoji] = {
        emoji   : emoji,
        sticky  : false,
        position: this.nameIndex.length // this is correct at the time because index does not have it yet
      }
      // add to NameIndex
      this.nameIndex.push(emoji);
    }
    let fave = this.stash[emoji];

    //update position to this position
    this.position = this.stash[emoji].position;  // (this.nameIndex.length - 1);
    console.log('stashed', this.stash)
    return this.stash[emoji];
  }

  // favorite is one particular stash entry
  recallFave(favorite) {
    if (!favorite) {
      console.log('no favourite', this.stash)
      favorite = this.stash[this.getNameFromIndex()];
    } else {
      favorite = this.stash[favorite];
    }
    this.position = favorite.position;
    return favorite;
  }

  recallIt(direction = 'backwards') {
    //console.log(this.stash, this.index, this.position);
    //if we're going backwards then return the previous one to the index
    if (direction === 'backwards' || direction === 1) {
      this.position--;
      this.position = Math.max(this.position, 0);
    } else { //forwards || -1
      this.position++;
      this.position = Math.min(this.nameIndex.length - 1, this.position);
    }
    return this.stash[this.getNameFromIndex(this.position)];
  }
}

export default Favorites