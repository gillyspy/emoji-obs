import {EmojiButton} from '@joeattardi/emoji-button';

const defaults = {
  //rootElement    : $picker[0],
  theme          : 'dark',
  rows           : 2,
  emojisPerRow   : 31,
  showRecents    : true,
  autoHide       : false,
  initialCategory: 'recents',
  showVariants   : true,
  position       : {
    top     : 50,
    position: 'absolute'
  },
  strategy       : 'absolute',
  emojiSize      : '20px',
  showPreview    : false,
  recentsCount   : 50, //Init.historySize,
  zIndex         : 10000,
  plugins        : [], //[Init.stickyHandler, Init.closeHandler], //
  kwijibo        : 'did my property get set?',
  style          : 'twemoji'
};

const _Picker = {
  knownPlugins: {
    stickyHandler: {
      // track the picker being called for the first time
      //if it is NOT the first time the picker is being rendered then render a button that allows the emoji to be made "sticky"
      name   : 'stickyHandler',
      options: null,
      render : function (picker) {
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
          /*
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
          }) */
        }
        //if it is the first time then populate the recents category with several default emojis
        if (!isFirstRunComplete) {
          //the list of defaults is optionally provided by the user. If there are no defaults then ??
          isFirstRunComplete = true;

          if (typeof picker.options.makeEmojiSticky === 'undefined' || picker.options.makeEmojiSticky === null) {
            picker.options.makeEmojiSticky = false;
          }
          //scan through the list of desired emojis and make the history
        }
        //always render the sticky button
        const button = document.createElement('button');
        button.innerHTML = '📌';

        //picker.options
        button.addEventListener('click', () => {
          if (picker.options.makeEmojiSticky) {
            //now false
            picker.options.makeEmojiSticky = false;
            //remove the style for true
            button.classList.remove('pressed');
          } else {
            //now true
            picker.options.makeEmojiSticky = true;
            //add the class
            button.classList.add('pressed');
            //set the option
          }
        });
        return button;

      } //setDefaults emoji plugin
    },
    closeHandler : {
      name  : 'closeHandler',
      render: function (picker) {
        const button = document.createElement('button');
        button.style.width = '100%';
        button.innerHTML = '✖';

        button.addEventListener('click', () => {
          //close the picker
          document.getElementById('screen').click();
        });
        return button;
      }
    }
  }
};

class myPicker {
  #_ = {}; //options
  #picker; //the picker object
  #trigger;
  #facade = {};
  #wrapper;
  #root;  //the root node
  #emojiClasses = ['emoji-picker__emoji','emoji'];

  constructor(rootNode, triggerNode, namePreviewNode, opts) {
    /*
    * constructor is where we config. you must call launch when everything is configured
    *
    * 1. contructor
    * 2. all plugins and supporting options for plugins
    * 3. launch!
     */
    Object.assign(this.#_, defaults, opts);
    if (rootNode) {
      this.#setRoot(rootNode);
    }
    this.#trigger = triggerNode;

    this.launch();
    this.#initNamePreview(namePreviewNode);
    this.#initTrigger();

  }

  #initTrigger() {
    const that = this;
    const _p = this.#getPicker.bind(this);
    this.#trigger.addEventListener('click', (ev) => {
      const picker = _p();
      ev.preventDefault();
      picker.togglePicker(document.getElementById('picker'));
      return false;
    });
  }

  #getPicker() {
    return this.#picker;
  }

  #initNamePreview(namePreviewNode) {
    if (namePreviewNode && namePreviewNode instanceof Element) {
      const wrapper = this.#root.firstElementChild;
      const pickerGallery = document.querySelector('.emoji-picker__emoji');
      const emojiClasses = this.#emojiClasses;

      const namePreview = document.querySelector('.emoji_preview-name');
      const emojiPreview = document.querySelector('.emoji_preview__emoji');
      const twemojiPreview = document.querySelector('.emoji_preview__twemoji');

      wrapper.addEventListener('mousemove', function (ev) {
        if (! emojiClasses.some( cl=> ev.target.classList.contains(cl)) )
          return true;

        //if it's an image then go up one to the parent
        let emojiEl = ev.target.nodeName === 'IMG' ? ev.target.parentElement : ev.target;
        let twemojiEl = ev.target.nodeName === 'IMG' ? ev.target : ev.target.firstElementChild;

        namePreview.textContent =  emojiEl.getAttribute('title');
        emojiPreview.textContent = emojiEl.getAttribute('data-emoji');
        twemojiPreview.style.backgroundImage = `url(${twemojiEl.getAttribute('src')})`;
        twemojiPreview.textContent = emojiEl.getAttribute('data-emoji');

        return true;
        //update the preview area with the name of this emoji
      });
      /*     .on('mouseover', 'button.emoji-picker__emoji', function () {
             $('#emojipreview > .emoji_preview-emoji').text($(this).text());
             $('.emoji_preview-name').text($(this).attr('title'))
           });

       */

      //const namePreview = document.querySelectorAll('.emoji_preview-name');
      // const emojiPreview = document.querySelectorAll('.emoji_preview-emoji');
      //  namePreview.textContent = this.getAttribute('title');
      //  emojiPreview.textContent = this.getAttribute('data-emoji')
    }
  }

  getProps() {
    //update props from core object
    this.#setPropsFacade();
    //return facade of objects
    return this.#facade;
  }

  launch() {
    try {
      if (!this.#_.rootElement || !(this.#_.rootElement instanceof Element)) {
        throw new Error('root Element not set')
      }
      this.#picker = new EmojiButton(this.#_);
      this.#setPropsFacade();

    } catch (e) {
      console.log({
        object  : 'myPicker',
        function: '#launch',
        error   : e
      });
      throw e;
    }
  }

  #setRoot(node) {
    if (!this.#root) {
      this.#root = node;
      this.#_.rootElement = this.#root;
      return true;
    } else {
      return false;
    }
  }

  #setPropsFacade() {
    //return a copy of certain things

    (({stickyHandler, zIndex, recentsCount, emojiSize, emojisPerRow, rows, theme, rootElement}, props, options) => {
      Object.assign(props, {
        stickyHandler,
        zIndex,
        recentsCount,
        emojiSize,
        emojisPerRow,
        rows,
        theme,
        rootNode: rootElement,
        options
      });
    })(this, this.#facade, this.#picker.options);
  }

  registerCB(event, cb) {
    switch (event) {
      case 'hidden':
      case 'emoji':
        this.#picker.on(event, cb.bind(this));
        break;
      default:
        break;
    }
  } //registerCB

  addPlugin(nameOrObject, additionalOptions = {}) {
    let pluginName;
    if (typeof nameOrObject === 'string') {
      pluginName = nameOrObject;
      nameOrObject = _Picker.knownPlugins[nameOrObject];
    }

    if (!nameOrObject || !nameOrObject.render) {
      //early return
      return;
    }

    //else
    pluginName = nameOrObject.name || pluginName;
    if (!pluginName) {
      //early return
      return;
    }

    //check if it is already registered.  also prevents using names of config properties
    if (this.#_[pluginName]) {
      //early return
      return;
    }

    //register it
    this.#_[pluginName] = additionalOptions;
    this.#_.plugins.push(nameOrObject)

    return true;
  }//addPlugin

  #getStickyHandler() {
    return _Picker.stickyHandler;
  }
}

export default myPicker;