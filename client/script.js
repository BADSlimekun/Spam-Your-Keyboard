//Connecting to the backend?
const socket = io("http://localhost:3000");

//PROGRAM
const counterEl = document.getElementById("counter");

let bubbleCount = 0;
let bubbleTimeOut = null;

//Sounds
const POOL_SIZE = 100;
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
    audioPool.push(audio);
}

function playClickSound() {
    const sound = audioPool[audioIndex];

    try { 
        sound.pause();
        sound.currentTime = 0;
        sound.play().catch(() => {});
    } catch(e) {
        console.error("Sound Play Error:", e);
    }
    //Circular movement in the pool of index per call
    audioIndex = (audioIndex + 1) % POOL_SIZE;
}

//Animations
function showFloatingPlusOne() {
    const plus = document.createElement("div");
    plus.textContent = "+1";
    plus.className = "floating-plus-one";
    plus.style.left = Math.random()*80 + 10 + "%"; //spawn em at random x
    document.body.appendChild(plus);
    
    setTimeout(() => {
        plus.remove();
    },1500); //removal after animation
}

//ListenForInputs
const keysPressed = new Set();

document.addEventListener("keydown", (e) => {
    if (keysPressed.has(e.code)) return; //ignore holding
    keysPressed.add(e.code);

    bubbleCount++;
    playClickSound();
    showFloatingPlusOne();

    clearTimeout(bubbleTimeOut);
    bubbleTimeOut = setTimeout(() => {
        if (bubbleCount > 0) {
            socket.emit("increment", bubbleCount);
            bubbleCount = 0;
        }
    },1000); //update this in due time
});

document.addEventListener("keyup", (e) => {
    keysPressed.delete(e.code);
});

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



