class Log{
  constructor(isEnabled){
    this.debug;
  }

  browser(...opts){
    if(this.debug){
      return console.log(...opts);
    }
    return;
  }
}

export default Log;