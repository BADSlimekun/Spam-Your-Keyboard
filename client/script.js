//Connecting to the backend?
const socket = io("http://localhost:3000");

//PROGRAM
const counterEl = document.getElementById("counter");

let bubbleCount = 0;
let bubbleTimeOut = null;

//Sounds
/*
const POOL_SIZE = 20;
const audioPool = [];
let audioIndex = 0;
const audioVolume = 1.0;
const audioSrc = 'click.mp3'

for (let i = 0; i<POOL_SIZE; i++) 
{
    const audio = new Audio(audioSrc);
    audio.preload = 'auto';
    audio.load();
    audio.volume = audioVolume;

    //Parameters to track of the audio is still playing
    audio._isPlaying = false;
    audio.onended = () => { audio._isPlaying = false; };

    audioPool.push(audio);
}

function playClickSound() {
    const sound = audioPool[audioIndex];

    try {
        if (sound._isPlaying) { 
            sound.pause();
            sound.currentTime = 0;
        }
    } catch(e) {
        console.error("Sound Play Error:", e);
    }

    sound._isPlaying = true;
    sound.play().catch(() => {
        sound._isPlaying = false;
    });

    //Circular movement in the pool of index per call
    audioIndex = (audioIndex + 1) % POOL_SIZE;
}
*/

//Sounds 2.0 WebAudio soundpool
let audioCtx;
let clickBuffer = null;

// Load once
async function initWebAudio() {
    console.log("🔊 Initializing WebAudio...");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const response = await fetch('click.mp3');
    const arrayBuffer = await response.arrayBuffer();
    clickBuffer = await audioCtx.decodeAudioData(arrayBuffer);
}

window.addEventListener("click", () => {
    if (audioCtx && audioCtx.state == "suspended") {
        audioCtx.resume().then(() => {
            console.log("AudioContext resumed...");
        });
    }
});

function playClickSound() {
    if (!clickBuffer || !audioCtx) return;

    const source = audioCtx.createBufferSource();
    source.buffer = clickBuffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0; // volume

    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}


//Animations
function showFloatingPlusOne(e) {
    const plus = document.createElement("div");
    plus.textContent = `+${e}`;
    plus.className = "floating-plus-one";
    plus.style.left = Math.random()*80 + 10 + "%"; //spawn em at random x
    document.body.appendChild(plus);
    
    setTimeout(() => {
        plus.remove();
    },1000); //removal after animation
}

const bubbleDisplay = document.getElementById("bubble-display");
function updateBubbleDisplay() {
    bubbleDisplay.textContent = `${bubbleCount}`;
    if (bubbleCount > 100) {
        bubbleDisplay.classList.add('combo');
    } else {
        bubbleDisplay.classList.remove('combo');
    }
}

function showComboFlash(word) {
    const flash = document.createElement("div");
    flash.textContent = `COMBO: ${word}! +100`;
    flash.className = "combo-flash";
    flash.style.left = Math.random()*10 + 40 + "%"; //spawn em at random x
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.remove();
    },1000);
}

//ListenForInputs
const keysPressed = new Set();
const bonusLetters = ['f', 'a', 's', 't']; //take input from an external list

function handleInput(e) {
    let baseValue = 1;

    //Check for bonus letters
    if (e && bonusLetters.includes(e.key)) {
        baseValue = 2;
    }

    bubbleCount += baseValue;
    updateBubbleDisplay();
    playClickSound();
    showFloatingPlusOne(baseValue);

    clearTimeout(bubbleTimeOut);
    bubbleTimeOut = setTimeout(() => {
        if (bubbleCount > 0) {
            socket.emit("increment", bubbleCount);
            bubbleCount = 0;
            updateBubbleDisplay();
        }
    },750); //update this in due time
}

document.addEventListener("keydown", (e) => {
    if (keysPressed.has(e.code)) return; //ignore holding
    keysPressed.add(e.code);

    handleInput();
});

document.addEventListener("keyup", (e) => {
    keysPressed.delete(e.code);
});

document.addEventListener("mousedown", () => {
    handleInput();
});

//Word based Combo system
let wordStreak = '';
const bonusWords = ['FAST', 'STRUCT', 'CLASS', 'DOCUMENT'];

document.addEventListener("keydown", (e) => {
  const char = e.key.toUpperCase();
  if (!/^[A-Z]$/.test(char)) return; //Check for valid chara

  wordStreak += char;
  wordStreak = wordStreak.slice(-11); //Limit to last 10 chars

  for (const word of bonusWords) {
    if (wordStreak.endsWith(word)) {
      bubbleCount += 100;
      wordStreak = ''; //Reset after hit
      showComboFlash(word);
    }
  }
});

//I spotted an audio leak bug, but now its not bugging
//Stiiilllll just to be safe, tab switching audio forgetter :D
window.addEventListener("visibilitychange", () => {
    if (document.hidden && audioCtx.state == "running") {
        audioCtx.suspend();
    } else if (!document.hidden && audioCtx && audioCtx.state == "suspended") {
        audioCtx.resume();
    }
});

window.onload = () => {
    initWebAudio();
};

//SocketPocket:D
socket.on("connect", () => {
    console.log("😉 Connected to Backend");
});

socket.on("init", (count) => {
    counterEl.textContent = count;
});

socket.on("update", (newCount) => {
    counterEl.textContent = newCount;
});



