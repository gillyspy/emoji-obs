Download and install OBS (exercise for the reader -- no special configs needed). 

Steps to Deploy
# fork my github repo https://github.com/gillyspy/emoji-obs (master branch of course)
# Run `npm install` 
# Make changes. Examples: 
## Change default emojis in \app\scripts\modules\Init.js
--- § Change which of the defaults are sticky in the same file
		○ Load your own afk image in folder app\assets\img\afk.gif -- Anything with an aspect ratio of 1.8 should be fine


Steps to Quick Setup
	1. Create a new scene (or use the default "Scene" )
		a. Setup your camera as you like (part of basic OBS setup)
	2. Add to your scene a "Browser" element
	3. Put in the public URL of wherever you deploy it
		a. It should end up like this: 
		![ScreenGrab](https://github.com/gillyspy/emoji-obs/blob/[branch]/image.jpg?raw=true)

	4. Specify the size as 1180w x 1200h. 
		a. ⚠ 1200 is necessary in order to hide the buttons and emoji picker off the bottom of the view window
	5. Click "ok"
	6. Resize the browser screen -- you may want it to be BIGGER than the camera window so. experiment �
	7. Right click on the new element and choose "interact" like this:
		https://magnetforensicsinc.sharepoint.com/:i:/s/BusinessSystems/EeA6BZz7djlCgS5-5Aky9PQBtPoIi7mkEIiWS5ylCTNm-A?e=NOQCq5
		a. This interaction window is how to change the emoji in play
	8. Enjoy!

How to Interact
	• Emoji button brings up an emoji selector. There is a large preview to help you see it better
	• Res-ize your "browser" scene element so that the buttons are off the camera (they will still be on the interact)
	• Click on any emoji in the history to make it active
	• Emoji's will slowly fade out over 40 seconds
	• ✍click on this icon to enable drawing with your mouse. (Remember to draw on the 'interact' screen). You can
		○  refresh� 
		○ stop drawing �
		○ or hide the grid-assist �
	• � will bring up the emoji picker menu (use tab or mouse to select)
	• Use the ��button to toggle a � .  A � implies the emoji  will stay on screen and not fade
	• Use the �� to move the history / log to off the main screen and below the buttons
	• Use the � button to stop using any emoji immediately. Click again to resume 
	• �� combined with the � will make it seem like nothing is happening
	• � button "Away from keyboard" and will toggle an afk splash screen
		○ (default: Gif of Kakashi sensei using Rasengan and a � emoji.  Change this image through customization…see below)
	• Up / Down/ left/right arrow keys will: 
		○ If (there is no picker window visible) 
			§ re-position the main emoji
		○ If(picker window is open)
			§ Use tab and arrow keys to navigate the menu
	


How to Run Your Own Local Site
You'll have to either build the site and run the static resources OR run a dev server.  Everything should work statically so I recommend that (unless you want to play with web development )

Option 1a:  customize then run your own Local page 
	• Build the distribution by running `npm run build`
	• Copy or use the site in the newly created docs folder
	• Open a browser to the file => <install directory>/docs/index.html
		○ e.g. file:///Users/gerald.gillespie/code/emoji/docs/index.html
	
Option 1b: run your own local page (easiest)
⚠you can configure the AFK image easily but not anything else
	1. Download the zip file from : https://magnetforensicsinc.sharepoint.com/:u:/s/GG/ETYsW3SGaWZLtkO0K4DA4zoBcQ4dlswlndRnFRlBOKAD-Q?e=WbOxAx
	2. Extract it anywhere e.g. your desktop
	3. GO to the file %userprofile%/desktop/emoji_obs/docs/index.html
	4. Open it in your browser
	5. Note the address.  
	6. Configure  as in "Setup -> step 3"

Option 2: Local webserver
	• You'll have to build it f
	• Run your own local webserver with `npm run dev`.  
		○ You'll have to change the ip address in the emoji\webpack.config.js file to match your environment. Perhaps use 0.0.0.0 for localhost
		○ 
	• Browse to the address and post listed. e.g. http://10.0.0.2:3000 (or http://10.0.0.2:3000/index.html)


Appendix: Why Emoji Picker?
In any text field in windows you can bring up an emoji window with win + .  (windows key + period) but for some reason the browser embedded in OBS does not support these multibyte characters as input. Further, if you try to input them by Text box, etc then you are rejected.  But if they are already in a web page then they are supported so this is why this project works the way it does (at least as far as emojis go).
