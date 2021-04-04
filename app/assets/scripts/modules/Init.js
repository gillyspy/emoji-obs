const Init = {
    init         : ['💩', '🔇', '🏳️', '👍🏻', '🔥', '✅', '❌', '👂🏻', '🧠',
      '🐧', '🦈', '☁️', '⛈️', '🌮', '🎧', '🔋', '🛠️',
      '🧲', '📅', '🛏️', '💤', '⁉️', '‍️⚠️', '🔫', '🤦🏻‍♂️', '🥓',
      '👋🏻', '✋🏻', '💡', '✌🏻'],
    stickyInit   : {
      "🔇" : true,
      '💤' : true,
      '✌🏻': true
    },
    canvas       : {
      backgroundColor: "rgba(85,0,255,0)", //"#5500ff",
      strokeColor    : "orange",
      strokeWeight   : 10
    },
    visibleHeight: 575,
    setDefaults  : function () {
      // track the picker being called for the first time
      //if it is NOT the first time the picker is being rendered then render a button that allows the emoji to be made "sticky"
      return {
        render: function (picker) {
          /*
          if no emoji is selected then nothing happens -- no sticky pin applied either.
           */
          var doHandlerOnHide = false; // temporary cache on whether to set the selected emoji as sticky.
          var isFirstRunComplete = false;

          //ONLY if there is a stickyHandler then we can evaluate whether or not to apply a sticky pin
          if (typeof picker.options.stickyHandler !== 'object') {
            //stickyHandler is a function of what to do when an object is marked sticky
            return;
          } else {
            //add the stickyHandler
            picker.on('emoji', function () {
              // console.log(picker.options);
              //if the sticky button is pressed when emoji is selected then set the temporary flag
              if (picker.options.makeEmojiSticky) {
                doHandlerOnHide = true;
              } else {
                //unset the temporary flag
                doHandlerOnHide = false
              }
              return;
            });

            picker.on('hidden', function () {
              if (doHandlerOnHide) {
                picker.options.stickyHandler['element'].trigger(picker.options.stickyHandler['event']);
              }
              //always set the doHandlerOnHide to false here as this is a temporary flag
              doHandlerOnHide = false;
              return;
            })
          }
          //if it is the first time then populate the recents category with several default emojis
          if (!isFirstRunComplete) {
            //the list of defaults is optionally provided by the user. If there are no defaults then ??
            isFirstRunComplete = true;

            if (typeof picker.options.makeEmojiSticky === 'undefined') {
              picker.options.makeEmojiSticky = false;
            }
            //scan through the list of desired emojis and make the history
          }
          //always render the sticky button
          const button = document.createElement('button');
          button.innerHTML = '📌';

          picker.options
          button.addEventListener('click', () => {
            if (picker.options.makeEmojiSticky) {
              //remove the class
              button.classList.remove('pressed');
              //set the option
            } else {
              //add the class
              button.classList.add('pressed');
              //set the option
            }
            //reverse the option
            picker.options.makeEmojiSticky = !picker.options.makeEmojiSticky;

            //alert('hello from the 📌 ' + picker.options.makeEmojiSticky);
            console.log('what is THIS???', this);
            console.log('what is picker???', picker);
          });
          return button;

        } //setDefaults emoji plugin
      };
    }
  }
;


export default Init;