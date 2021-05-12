import Draw from 'draw-on-canvas'; //draw-on-canvas
import init from './Init.js';


//TODO: finish namespacing all the classes
class Drawing {
  //3x3 grid
  #HTML = {
    grid    : `
       <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
       <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>
        <div class="drawing__grid__cell" style="flex:1 1 32%; border :1px dashed white;"></div>`,
    controls: [
      {
        name   : 'wipe',
        title  : 'Wipe Drawing',
        content: '🧽',
        classes: ['drawing__btn']
      },
      {
        name   : 'hide',
        title  : 'Close Drawing Panel',
        content: '🛑',
        classes: ['drawing__btn', 'drawing__btn--pressed']
      },
      {
        name   : 'grid',
        title  : 'Close Drawing Grid',
        content: '📉',
        classes: ['drawing__btn']
      }],
    colors  : `<button class="drawing__pens drawing__btn" title="Red Pen">🟥</button>`
  };
  #triggers = {
    wipe: '__wipe',
    hide: '__hide',
    grid: '__nogrid',

  };
  #colors = {
    red   : 'red',
    blue  : 'blue',
    orange: 'orange',
    green : 'green',
    purple: 'purple',
    white : 'white',
    black : 'black'
  };
  #cl = {
    drawing      : 'drawing',
    wipe         : 'drawing__wipe',
    hide         : 'drawing__hide',
    hideOff      : 'drawing__btn--pressed',
    grid         : 'drawing__nogrid',
    easel        : 'drawing__easel',
    easelOff     : 'drawing__easel--hide',
    easelOn      : 'nothing',
    selectedColor: 'drawing__pens--pressed',
    //grid button effect
    gridOn       : 'drawing__btn--pressed',
    gridOff      : 'nothing',
    //colorOn      : 'drawing__btn--pressed',
    //colorOff     : '',
    //wipe button effect
    wipeOn       : 'nothing',
    //canvas button effect
    showOn       : 'drawing__btn--pressed',
    showOff      : '',

    pens       : 'drawing__pens',
    pensOff    : '',
    pensOn     : 'drawing__btn--pressed',
    gridNode   : 'drawing__grid',
    //gridNodeOn : '',
    gridNodeOff: 'drawing__grid--hide',
    //control buttons effect
    controlsOn : '',
    controlsOff: 'drawing__btn--hide',
    //trigger effect
    triggerOn  : 'drawing__trigger--on',
    triggerOff : 'drawing__trigger--off'
  };
  #_ = {
    namespace   : 'drawing',
    // width       : '100%', //window.innerWidth,
    // height      : init.visibleHeight, //'540',
    canvas      : {
      backgroundColor: init.canvas.backgroundColor,//"rgba(85,0,255,0)", //"#5500ff",
      strokeColor    : init.canvas.strokeColor,//"orange",
      strokeWeight   : init.canvas.strokeWeight  //10
    },
    doEscape    : true,
    showControls: false,
    cb          : function () {
      return true;
    }
  };
  #buttons;
  #buttonTrigger;
  #drawing; // the actual Drawing Object
  #easel; // node containing the canvas
  #location; /* node containing all */
  #grid;
  #pens;
  #nodes = {};
  #controls = {
    nodes    : {
      /* hide : Element */
    },
    callbacks: {
      hide: ()=>{},
      pen: ()=>{},
      setup: ()=>{},
      grid :  ()=>{},
      wipe : ()=>{}
      /* hide : ()=>{} */
    }
  };

  constructor(/* Element $drawingTarget[ */ canvasWrapper,
              /* Element */ buttonsWrapper,
              /* Element */ buttonTrigger,
              /* Object */ triggerSelectors,
              /* Object */ opts
  ) {
    this.#location = canvasWrapper;

    this.#buttons = buttonsWrapper;
    //this.#buttons.style.zIndex = 9001;
    this.#buttonTrigger = buttonTrigger;

    //TODO doe sthis do anything?
    Object.assign(this.#triggers, triggerSelectors);
    Object.assign(this.#_, opts);

    //init
    this.#initNameSpace(this.#_.namespace);
    this.#initColorButtons();
    this.#initCanvas(); // => this.#drawing
    this.#initGrid();
    this.#initControls();
    this.#bindTrigger();
    this.#bindDrawingDblClick();

    if (this.#_.showControls) {
      this.showControls();
    }
    this.#initFinish();
    this.drawing = this;
  }

  hide() {
    return this.#toggleHide(null, true);
  }

  #toggleHide(ev,forceHide) {
    let classes = this.#cl;
    let cb = this.#controls.callbacks.hide;
    let button = this.#controls.nodes.hide;
    let easel = this.#getEasel();
    if (easel.classList.contains(classes.easelOff) && !forceHide) {
      //turn on
      Drawing.#swapClass(easel, classes.easelOff, classes.easelOn);
      Drawing.#swapClass(button, classes.hideOn, classes.hideOff);
    } else {
      //turn off
      Drawing.#swapClass(easel, classes.easelOn, classes.easelOff);
      Drawing.#swapClass(button, classes.hideOff, classes.hideOn);
    }
    cb();
    return true;
  } //toggle

  #initFinish() {
    Object.assign(this.#nodes , {
      wrapper: this.#location,
      buttons: this.#buttons,
      trigger: this.#buttonTrigger
    });

    this.#_.setupCB.apply(this);
  } //initFinish

  #getDrawingNode() {
    return this.#location;
  }

  #initNameSpace(namespace) {
    for (let cl in this.#cl) {
      this.#cl[cl].replace(/^drawing/, namespace);
    }
  }

  static #swapClass(
    /* Element */ node,
    /* string */before,
    /* string */ after
  ) {
    //accommodate nodeList
    if (node instanceof NodeList || node instanceof HTMLCollection || Array.isArray(node)) {
      [...node].forEach(n => {
        Drawing.#swapClass(n, before, after);
      })
    }

    //only operate on nodes
    if (node instanceof Element) {

      if (before) {
        if (typeof before === 'string')
          before = [before];
        node.classList && node.classList.remove(...before);
      }

      if (after) {
        if (typeof after === 'string')
          after = [after]
        node.classList && node.classList.add(...after);
      }
      return true;
    }
    return false;
  } //swapClass

  hideControls() {
    const {triggerOn, triggerOff, controlsOn, controlsOff} = this.#cl;
    //turn on now
    Drawing.#swapClass(this.#buttonTrigger, triggerOn, triggerOff);

    //show controls
    Drawing.#swapClass(this.#buttons, controlsOn, controlsOff);
  }

  showControls() {
    const {triggerOn, triggerOff, controlsOn, controlsOff} = this.#cl;

    //turn on now
    Drawing.#swapClass(this.#buttonTrigger, triggerOff, triggerOn);

    //show controls
    Drawing.#swapClass(this.#buttons, controlsOff, controlsOn);
  }

  #bindTrigger() {
    const that = this;
    const cb = this.#_.cb.bind(this);
    const {triggerOff} = this.#cl;
    const trigger = this.#buttonTrigger;

    trigger.addEventListener('click', (ev) => {
      if (trigger.classList.contains(triggerOff)) {
        // already off so now show
        that.showControls();
      } else {
        //hiding controls also hides the drawing

        //hide controls
        that.hideControls();
      }
      //call optionally-provided-callback
      return cb(ev);
    });
  }

  #bindDrawingDblClick() {
    const trigger = this.#buttonTrigger;
    this.#location.addEventListener('dblclick', (ev) => {
      //clicking trigger while drawing is visible will hide the canvas
      trigger.click();
    })
  } //bindDrawingDblClick

  #initCanvas() {
    try {
      if (!(this.#location instanceof Element)) {
        new TypeError('location should be provided as a DOM element');
      }
      Drawing.#swapClass(this.#location, '', this.#cl.drawing);

      const oldEasel = this.#easel || this.#location.querySelector(this.#cl.easel);
      if (oldEasel) {
        oldEasel.firstElementChild && oldEasel.firstElementChild.remove()
        oldEasel.textContent = '';
      } else {
        //this will also append
        this.#easel = document.createElement('div');
      }

      Drawing.#swapClass(this.#easel, '', [this.#cl.easel]);

      let {width, height} = Object.assign({},
        //default
        (({width, height}) => ({
          width,
          height
        }))(this.#location.getBoundingClientRect()),
        //override from options
        this.#_
      );

      this.#location.append(this.#easel);

      let firstColor;
      let pen;
      //set default color;
      //look for a pen that is already selected
      if (this.#pens && this.#pens.length) {

        //default pen is first one
        pen = this.#pens[0];
        let classes = this.#cl;
        [...this.#pens].forEach(_pen => {
          if (_pen.classList.contains(classes.selectedColor)) {
            //we found one so change the color to be this one
            firstColor = _pen.style.color;
            pen = _pen;

            //remove the "on" class
            Drawing.#swapClass(_pen, [classes.selectedColor,classes.pensOn], classes.pensOff);
          }
        });

        //still not color then try the default color
        if (!firstColor) {
          firstColor = this.#_.canvas.strokeColor;
          pen = this.#buttons.getElementsByClassName(`${this.#cl.pens}--${firstColor}`)[0];
        }
      }

      //make the canvas
      this.#drawing = new Draw(this.#easel, width, height, this.#_.canvas);

      //unset all pens
//      Drawing.#swapClass(this.#pens, this.#cl.pensOn, this.#cl.pensOff);

      //click the pen node
      pen.click();
    } catch (e) {
      console.log('initCanvas', e);
      //

    }
  }//initCanvas

  getProps() {
    const props = (({strokeColor, strokeWeight, width, height},{nodes},n,{callbacks}) => ({
      color : strokeColor,
      weight: strokeWeight,
      controls : nodes,
      nodes : n,
      callbacks,
      width,
      height
    }))(this.#drawing, this.#controls, this.#nodes, this.#controls);
    let d = this.#easel;
    props.isVisible = !!d.getClientRects().length

    return props;
  }

  #initColorButtons() {
    const buttons = this.#buttons;
    const buttonTemplate = this.#HTML.colors;
    for (let color in this.#colors) {
      let pen = document.createElement('button');
      buttons.prepend(pen);
      Drawing.#swapClass(pen, '',
        ['drawing__pens', 'drawing__btn', 'drawing__pens--' + color]
      );
      pen.setAttribute('title', `${color} Pen`);
      pen.style.color = color;
      pen.innerHTML = `
        <span class="drawing__pens__color" style="background-color: ${color}">&nbsp;</span>`

      //TODO: set color attributes somehow to match
      this.#initColorTrigger(pen, color)
    }
    this.#pens = document.body.getElementsByClassName( this.#cl.pens);
  }

  #getPens() {
    return this.#pens;
  }

  #setDrawingColor(color){
    this.#drawing.strokeColor = color;
  }



  #initColorTrigger(trigger, color) {
    const cl = this.#cl;
    const that = this;
    this.#controls.callbacks.pen = this.#_.penCB.bind(that);  //TODO: move this to earlier init stage
    const cb = this.#controls.callbacks.pen;

    if (trigger !== null) {
      //bind click
      trigger.addEventListener('click', function () {
        //remove the class that inidicates selection from all pens
        Drawing.#swapClass(
          that.#getPens(),
          [cl.selectedColor, cl.pensOn],
          cl.pensOff
        );

        that.#setDrawingColor(color);
        //for this specific trigger Node only.... add the class that modifies the selected color
        Drawing.#swapClass(trigger, cl.pensOff, [cl.selectedColor, cl.pensOn]);
        cb();
        return true;
      });
    }
  } // initColorTriggers

  #initControls() {
    const buttons = this.#buttons;
    const controls = this.#HTML.controls;
    controls.forEach(control => {
      let button = document.createElement('button');
      button.setAttribute('title', control.title);
      button.classList.add(...control.classes);
      // button.setAttribute('name', control.name);
      button.textContent = control.content
      buttons.prepend(button);
      //TODO: set color attributes somehow to match

      this.#initControlTriggers(control.name, button);
    });
  }//initControls

  /* easel changes so we use this */
  #getEasel() {
    return this.#easel;
  }

  #initControlTriggers(control, button) {
    const grid = this.#grid;
    const getEasel = this.#getEasel.bind(this);
    const classes = this.#cl;
    const that = this;
    const hideCB = this.#_.hideCB.bind(this);

    this.#controls.nodes[control] = button;
    let cb = this.#_[`${control}CB`];
    this.#controls.callbacks[control] = cb ? cb.bind(this) : ()=>{};

    switch (control) {
      case 'grid':
        button.addEventListener('click', () => {
          if (!grid) return;
          if (button.classList.contains(classes.gridOn)) {
            //turn off
            Drawing.#swapClass(button, classes.gridOn, classes.gridOff);
            Drawing.#swapClass(grid, classes.gridNodeOn, classes.gridNodeOff)
            grid.style.opacity = 0;
          } else {
            //turn on
            Drawing.#swapClass(grid, classes.gridNodeOff, classes.gridNodeOn);
            Drawing.#swapClass(button, classes.gridOff, classes.gridOn);
            button.classList.add(classes.gridOn);
            grid.style.opacity = 1;
          }
        });
        break;
      case 'hide':
        button.addEventListener('click', this.#toggleHide.bind(this) );
        break;

      case 'wipe':
        button.addEventListener('click', () => {
          //recreate the drawing
          that.#initCanvas();
          //that.#getPens().querySelector(classes.colorOn)
        });
        break;
    }


  } //initControlTriggers

  //TODO: toggleGrid
  #initGrid() {
    const grid = document.createElement('div');
    Drawing.#swapClass(grid, '', [this.#cl.gridNodeOff, this.#cl.gridNode]);
    this.#grid = grid;
    this.#location.prepend(grid);

    grid.innerHTML = this.#HTML.grid;
  }

}

export default Drawing;