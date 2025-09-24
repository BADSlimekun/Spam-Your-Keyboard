//REQUIREMENTS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); //What is this used for?
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');

// require('dotenv').config({ path: path.join(__dirname, '.env') });
// const required = ['UPSTASH_REDIS_URL','UPSTASH_REDIS_TOKEN'];
// const missing = required.filter(k => !process.env[k]);
// if (missing.length) {
//     console.error('Missing env:', missing.join(', '));
//     process.exit(1);
// }

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// console.log("URL:", JSON.stringify(process.env.UPSTASH_REDIS_URL));
// console.log("TOKEN:", JSON.stringify(process.env.UPSTASH_REDIS_TOKEN));

//PROGRAM

const app = express();
app.use(cors({ origin: "*" }));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //we show all origins fr now //origin: "https://spamyourkeyboard.io" (deploy time)
        methods: ["GET","POST"]
    },
    transports: ['websocket']
});

//createClient() doesn't work with upstash damn
const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_URL || " ").trim(), //read from the .env file (untracked)
    token: process.env.UPSTASH_REDIS_TOKEN
});

//redis health checkUp :D
redis.set('test', 'ok').then(() => console.log('🧪 Redis reachable'));

async function getGlobalCount() {
    const val = await redis.get('globalCount');
    return parseInt(val) || 0;
}

//Past stored count logged on console
getGlobalCount().then(c => console.log("Initial GlobalCount =", c));

//Serve static files from ../client
app.use(express.static(path.join(__dirname,'client')));

//This regex matches any path that starts with "/" and never contains ":".
app.get(/^\/[^:]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

//Leaderboard Method()
async function getTopUsers(limit = 10) {
    //get top N userIDs + scores
    
    const raw = await redis.zrange('leaderboard', 0, limit - 1, {
        withScores: true,   //else it would give me just members IDs
        rev:        true,   //descending order
    });
    //raw = [ id1, score1, id2, score2, … ]

    //split into arrays
    const userIds = [], scores = [];
    for (let i = 0; i < raw.length; i += 2) {
        userIds.push(raw[i]);
        scores .push(parseInt(raw[i+1], 10));
    }
    
    if (raw.length === 0) {
        return [];   // no users yet
    }

    const namesLookUp = await redis.hmget('usernames', ...userIds) || []; // {id:name , ...}
    const names =  userIds.map(id => namesLookUp[id] ?? null);
    //[ "username1", "username2", … ] same length as userIds and in same sorted order

    //zip into the final array
    return userIds.map((id, i) => ({
        userID: id,
        username: names[i] != null ? names[i] : 'Anonymous',
        total: scores[i],
    }));
}

let latestCount = null;          // last known globalCount
let needCountPush = false;       // dirty flag

let lastLeaderboardPush = 0;     // time we last sent the leaderboard
const LEADERBOARD_INTERVAL = 1000;   // 1s is plenty

const logQueue = [];             // batch live logs
const LOG_FLUSH_INTERVAL = 300;  // 300 ms
const LOG_MAX_BATCH = 25;        // cap per flush

// start periodic broadcasters once (after io is created)
setInterval(async () => {
  // count: send only when changed & throttled to this tick
    if (needCountPush && latestCount !== null) {
        io.emit('update', latestCount);
        needCountPush = false;
    }

    // leaderboard: recompute & send at most once per interval
    const now = Date.now();
    if (now - lastLeaderboardPush >= LEADERBOARD_INTERVAL) {
        const topUsers = await getTopUsers();
        io.emit('leaderboard', topUsers);
        lastLeaderboardPush = now;
    }

    // logs: flush in small batches
    if (logQueue.length) {
        const batch = logQueue.splice(0, LOG_MAX_BATCH);
        io.emit('log_batch', batch); // client renders each line
    }
}, Math.min(LOG_FLUSH_INTERVAL, LEADERBOARD_INTERVAL));

let currentOnline = 0;

io.on('connection', (socket) => {
    console.log('🟩 New Connection Secured:', socket.id);
    currentOnline++;
    io.emit('onlineCount', currentOnline);

    //Send the current "count" & leaderboard in server to the user
    getGlobalCount().then(async count => {
        socket.emit('init', {
            count,
            leaderboard: await getTopUsers()
        })
    })

    //Handle increment events (the stuff that will increase the count)
    socket.on('increment', async ({userID,username,amount,rid}) => {
        //,userID,username,amount
        //tesdt
        if (rid !== undefined) socket.emit('ack', { rid });
        
        // --- SANITY: cap & sanitize username to 16 chars, no funny business ---
        let cleanName = username.trim().substring(0, 16);
        cleanName = cleanName.replace(/[^\w-]/g, '') || 'Anonymous';

        //UserID tamper protection
        if (!socket.userID) {
            socket.userID = userID;
            socket.userName = cleanName;
        }

        if (socket.userID !== userID) {
            console.warn(`tried to change userID lmao: ${socket.id}`);
            return;     //add some popup something
        }
        //batch redis updates
        const[ , , newCount] = await redis
           .multi()
           .hset('usernames',{[userID]:cleanName})
           .zincrby('leaderboard',amount,userID)
           .incrby('globalCount',amount)
           .exec(); 

        //[,, newCount] done for array destructuring and pulling out third element(incrby) of exec() returns
        

        // const globalCount = parseInt(newCount, 10);
        // const topUsers = await getTopUsers(); 
        latestCount  = parseInt(newCount, 10);
        needCountPush = true;
        logQueue.push({ username: cleanName, increment: amount, ts: Date.now() });
        // io.emit('update', globalCount); //Broadcast the globalCount to everyone
        // io.emit('leaderboard', topUsers); //Broadcase the leaderboard again
        // io.emit('log', { username:cleanName, increment:amount }); //Broadcast to all users the live log
    });
    socket.on('disconnect', () => {
        console.log('⭕ Disconnected:', socket.id);
        currentOnline = Math.max(0, currentOnline-1 );
        io.emit('onlineCount', currentOnline);
    });
});



server.listen(3000, "0.0.0.0", () => {
    console.log('✅ Server running at http://IP:3000');
});

//obtain port by the app engine
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
});
