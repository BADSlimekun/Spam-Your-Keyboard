// Theme toggle initialization
const themeToggle = document.querySelector('.toggle-theme');
const rootEl = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
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
//remove before anything
renderLeaderboard([
    {userID: 0, username: 'MissPixelv2', total: 829911},
    {userID: 1, username: 'neoNinja420', total: 793730},
    {userID: 2, username: 'Nova123', total: 787600},
    {userID: 3, username: 'itsSniper99', total: 779864},
    {userID: 4, username: 'DrZerox', total: 771583},
    {userID: 5, username: 'TheShadowtv', total: 763727},
    {userID: 6, username: 'iamEchoAI', total: 756355},
    {userID: 7, username: 'Falcon007', total: 748898},
    {userID: 8, username: 'Blazex', total: 741103},
    {userID: 9, username: 'Ghost_99', total: 734173},
    {userID: 10, username: 'Viper69', total: 727122},
    {userID: 11, username: 'itsWizard', total: 719613},
    {userID: 12, username: 'realKnight', total: 711890},
    {userID: 13, username: 'Ninjaxx', total: 704584},
    {userID: 14, username: 'Echo123', total: 697293},
    {userID: 15, username: 'xXSniper007', total: 690160},
    {userID: 16, username: 'ProFalcon', total: 682454},
    {userID: 17, username: 'ultraNova', total: 675162},
    {userID: 18, username: 'Pixelgod', total: 667680},
    {userID: 19, username: 'Ghost420', total: 660581},
    {userID: 20, username: 'MrZeroAI', total: 653237},
    {userID: 21, username: 'Blaze_x', total: 645576},
    {userID: 22, username: 'Shadowzz', total: 638091},
    {userID: 23, username: 'Ninja_69', total: 631038},
    {userID: 24, username: 'itsHunter', total: 623870},
    {userID: 25, username: 'DrKnight', total: 616265},
    {userID: 26, username: 'xXWizardXx', total: 609038},
    {userID: 27, username: 'Echo_007', total: 601826},
    {userID: 28, username: 'NeoBlaze', total: 594576},
    {userID: 29, username: 'iamShadow', total: 586964},
    {userID: 30, username: 'Sniper123', total: 580123},
    {userID: 31, username: 'Nova_99', total: 572864},
    {userID: 32, username: 'realPixel', total: 565159},
    {userID: 33, username: 'Ghosttv', total: 558275},
    {userID: 34, username: 'FalconAI', total: 550747},
    {userID: 35, username: 'Wizard69', total: 543983},
    {userID: 36, username: 'MissNinja', total: 536741},
    {userID: 37, username: 'Sniperdev', total: 529241},
    {userID: 38, username: 'Echo_x', total: 522161},
    {userID: 39, username: 'Blazegod', total: 514786},
    {userID: 40, username: 'TheZero', total: 507330},
    {userID: 41, username: 'xXHunterX', total: 499767},
    {userID: 42, username: 'NovaXx', total: 492408},
    {userID: 43, username: 'iamFalcon', total: 484939},
    {userID: 44, username: 'Knight_007', total: 478168},
    {userID: 45, username: 'Shadowtv', total: 470206},
    {userID: 46, username: 'Ninja99', total: 462598},
    {userID: 47, username: 'EchoGod', total: 454991},
    {userID: 48, username: 'MissGhost', total: 447795},
    {userID: 49, username: 'Blaze123', total: 440342},
    {userID: 50, username: 'Pixel_99', total: 432650},
    {userID: 51, username: 'MrSniper', total: 425405},
    {userID: 52, username: 'xXEchoXx', total: 417723},
    {userID: 53, username: 'ProNova', total: 410215},
    {userID: 54, username: 'HunterAI', total: 403232},
    {userID: 55, username: 'DrFalcon', total: 395871},
    {userID: 56, username: 'realBlaze', total: 388263},
    {userID: 57, username: 'itsPixel', total: 381155},
    {userID: 58, username: 'Knighttv', total: 373291},
    {userID: 59, username: 'SniperX', total: 365473},
    {userID: 60, username: 'Ghost007', total: 358543},
    {userID: 61, username: 'NovaDev', total: 351050},
    {userID: 62, username: 'EchoSniper', total: 343194},
    {userID: 63, username: 'Wizard_99', total: 335891},
    {userID: 64, username: 'NinjaBlaze', total: 328471},
    {userID: 65, username: 'ShadowHunter', total: 320954},
    {userID: 66, username: 'TheKnight', total: 313746},
    {userID: 67, username: 'Falcon123', total: 306710},
    {userID: 68, username: 'Ghosttv99', total: 299166},
    {userID: 69, username: 'xXZeroXx', total: 292058},
    {userID: 70, username: 'BlazeAI', total: 284643},
    {userID: 71, username: 'MissEcho', total: 277504},
    {userID: 72, username: 'Ninjax', total: 270459},
    {userID: 73, username: 'realNova', total: 262867},
    {userID: 74, username: 'Hunter007', total: 255888},
    {userID: 75, username: 'Knightx', total: 248465},
    {userID: 76, username: 'Pixel420', total: 240978},
    {userID: 77, username: 'Wizardtv', total: 233460},
    {userID: 78, username: 'EchoZero', total: 226203},
    {userID: 79, username: 'SniperAI', total: 218806},
    {userID: 80, username: 'GhostxX', total: 211697},
    {userID: 81, username: 'NeoKnight', total: 204663},
    {userID: 82, username: 'itsFalcon', total: 197337},
    {userID: 83, username: 'Blaze69', total: 190260},
    {userID: 84, username: 'ThePixel', total: 183337},
    {userID: 85, username: 'ShadowAI', total: 175977},
    {userID: 86, username: 'Sniper_99', total: 168686},
    {userID: 87, username: 'NovaZero', total: 161583},
    {userID: 88, username: 'GhostGod', total: 154292},
    {userID: 89, username: 'Hunter69', total: 147489},
    {userID: 90, username: 'Ninja_007', total: 140143},
    {userID: 91, username: 'Echo420', total: 132553},
    {userID: 92, username: 'WizardGod', total: 125486},
    {userID: 93, username: 'realKnighttv', total: 118358},
    {userID: 94, username: 'Falconx', total: 110862},
    {userID: 95, username: 'Pixel007', total: 103393},
    {userID: 96, username: 'MissGhostx', total: 96494},
    {userID: 97, username: 'DrSniper', total: 93658},
    {userID: 98, username: 'xXNovaXx', total: 91471},
    {userID: 99, username: 'itsShadow', total: 90087}
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
    let contri = localStorage.getItem('Total Conti');
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

