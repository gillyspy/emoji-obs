// use cssRules as a way of providing values for config

class ConfigViaCSS {
  constructor(sheetNum) {
    this.sheetNum = sheetNum; //obs default is 3
  }

  /*
  {RocketPath: 20000
   */
  getSheet() {
    return document.styleSheets[this.sheetNum];
  }

  getConfig() {
    let config = {};
    let selectorPatterns = [
      {rgx: /^(RocketPathspeedOffset).*-([^-]+)$/i, fn: (x)=>+x},
      {rgx: /^(defaultIdleEmoji).*-([^-]+)$/i, fn: (x)=>x},
      {rgx: /^(idletimeout).*-([^-]+)$/i, fn: (x)=>+x},
      {rgx: /^(idlerotation).*-([^-]+)$/i, fn : (x)=> /^(true|T|yes|Y)$/i.test(x)}
    ]
    let sheet = document.styleSheets[this.sheetNum];
    if (sheet) {
      selectorPatterns.forEach((pattern, idx, patterns) => {
        //if a match is found
        for (let idx in sheet.cssRules) {
          let rule = sheet.cssRules[idx];
          if (pattern.rgx.test(rule.selectorText)) {
            //set the value in config
            try {
              config[
                rule.selectorText.match(pattern.rgx)[1]
                ] = pattern.fn(rule.selectorText.match(pattern.rgx)[2]);
            } catch (e) {

            }
          }
        }
      })
    }
     return   config;
  } //getConfig()

} //class


export default ConfigViaCSS;