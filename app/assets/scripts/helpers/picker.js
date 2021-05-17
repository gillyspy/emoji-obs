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
    stickyHandler : {
      // track the picker being called for the first time
      //if it is NOT the first time the picker is being rendered then render a button that allows the emoji to be made
      // "sticky"
      name   : 'stickyHandler',
      options: null,
      render : function (picker) {
        /*
        if no emoji is selected then nothing happens -- no sticky pin applied either.
         */
        //establish defaults if not set
        if (typeof picker.options.stickyHandler === 'undefined')
          picker.options.stickyHandler = Object.assign({
              makeEmojiSticky: false,
              onClick        : null
            },
            (picker.options.stickyHandler || {})
          );

        // render the sticky button
        const button = document.createElement('button');
        button.innerHTML = '📌';
        button.style.width = '33%';

        //picker.options

        button.addEventListener('click', (ev) => {
          //toggle setting
          picker.options.stickyHandler.makeEmojiSticky = !picker.options.stickyHandler.makeEmojiSticky;

          let styles = [{backgroundColor: null},{backgroundColor: 'gray'}];
          let styleIdx = +(picker.options.stickyHandler.makeEmojiSticky);
          Object.assign(node.style, styles[styleIdx]);
        });
        picker.options.stickyHandler.button = button;
        return button;
      } //setDefaults emoji plugin
    },
    twemojiHandler: {
      name  : 'twemojiHandler',
      render: function (picker) {

        //establish default
        if (typeof picker.options.twemojiHandler === 'undefined')
          picker.options.twemojiHandler = Object.assign({
              preferTwemoji: false,
            },
            (picker.options.twemojiHandler || {})
          );

        const preferTwemoji = !!picker.options.twemojiHandler.preferTwemoji;

        const button = document.createElement('button');
        button.innerHTML = '✨';
        button.style.width = '33.3%';

        button.addEventListener('click', () => {
          //toggle setting
          picker.options.twemojiHandler.preferTwemoji = !picker.options.twemojiHandler.preferTwemoji;

          let styles = [{backgroundColor: null},{backgroundColor: 'gray'}];
          let styleIdx = +(picker.options.twemojiHandler.preferTwemoji);
          Object.assign(node.style, styles[styleIdx]);
        });

        picker.options.twemojiHandler.button = button;
        return button;
      }
    },
    closeHandler  : {
      name  : 'closeHandler',
      render: function (picker) {
        const button = document.createElement('button');
        button.style.width = '33.3%';
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

  constructor(rootNode, triggerNode, namePreviewNode, plugins = [], opts) {
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

    plugins.forEach(plugin => {
      this.addPlugin(plugin);
    });

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
      const emojiArea = this.#root.querySelector('.emoji-picker__emojis');
      //      const pickerGallery = document.querySelector('.emoji-picker__emoji');
      const emojiClasses = this.#emojiClasses;

      const namePreview = document.querySelector('.emoji_preview-name');
      const emojiPreview = document.querySelector('.emoji_preview__emoji');
      const twemojiPreview = document.querySelector('.emoji_preview__twemoji');

      const faves = this.#_.emojiCache;
      const opts = this.#picker.options;

      emojiArea.addEventListener('mousemove', function (ev) {
        if (!emojiClasses.some(cl => ev.target.classList.contains(cl)))
          return true;

        //if it's an image then go up one to the parent
        let emojiEl = ev.target.nodeName === 'IMG' ? ev.target.parentElement : ev.target;
        let twemojiEl = ev.target.nodeName === 'IMG' ? ev.target : ev.target.firstElementChild;

        let emoji = emojiEl.getAttribute('data-emoji');
        namePreview.textContent = emojiEl.getAttribute('title');
        emojiPreview.textContent = emoji;
        twemojiPreview.style.backgroundImage = `url(${twemojiEl.getAttribute('src')})`;
        twemojiPreview.textContent = emojiEl.getAttribute('data-emoji');

        //update the current status of sticky and preferTwemoji buttons based on emoji selected;

        //1. look up the emoji in the stash
        const fave = faves.recallFave(emoji);

        if (!fave) {
          return true;
        }
        //TODO: do this via a slight delay so that selection is not slowed down

        //2.
        opts.stickyHandler.makeEmojiSticky = fave.sticky;
        opts.twemojiHandler.preferTwemoji = fave.preferTwemoji;

        let styles = [ {backgroundColor: null},{backgroundColor: 'gray'}];

        Object.assign(opts.stickyHandler.button.style, styles[ +fave.sticky ]);
        Object.assign(opts.twemojiHandler.button.style, styles[+fave.preferTwemoji]);

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