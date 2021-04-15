// use cssRules as a way of providing values for config

class ConfigViaCSS {
  constructor(sheetNum) {
    this.sheetNum = sheetNum; //obs default is 3
  }

  /*
  {RocketPath: 20000}
   */
  getSheet() {
    return document.styleSheets[this.sheetNum];
  }

  findOBSRules() {
    let stopCondition = false;
    let goodRules;
    for (var s in document.styleSheets) {
      var S = document.styleSheets[s];
      if (!S.cssRules) {
        continue;
      }
      for (var t in S.cssRules) {
        let T = S.cssRules[t];
        console.log(T);
        if (!T || !T.selectorText) {
          continue;
        } else {
          let U = T.selectorText
          if (/^rocketpathspeedoffset.*/.test(U)) {
            stopCondition = true;
          }
        }

        if (stopCondition) {
          goodRules = S.cssRules;
          break;
        }
      }
      if (stopCondition) {
        break;
      }
    }
    return goodRules;
  }

  getConfig() {
    let config = {};
    let selectorPatterns = [
      {
        rgx: /^(RocketPathspeedOffset).*-([^-]+)$/i,
        fn : (x) => +x
      },
      {
        rgx: /^(defaultIdleEmoji).*-([^-]+)$/i,
        fn : (x) => x
      },
      {
        rgx: /^(idletimeout).*-([^-]+)$/i,
        fn : (x) => +x
      },
      {
        rgx: /^(idlerotation).*-([^-]+)$/i,
        fn : (x) => /^(true|T|yes|Y)$/i.test(x)
      },
      {
        rgx: /^(defaultpointeremoji).*-([^-]+)$/i,
       fn : (x) => x
      }
    ];
    let rules = this.findOBSRules();
    if (rules) {
      selectorPatterns.forEach((pattern, idx, patterns) => {
        //if a match is found
        for (let r in rules) {
          let rule = rules[r];
          if (pattern.rgx.test(rule.selectorText)) {
            //set the value in config
            try {
              config[
                rule.selectorText.match(pattern.rgx)[1]
                ] =
                pattern.fn(rule.selectorText.match(pattern.rgx)[2]);
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