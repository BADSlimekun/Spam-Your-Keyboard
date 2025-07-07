SPAM YOUR F'ing KEYBOARD!
-------------------------

Project Description: A chaotic little web project that asks you to spam your keyboard like you just drank 12 Monsters and joined a Discord server.  
Great for... undisclosable reasons. (And also a nice little Git playground 💅) -- Defenitely not written by ChwatGpT :D

---

## Features

- 🔘 Real-time state of the art key spamming
- 🔄 Global counter to track button abuse :')
- 🔊 Sound/visual feedback for clicks (as my friend says, JUICY)
- 🌐 Live updates across users (planned) [wym by planned? ofc its planned bruv]

---

## Project Structure (Atleast should've written this on my own -_-)

 📦SpamYourKeyboard:
 
	SpamYourKeyboard/
	├── client/           # Frontend (HTML, CSS, JS)
	│   ├── index.html
	│   ├── style.css
	│   └── script.js
	│
	├── server/           # Backend (Node + Express + Socket.IO)
	│   ├── index.js
	│   └── package.json
	│
	├── .gitignore
	├── README.md
	

## Goals

To test:
- Real-time interaction
- Global state sharing
- Scalable spam... responsibly :D ofcourse

---

## WARNING: Large chunk of genuine & unreadable description coming...

#### Rough Overview:
 It will be a live web page hosted online accessible to mass online audience who can interact with the webpage. The webpage will be very simple, with a button in the center, which on clicking would increase the global counter above the button. The counter can be increased by anyone accessing the website, and it should be synchronized for all the users (as much as possible). 

#### Inspiration:
 This project idea is inspired from million checkboxes website on which many people online could check or uncheck the whole gird of checkboxes one by one, and it would show up live for others as well. The creator learned a lot about optimizing how to handle the data incoming from multiple users, how to handle load on its webpage, and how to reduce latency for re-rendering and everything. I want to also build a similar project and learn a lot from it.

#### Requirements:
 A large count showing field which is centered. An addictive juicy button (I'm thinking to go with "F") Referencing "F to pay respects". Pressing the F (either the key, or on the screen) should play click sounds in their devices, as well as followed by small faint +1s floating from the key  (like in games). And for each press of F, the count should update. (Or we can simply make it to be keyboard spamming thing, I think more people would like to randomly spam the keyboard than clicking the screen or pressing a single button)

#### Certain ideas:
 Well, the idea is simple on surface, but I want it to be built in such an industry standard way that it can handle concurrent 1000 people+ on the website, spamming the keyboard keys, with almost no lag. I am thinking to add a feature of bubble, which would store the persons number of key presses if the consecutive presses are closely timed enough, and then send that bubble amount once the person takes a gap (lets say we keep the gap like 1 second). So, the person should see his counts accumulating in a bubble like visual that shows the accumulated count by the user in the spam. And once he takes a break, the bubble disappears and gets added to the global total. This should even prevent the auto clickers to break the site.


