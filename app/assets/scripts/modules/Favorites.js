import Log from './Log.js';

const log = new Log(false);

const defaults = '[{"emoji":"💩","key":"💩","sticky":false,"position":0},{"emoji":"🔇","name":"myInit1","key":"🔇","sticky":true,"position":1},{"emoji":"🏳️","name":"myInit2","key":"🏳️","sticky":false,"position":2},{"emoji":"👍🏻","name":"myInit3","key":"👍🏻","sticky":false,"position":3},{"emoji":"🔥","name":"myInit4","key":"🔥","sticky":false,"position":4},{"emoji":"❌","name":"myInit5","key":"❌","sticky":false,"position":5},{"emoji":"👂🏻","name":"myInit6","key":"👂🏻","sticky":false,"position":6},{"emoji":"🧠","name":"myInit7","key":"🧠","sticky":false,"position":7},{"emoji":"🦈","name":"myInit8","key":"🦈","sticky":false,"position":8},{"emoji":"☁️","name":"myInit9","key":"☁️","sticky":false,"position":9},{"emoji":"⛈️","name":"myInit10","key":"⛈️","sticky":false,"position":10},{"emoji":"🌮","name":"myInit11","key":"🌮","sticky":false,"position":11},{"emoji":"🛠️","name":"myInit12","key":"🛠️","sticky":false,"position":12},{"emoji":"🧲","name":"myInit13","key":"🧲","sticky":false,"position":13},{"emoji":"📅","name":"myInit14","key":"📅","sticky":false,"position":14},{"emoji":"💤","name":"myInit15","key":"💤","sticky":true,"position":15},{"emoji":"⁉️","name":"myInit16","key":"⁉️","sticky":false,"position":16},{"emoji":"‍️⚠️","name":"myInit17","key":"‍️⚠️","sticky":false,"position":17},{"emoji":"🔫","name":"myInit18","key":"🔫","sticky":false,"position":18},{"emoji":"👋🏻","name":"myInit19","key":"👋🏻","sticky":false,"position":19},{"emoji":"💡","name":"myInit20","key":"💡","sticky":false,"position":20},{"emoji":"✌🏻","name":"myInit21","key":"✌🏻","sticky":true,"position":21}]';

/* push new faves onto the end.  "cut" them off the front */
class Favorites {
  constructor(firstItem) {
    this.stash = []; //a stash of favorites
    this.nameIndex = []; //a matching index for the stash
    this.position = 0;
    this.max = 1000; // max size cached
    this.historyMax = 50;
    this.storageKey = 'emojiPicker.recent';
    this.Init();
    if (firstItem) {
      this.stashIt(firstItem);
    }
  }

  Init() {
    this.stash = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    if (!this.stash.length) {
      this.stash = JSON.parse(defaults);
      localStorage.setItem(this.storageKey, defaults);
    }
    this.stash.forEach( (a)=>{
      this.nameIndex.push(a.emoji);
    })
  } //Init

  getStash() {
    return this.stash;
  }

  doStorage(fave) {
    if (fave) {
       this.stash.push([fave]);
    }
    //let history = JSON.parse(localStorage.getItem('emojiPicker.recent')) || [];
    // add the item to the END of storage.
    //slice off the beginning when it gets too big
    this.stash.unique('emoji', false);
    this.nameIndex.unique(false,true);
    if(this.stash.length > this.historyMax){
      this.stash.shift();
      this.nameIndex.shift();
    }
    localStorage.setItem(
      "emojiPicker.recent",
      JSON.stringify( this.stash )
    );
  } //doStorage
  /*
        const e = JSON.parse(localStorage.getItem("emojiPicker.recent")) || [];
      //const a = (e ? JSON.parse(e) : []).filter((e => !!e.emoji));
      const a = [fave].concat(e).unique('emoji').slice(0, Init.historySize);
      localStorage.setItem("emojiPicker.recent", JSON.stringify(a));
*/

  getNameFromIndex(position) {
    if (typeof position === 'undefined') {
      return this.nameIndex[this.position];
    } else {
      this.position = position;
      return this.nameIndex[position];
    }
  }

  toggleSticky(position, favorite) {
    if (!favorite) {
      if (typeof position !== 'undefined' && !isNaN(position)) {
        this.position = position;
      }
      favorite = this.stash[this.position];
    }
    log.browser('toggleSticky', this.position, favorite, this);
    favorite.sticky = !favorite.sticky;
    // favorite = this.toggleSticky(this.position, favorite); //recursively set sticky on now-known favorite
    log.browser(favorite);
    return favorite;
  }

  stashIt(emoji, addHistory = true) {
    let name = (typeof emoji === 'object') ? emoji.emoji : emoji;
    let fave = this.recallFave(name);
    //do we already have it stashed
    if (fave && typeof emoji === 'object') {
      //already have so update if relevant
      Object.assign(fave, emoji);
    } else if(!fave) {
      //new entry
      if (this.nameIndex.length >= this.max) {
        //remove the oldest one
        delete this.stash(this.nameIndex[0]);
        this.nameIndex.shift();
      }
      //add it differently if it is an string v. object
      if (name === emoji) { //string
        fave = {
          emoji   : emoji,
          key     : emoji,
          name    : emoji,
          sticky  : false,
          position: this.nameIndex.length // this is correct at the time because index does not have it yet
        }
      } else { //object
        fave = emoji;
        fave.position = this.nameIndex.length;
      }
      //update stash and index
      this.stash.push(fave);
      this.nameIndex.push(fave.emoji)
    }
    //always add it to History because this also updates the history
    if (addHistory) {
      try {
        this.doStorage();
      } catch (e) {
        log.browser('failure in stashIt', e)
      }
    }
    return fave;
  } //stashIt

  // favorite is one particular stashed entry
  //emoji is an important attribute of a favorite
  recallFave(emoji) {
    if (emoji) {
      if (typeof emoji === 'object')
        emoji = emoji.emoji;
      this.position = this.nameIndex.indexOf(emoji);
    }
    return this.stash[this.position]; //will be undefined if cannot find it
  } //recallFave

  /*
  slice it from the nameIndex and the stash and then doHistory
   */
  promoteFave(fave){
    //find it in the nameIndex
    fave = this.recallFave(fave);
    let from = this.nameIndex.indexOf(fave.emoji);
    let to = 0;
    this.stash.move(from,to);
    this.nameIndex.move(from,to);
    this.doStorage();
  }

  recallIt(direction = 'backwards') {
    //log.browser(this.stash, this.index, this.position);
    //if we're going backwards then return the previous one to the index
    if (direction === 'forwards' || direction === -1) { //forwards || -1
      this.position--;
      this.position = Math.max(this.position, 0);
    } else if (direction === 'backwards' || direction === 1) {
      this.position++;
      this.position = Math.min(this.nameIndex.length - 1, this.position);
    } else {
      this.position = direction;
    }
    return this.stash[this.position];
  }
}

export default Favorites