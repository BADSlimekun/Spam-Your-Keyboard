//Connecting to the backend?
const socket = io("http://localhost:3000");

//PROGRAM
const counterEl = document.getElementById("counter");

//User Personalization()
//Generate unique Id and store it in localStorage
const getOrCreateUserID = () => {
    let id = localStorage.getItem('userID');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('userID', id); //this is client-native
    }
    return id;
}

const getOrCreateUserName = () => {
    let name = localStorage.getItem('username');
    if (!name) {
        name = prompt("Enter thy nickname (or don't T~T): ") || `:D -${Math.floor(Math.random()*10000)}`;
        localStorage.setItem('username', name);
    }
    return name;
}

//Sounds (Older Html Audio pool removed -- Check version control)

//Sounds 2.0 WebAudio soundpool
let audioCtx;
let clickBuffer = null;

//Load once
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

//Leaderboard()
const leaderboardList = document.getElementById("leaderboard-list"); //refer html <ol>

function renderLeaderboard(leaders) {
    leaderboardList.innerHTML = '';
    leaders.forEach(({userID, username, total }) => {
        const li = document.createElement("li");
        li.textContent = `${username}: ${total}`;
        leaderboardList.appendChild(li);
    });
}


//Bubble Physics :D
let bubbleCount = 0;
let bubbleTimeOut = null;

const bubbleDisplay = document.getElementById("bubble-display");
function updateBubbleDisplay() {
    bubbleDisplay.textContent = `${bubbleCount}`;
    if (bubbleCount > 100) {
        bubbleDisplay.classList.add('combo');
    } else {
        bubbleDisplay.classList.remove('combo');
    }
}

//Special word :D
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

//Special word based Combo system
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

//ListenForInputs shhhhh :D
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
            socket.emit("increment", {
                userID: getOrCreateUserID(),
                username: getOrCreateUserName(),
                amount: bubbleCount
            });
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

socket.on("init", ({count,leaderboard}) => {
    counterEl.textContent = count;
    renderLeaderboard(leaderboard);
});

socket.on("leaderboard", renderLeaderboard); //it takes the value of TopUsers as leaders

socket.on("update", (newCount) => {
    counterEl.textContent = newCount;
});



