// Theme toggle initialization
const themeToggle = document.querySelector('.toggle-theme');
const rootEl = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
const totalContribEl = document.getElementById('total-contributions');
totalContribEl.textContent =`Your Lifetime Contribution: ${toShortForm(localStorage.getItem('Total Contri'))}`;

rootEl.setAttribute('data-theme', savedTheme);
updateToggleIcon();
updateSocialIcons();

themeToggle.addEventListener("click", () => {
    const newTheme = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    rootEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon();
    updateSocialIcons();
});

function updateSocialIcons() {
    const theme = rootEl.getAttribute('data-theme');
    document.querySelectorAll('.social-links img').forEach(img => {
        const light = img.dataset.lightSrc;
        const dark  = img.dataset.darkSrc;
        img.src = theme === 'dark' ? dark : light;
  });
}

//remember mute state across sessions
let isMuted = JSON.parse(localStorage.getItem('muted') || 'false');

// Share-with-friends button
const shareBtn = document.querySelector('.share-btn');
shareBtn.addEventListener('click', () => {
    const shareData = {
        title: document.title,
        text: 'Check out Spam Your Keyboard!',
        url: window.location.href
    };
    if (navigator.share) {
        navigator.share(shareData).catch(err => console.error('Share failed:', err));
    } else {
        // fallback: copy link to clipboard
        navigator.clipboard.writeText(shareData.url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => prompt('Copy this link:', shareData.url));
    }
});

function updateToggleIcon() {
    const current = rootEl.getAttribute('data-theme');
    themeToggle.textContent = current === 'dark' ? '☀️': '🌑';
}

//Connecting to the backend?
const socket = io({
    transports: ['websocket'],
    path: '/socket.io'
});

//Elements
const counterEl = document.getElementById("counter");
const bubbleDisplay = document.getElementById("bubble-display");

//PROGRAM

//User Personalization()
//Generate unique Id and store it in localStorage
const getOrCreateUserID = () => {
    let id = localStorage.getItem('userID');
    if (!id) {
        id = "u-" + Math.random().toString(36).slice(2); //bad for scaling but works for 100-1000 people
        localStorage.setItem('userID', id); //this is client-native
    }
    return id;
}

const getOrCreateUserName = () => {
    let name = localStorage.getItem('username');
    if (!name) {
        //ask, then trim to 16 chars and strip disallowed chars
        let input = prompt("Enter nickname (1-16 chars):") || `Anon-${Math.floor(Math.random()*10000)}`;
        input = input.trim().substring(0, 16);
        //only allow letters, numbers, underscores or hyphens
        name = input.replace(/[^\w-]/g) || `Anon-${Math.floor(Math.random()*10000)}`;
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
    updateMuteIcon();
}

window.addEventListener("click", () => {
    if (audioCtx && audioCtx.state == "suspended") {
        audioCtx.resume().then(() => {
            console.log("AudioContext resumed...");
        });
    }
});

// Mute button & toggle logic
const muteBtn = document.querySelector('.mute-btn');
function updateMuteIcon() {
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
}
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('muted', JSON.stringify(isMuted));
    updateMuteIcon();
});

function playClickSound() {
    if (isMuted || !clickBuffer || !audioCtx) return;

    const source = audioCtx.createBufferSource();
    source.buffer = clickBuffer;

    // randomize pitch for natural feel
    source.playbackRate.value = 0.6 + Math.random() * 0.15;

    const gainNode = audioCtx.createGain();
    // randomize volume slightly
    gainNode.gain.value = 3 + Math.random() * 0.4;

    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}


//Animations
function showFloatingPlusOne(e) {
    const plus = document.createElement("div");
    plus.textContent = `+${e}`;
    plus.className = "floating-plus-one";
    plus.style.left = Math.random()*85 + 5 + "%"; //spawn em at random x
    const rot = (Math.random() * (40) - 20).toFixed(0) + 'deg'; 
    plus.style.setProperty('--randRot', rot);
    document.querySelector('.effect-layer').appendChild(plus);
    
    setTimeout(() => {
        plus.remove();
    },2000); //removal after animation
}

