//REQUIREMENTS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); //What is this used for?
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');
require('dotenv').config();

//PROGRAM

const app = express();
app.use(cors({ origin: "*" }));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //we show all origins fr now //origin: "https://spamyourkeyboard.io" (deploy time)
        methods: ["GET","POST"]
    }
});

//createClient() doesn't work with upstash damn
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL, //read from the .env file (untracked)
    token: process.env.UPSTASH_REDIS_TOKEN
})

//redis health checkUp :D
redis.set('test', 'ok').then(() => console.log('🧪 Redis reachable'));

async function getGlobalCount() {
    const val = await redis.get('globalCount');
    return parseInt(val) || 0;
}

//Past stored count logged on console
getGlobalCount().then(c => console.log("Initial GlobalCount =", c));

async function incrementGlobalCount(by) {
    //returns newCount in one go
    const newCount = await redis.incrby('globalCount',by);
    return newCount;
}

//Add or update user scores
async function updateUserScore(userID, username, increment) {
    // await redis.hset('usernames', userID, username); //HORRIBLY WRONG X( one write
    await redis.hset('usernames', {  
        [userID]: username  
    });
    const newScore = await redis.zincrby('leaderboard', increment, userID);
    return newScore;
}

//Serve static files from ../client
app.use(express.static(path.join(__dirname,'../client')));

//This regex matches any path that starts with "/" and never contains ":".
app.get(/^\/[^:]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

//Leaderboard Method()
async function getTopUsers(limit = 10) {
    //get top N userIDs + scores
    
    const raw = await redis.zrange('leaderboard', 0, limit - 1, {
        withScores: true,
        rev:        true,
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

    //fetch all usernames at once (ITS NOT FETCHING SHIT)
    const names = await redis.hmget('usernames', ...userIds) || [];
    //[ "username1", "username2", … ] same length as userIds

    //zip into the final array
    return userIds.map((id, i) => ({
        userID: id,
        username: names[i] != null ? names[i] : 'Anonymous',
        total: scores[i],
    }));
}

io.on('connection', (socket) => {
    console.log('🟩 New Connection Secured:', socket.id);

    //Send the current "count" & leaderboard in server to the user
    getGlobalCount().then(async count => {
        socket.emit('init', {
            count,
            leaderboard: await getTopUsers()
        })
    })

    //Handle increment events (the stuff that will increase the count)
    socket.on('increment', async ({userID,username,amount}) => {
        //UserID tamper protection
        if (!socket.userID) {
            socket.userID = userID;
            socket.userName = username;
        }

        if (socket.userID !== userID) {
            console.warn(`⚠️ Bro tried to change userID lmao: ${socket.id}`);
            return;
        }
        // await redis.hset('usernames', userID, username);
        await incrementGlobalCount(amount);
        await updateUserScore(userID,username,amount);

        //batch redis updates
        const[ , , newCount] = await redis
        .multi()
        .hset('usernames',{[userID]:username})
        .zincrby('leaderboard',amount,userID)
        .incrby('globalCount',amount)
        .exec(); 
        //[,, newCount] done for array destructuring and pulling out third element(incrby) of exec() returns

        const globalCount = parseInt(newCount, 10);
        const topUsers = await getTopUsers(); 
        console.log('⬆️ increment payload:', { userID, username, amount });
        console.log("TOP USERS: ", topUsers);
        io.emit('update', globalCount); //Broadcast the globalCount to everyone
        io.emit('leaderboard', topUsers); //Broadcase the leaderboard again
    });

    socket.on('disconnect', () => {
        console.log('⭕ Disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});
