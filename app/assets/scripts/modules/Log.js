class Log{
  #debug;
  constructor(isEnabled){
    this.#debug = isEnabled;
  }

  browser(...opts){
    if(this.#debug){
      return console.log(...opts);
    }
    return;
  }
}

export default Log;