//Helper func for cool concatenated scores
function toShortForm(num) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1e6) {
        return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (abs >= 1e3) {
        return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return sign + abs;  
}

//Leaderboard()
const leaderboardList = document.getElementById("leaderboard-list"); //refer html <ol>

function renderLeaderboard(leaders) {
    leaderboardList.innerHTML = '';
    leaders.forEach(({userID, username, total }, index) => {
        const li = document.createElement("li");
        li.classList.add("leaderboard-item");

        const rank = document.createElement("span");
        rank.classList.add("rank");
        rank.textContent = `${index+1}.`;

        const name = document.createElement("span");
        name.classList.add("name");
        name.textContent = `${username}`;

        const score = document.createElement("span");
        score.classList.add("name");
        score.textContent = `${toShortForm(total)}`;

        li.append(rank, name, score);
        leaderboardList.append(li);
    });

}

//Bubble Physics :D
let bubbleCount = 0;
let bubbleTimeOut = null;

function updateBubbleDisplay() {
    bubbleDisplay.textContent = `${(bubbleCount).toLocaleString("en-US")}`;
    
    updateBubbleSize();
}

function updateBubbleSize() {
    const styles = getComputedStyle(rootEl);
    const minF = parseFloat(styles.getPropertyValue('--bubble-font-min'));
    const maxF = parseFloat(styles.getPropertyValue('--bubble-font-max'));
    let threshold = 500;
    let x = 0;
    if (bubbleCount > 500) {x = 500; threshold = 1500;} 
    if (bubbleCount > 2000) {x = 2000; threshold = 6000;} 
    if (bubbleCount > 8000) {x = 8000; threshold = 12000;}
    if (bubbleCount > 20000) {x = 20000; threshold = 20000;}
    if (bubbleCount > 40000) {x = 40000; threshold = 60000;}
    if (bubbleCount > 100000) {x = 100000; threshold = 150000;}
    newSize = Math.min(minF + (maxF - minF) * ((bubbleCount-x) / threshold), maxF); 
    bubbleDisplay.style.fontSize = `${newSize}rem`;
}

//Special word :D
function showComboFlash(word) {
    const flash = document.createElement("div");
    flash.textContent = `${word}! +${word.length*20}`;
    flash.className = "combo-flash";
    flash.style.left = Math.random()*60 + 10 + "%"; //spawn em at random x
    const rot = (Math.random() * (40) - 20).toFixed(0) + 'deg'; 
    flash.style.setProperty('--randRot', rot);
    document.querySelector('.effect-layer').appendChild(flash);
    setTimeout(() => {
        flash.remove();
    },2000);
}

//Special word based Combo system (ReversedTrie based search cuz legit 30k words T~T)
let bonusWords = [];
let trieRoot;
let maxLen = 0;

//Load and parse the words file
async function loadBonusWords() {
    const res = await fetch('/bonusWords.txt');
    if (!res.ok) throw new Error('Failed to fetch bonusWords.txt');
    const text = await res.text();
    bonusWords = text.split(/\r?\n/).map(w => w.trim()).filter(w => w.length).sort((a,b) => b.length - a.length);
    //splitted different lines, trimmed whitespace, dropped empty lines, sorted longest first\

    maxLen = bonusWords[0]?.length || 0; //will make it 0 if undefined
}


class TrieNode {
    constructor() {
        this.children = Object.create(null);
        this.isWord = false;
        this.word = true;
    }
} 

function buildReversedTrie(words) {
    const root = new TrieNode();
    for (const w of words) {
        let node = root; // to check if its a good parent :D, or will make it a new parent and give it good children
        for (let i = w.length - 1; i>=0; --i) {
            const ch = w[i].toUpperCase(); //character track
            if (!node.children[ch]) node.children[ch] = new TrieNode(); //create new TrieNode cuz no match :(
            node = node.children[ch];
        }
        node.isWord = true; //This node means word exist :D
        node.word = w.toUpperCase(); //Which word? This word :D
    }
    return root; //I am root :D
}

(async function initComboSystem() {
    try {
        await loadBonusWords();
        trieRoot = buildReversedTrie(bonusWords); //shoving 30k words :D
        console.log(`Loaded ${bonusWords.length} words, maxLength = ${maxLen}`);
    } catch(err) {
        console.error(err);
    }
})(); //could have done it in a seperate line, but well this is also a way :D

let buffer = []; //holds the last maximum len of chars
document.addEventListener("keydown", (e) => {
    const ch = e.key.toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return; //Check for valid chara

    buffer.unshift(ch); //add it to the front of buffer
    if (buffer.length > maxLen) buffer.pop(); //trim to the longest word len

    node = trieRoot;

    for (const c of buffer) {   //max len of loop would be longest length of a word 
        if (!node.children[c]) break;
        node = node.children[c];
        if (node.isWord) {  //check only if its a word
            bubbleCount += node.word.length *20;
            showComboFlash(node.word);
            buffer.length = 0;
            break;
        }
    }
});

//ListenForInputs shhhhh :D 
const keysPressed = new Set();

function handleInput(e) {
    let baseValue = Number((Math.random()*9).toFixed(0)); //random 0-10?

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
            let contri = Number(localStorage.getItem('Total Contri'));
            contri += bubbleCount;
            localStorage.setItem('Total Contri', contri);
            totalContribEl.textContent = `Your Lifetime Contribution: ${toShortForm(contri)}`; 
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
//counterEl.textContent = (Number(counterEl.textContent.replace(/,/g, "")) + bubbleCount).toLocaleString("en-US");  //REMIVIENOENCINENIEIFAIHFOAWIHFIOAWHDAWH
            
socket.on("init", ({count,leaderboard}) => {
    counterEl.textContent = count.toLocaleString("en-US");
    renderLeaderboard(leaderboard);
    let contri = localStorage.getItem('Total Contri');
    if (!contri) {
        contri = 0;
        localStorage.setItem('Total Contri', contri); //this is client-native
    }
});

socket.on("leaderboard", renderLeaderboard); //it takes the value of TopUsers as leaders

socket.on("update", (newCount) => {
    counterEl.textContent = newCount.toLocaleString("en-US");
});

//Live‐Log: elements & listeners
const liveLogList = document.getElementById('live-log-list');
const liveCountEl = document.querySelector('.live-count');

//Update the “Live Spammers” count
socket.on('onlineCount', count => {
    liveCountEl.textContent = toShortForm(count);  
});

//Append each user‐increment to the live log
socket.on('log', ({ username, increment }) => {
    
    const li = document.createElement('li');
    li.textContent = `${username} added ${toShortForm(increment)}`;
    liveLogList.appendChild(li);
    // keep the feed to the last 50 entries
    if (liveLogList.children.length > 50) {
        liveLogList.removeChild(liveLogList.firstElementChild);
    }
    // auto‐scroll the newest message into view
    liveLogList.lastElementChild.scrollIntoView({ behavior: 'smooth' });
});

