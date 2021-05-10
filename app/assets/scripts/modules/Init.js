const Init = {
  init             : [
    '💩', '🔇', '🏳️', '👍🏻', '🔥', '❌', '👂🏻', '🧠', '🦈', '☁️', '⛈️', '🌮',
    '🛠️', '🧲', '📅', '💤', '⁉️', '‍️⚠️', '🔫','🤬', '😰', '👿', '💣', '👋🏻',
    '💡', '✌🏻'
  ],
  stickyInit       : {
    "🔇" : true,
    '💤' : true,
    '✌🏻': true,
    '💣' : true
  },
  historySize      : 50,
  idlespeedoffset: 20000,
  defaultpointeremoji: '✌🏻',
  defaultidleemoji : '☕',
  idletimeout : 100000,
  idlerotation : false,
  linger   : true,
  clocklocation : 'right',
  trashoffset : '600',
  urlParams :  [
    'idlespeedoffset',
    'defaultidleemoji',
    'defaultpointeremoji',
    'idletimeout',
    'idlerotation',
    'linger',
    'clocklocation',
    'trashoffset'
  ],
  canvas           : {
    backgroundColor: "rgba(85,0,255,0)", //"#5500ff",
    strokeColor    : "orange",
    strokeWeight   : 10
  },
  visibleHeight    : 540,

  help:  `
      ✍🏻 : Toggle Draw menu.
      🧽 : wipe drawing or text
      📉 : toggle grid assist for drawing
      🟥 : change color of pen
      📌 : toggle sticky of the current emoji (and remember this setting)
      📌*:toggle sticky of current undocked emoji
      ↩ : toggle width / display of text area (cuz teams cuts the screen)
      ◀️▶️ : scroll recents in order of their use
      ⛔ : toggle hide of the emoji
      💤 : bring up AFK screen
      🔎 : search for a new emoji
      📜 : splash screen if all secondary emojis are docked| else dock all emojis
      🐁 : toggle idle animation & set the emoji for it
      
      Keys:
      - Esc => toggle drawing   (when emoji picker is not visible)
      - Esc => close emoji picker (when emoji picker is visible)
      - Arrows => move the top emoji around
      
      Mouse: 
      - double-click on any history emoji => toggle BIG|dock mode
      - double-click toggle drawing mode off
      - click+drag => drag ANY BIG emoji or trashCan
      - click+drag => draw on canvas when visible
      - click|drag any emoji to make it the top emoji
      
      Config:
      can use  query params some config:
      time-based-integers:  idlespeedoffset, rocketspeedoffset
      on-off bools: linger, idlerotation
      pixel-value-integers: trashoffset
      size : historySize
      text: defaultpointeremoji, defaultidleemoji
      other : clocklocation (left|right)
      v20210429.01
      `

  }
;


export default Init;