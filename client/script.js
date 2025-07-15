// Theme toggle initialization
const themeToggle = document.querySelector('.toggle-theme');
const rootEl = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
rootEl.setAttribute('data-theme', savedTheme);
updateToggleIcon();

themeToggle.addEventListener("click", () => {
    const newTheme = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    rootEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon();
});

function updateToggleIcon() {
    const current = rootEl.getAttribute('data-theme');
    themeToggle.textContent = current === 'dark' ? '☀️': '🌑';
}

//Connecting to the backend?
const socket = io("http://localhost:3000");

//Elements
const counterEl = document.getElementById("counter");
const bubbleDisplay = document.getElementById("bubble-display");

//PROGRAM

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
    try {
        const response = await fetch('click.mp3');
        const arrayBuffer = await response.arrayBuffer();
        clickBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err) {
        console.error("Failed to load mp3:",err);
    }
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
    plus.style.left = Math.random()*85 + 10 + "%"; //spawn em at random x
    const rot = (Math.random() * (40) - 20).toFixed(0) + 'deg'; 
    plus.style.setProperty('--randRot', rot);
    document.querySelector('.effect-layer').appendChild(plus);
    
    setTimeout(() => {
        plus.remove();
    },1000); //removal after animation
}

//Leaderboard()
const leaderboardList = document.getElementById("leaderboard-list"); //refer html <ol>

function renderLeaderboard(leaders) {
    leaderboardList.innerHTML = '';
    leaders.forEach(({userID, username, total }, index) => {
        const li = document.createElement("li");
        li.textContent = `${index+1}. ${username}: ${total}`;
        leaderboardList.appendChild(li);
    });
}
//remove before anything
renderLeaderboard([
    {userID: 0, username: 'Hello1', total: 10000}, 
    {userID: 1, username: 'Hello2', total: 8200},
    {userID: 2, username: 'Hello3', total: 6040},
    {userID: 3, username: 'Hello4', total: 3299},
    {userID: 4, username: 'Hello4', total: 3239},
    {userID: 5, username: 'Hel535', total: 2229},
    {userID: 6, username: 'Hello4', total: 1245},
    {userID: 7, username: 'Hello4', total: 1000},
    {userID: 8, username: 'Hello4', total: 849},
    {userID: 9, username: 'Hello4', total: 163},
]);

//Bubble Physics :D
let bubbleCount = 0;
let bubbleTimeOut = null;

function updateBubbleDisplay() {
    bubbleDisplay.textContent = `${bubbleCount}`;
    
    // if (bubbleCount > 100) {
    //     bubbleDisplay.classList.add('combo');
    // } else {
    //     bubbleDisplay.classList.remove('combo');
    // }
    updateBubbleSize();
}

function updateBubbleSize() {
    const styles = getComputedStyle(rootEl);
    const minF = parseFloat(styles.getPropertyValue('--bubble-font-min'));
    const maxF = parseFloat(styles.getPropertyValue('--bubble-font-max'));
    let threshold = 100;
    let x = 0;
    if (bubbleCount > 100) {x = 100; threshold = 200;} 
    if (bubbleCount > 200) {x = 200; threshold = 400;}
    if (bubbleCount > 400) {x = 400; threshold = 600;}
    if (bubbleCount > 600) {x = 600; threshold = 900;}
    if (bubbleCount > 900) {x = 900; threshold = 2000;}
    if (bubbleCount > 2000) {x = 2000; threshold = 3000;}
    newSize = Math.min(minF + (maxF - minF) * ((bubbleCount-x) / threshold), maxF); 
    bubbleDisplay.style.fontSize = `${newSize}rem`;
}

//Special word :D
function showComboFlash(word) {
    const flash = document.createElement("div");
    flash.textContent = `${word}! +50`;
    flash.className = "combo-flash";
    flash.style.left = Math.random()*60 + "%"; //spawn em at random x
    const rot = (Math.random() * (40) - 20).toFixed(0) + 'deg'; 
    flash.style.setProperty('--randRot', rot);
    document.querySelector('.effect-layer').appendChild(flash);
    setTimeout(() => {
        flash.remove();
    },1100);
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
        bubbleCount += 50;
        wordStreak = ''; //Reset after hit
        showComboFlash(word);
        }
    }
});

//ListenForInputs shhhhh :D (NOT IMPLEMENTED YET)
const keysPressed = new Set();
const bonusLetters = ['f', 'a', 's', 't']; //take input from an external list

function handleInput(e) {
    let baseValue = Number((Math.random()*10).toFixed(0));
    // baseValue = 1;

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
            counterEl.textContent = (Number(counterEl.textContent.replace(/,/g, "")) + bubbleCount).toLocaleString("en-US");  //REMIVIENOENCINENIEIFAIHFOAWIHFIOAWHDAWH
            bubbleCount = 0;
            updateBubbleDisplay();
        }
    },750); //update this in due time
}

document.addEventListener("keydown", (e) => {
    if (keysPressed.has(e.code)) return; //ignore holding
    keysPressed.add(e.code);

    handleInput(e);
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



