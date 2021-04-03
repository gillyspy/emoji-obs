Download and install OBS (exercise for the reader -- no special configs needed). 

## Steps to Deploy
1. fork my github repo https://github.com/gillyspy/emoji-obs (master branch of course)
2. Run `npm install` 
3. Make changes. Examples: 
    * Change default emojis in \app\scripts\modules\Init.js
    * Change which of the defaults are sticky in the same file
        * Load your own "afk" (💤) image in folder app\assets\img\afk.gif -- Anything with an aspect ratio of 1.8 should be fine

## Steps to Quick Setup
1. Create a new scene (or use the default "Scene" )
 	* Setup your camera as you like (part of basic OBS setup)
2. Add to your scene a "Browser" element
3. Put in the public URL of wherever you deploy it
    * It should end up like this: 
    ![ScreenGrab](dox/pix/emoji_obs.cap1.png?raw=true)
4. Specify the size. Tested at 1000px x 1100h. 
    * ⚠ 1200 is recommended to hide the buttons and emoji picker off the bottom of the view window
5. Click "ok"
6. Resize the browser screen -- you may want it to be BIGGER than the camera window so. experiment �
7. Right click on the new element and choose "interact" like this:
    ![ScreenGrab](dox/pix/emoji_obs.cap2.png?raw=true)
    * This interaction window is how to change the emoji in play
8. Enjoy!

## How to Interact
* Emoji button brings up an emoji selector. There is a large preview to help you see it better
* Res-ize your "browser" scene element so that the buttons are off the camera (they will still be on the interact)
* Click on any emoji in the history to make it active
* Emoji's, by default, will slowly fade out over 40 seconds unless you 📌 them 
* ✍ to toggle drawing with your mouse. Drawing is on by default
    *  🔄 refresh
    * 🛑 stop drawing (also ✍ )
    * 📉 hide the grid-assist
* 😎 will bring up the emoji picker menu (use tab or mouse to select)
* 📌 button to toggle emoji auto-fade.  Will be indicated on-screen.
* Use the 📜 to move the history / log to off the main screen and below the buttons
* Use the 🛑 button to stop using (hide) any emoji immediately. Click again to resume. 
* 📜 combined with the 🛑 will clear the visible area of all.
* 💤 for  "Away from keyboard" and will toggle an afk splash screen image
    * (default: Gif of Kakashi sensei using Rasengan and a 💤 emoji.  Change this image through customization…see below)
* Up / Down/ left/right arrow keys will: 
    * If (there is no picker window visible) 
        * re-position the main emoji
    * If(picker window is open)
        * Use tab and arrow keys to navigate the menu

## Appendix: Why Emoji Picker for OBS Anyway?
#### Windows 
In any text field in windows you can bring up an emoji window with win + .  (windows key + period) but for some reason the browser embedded in OBS does not support these multibyte characters as input. Further, if you try to input them by Text box, etc then you are rejected.  But if they are already in a web page then they are supported so this is why this project works the way it does (at least as far as emojis go).
#### Mac
Additional problem is there is no OS way to get an emoji if you're on Mojave

Also this is fun and you can draw, etc, but! 