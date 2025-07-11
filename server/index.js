//REQUIREMENTS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); //What is this used for?
const fs = require('fs');
const path = require('path');

//PROGRAM
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //we show all origins fr now
        methods: ["GET","POST"]
    }
});

//remember users and local JSON saving incase server goes down
const USER_FILE = path.join(__dirname, 'globalscores.json');
let state = {
    globalCount: 0,
    users: {}
} //userID -> {username,total}

function loadScoresFromFile() {
    try {
        if (fs.existsSync(USER_FILE)) {
            const raw = fs.readFileSync(USER_FILE);
            state = JSON.parse(raw);
            console.log("🧩 Loaded scores from JSON.")
        } else {
            console.log("🥲 No existing JSON found. Starting fresh.")
            state.users = {}
        }
    } catch (err) {
        console.error("😵 Failed to Load scores: ", err);
    }
}
//Load it from file on server restart
loadScoresFromFile();

function saveScoresToFile() {
    try {
        fs.writeFileSync(USER_FILE, JSON.stringify(state,null,2));
        console.log("📝 Saved scores to file");
    } catch (err) {
        console.error("☠️ Failed to save scores:",err);
    }
}
//Auto save every 10 seconds
setInterval(saveScoresToFile, 10000);

//Serve static files from ../client
app.use(express.static(path.join(__dirname,'../client')));

// Optional: redirect unknown routes to index.html (THIS OLD IT BROKE cuz * include http':')
// app.get('*', (req,res) => {
//     res.sendFile(path.join(__dirname, '../client/index.html'));
// });

// This regex matches any path that starts with "/" and never contains ":".
app.get(/^\/[^:]*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

//Leaderboard Method()
function getTopUsers(limit = 10) {
    return Object.entries(state.users) //get the objects of users in [key(userID),data{un,total}] array
    .sort((a,b) => b[1].total - a[1].total).slice(0,limit) //descending sort(b-a) on total, slice.
    .map(([userId,data]) => ({  //makes it a clean object array [{userID,un,total},{},{}...]
        userId,
        username: data.username,
        total: data.total
    }));
}


io.on('connection', (socket) => {
    console.log('🟩 New Connection Secured:', socket.id);

    //Send the current "count" in server to the user
    socket.emit('init', state.globalCount);

    //Handle increment events (the stuff that will increase the count)
    socket.on('increment', ({userID,username,amount}) => {
        //UserID tamper protection
        if (!socket.userID) {
            socket.userID = userID;
            socket.userName = username;
        }

        if (socket.userID !== userID) {
            console.warn(`⚠️ Bro tried to change userID lmao: ${socket.id}`);
            return;
        }

        state.globalCount += amount;

        //Updating user's stuff done
        const existing = state.users[userID] || { username, total:0 };
        existing.total += amount;
        state.users[userID] = existing;
        
        console.log(`➕ ${socket.id} added ${amount} -> New Count: ${state.globalCount}`);
        io.emit('update', state.globalCount); //Broadcast the globalCount to everyone
        io.emit('leaderboard', getTopUsers()); //Broadcase the leaderboard again
    });

    socket.on('disconnect', () => {
        console.log('⭕ Disconnected:', socket.id);
    });
});

const safeExit = () => {
    console.log("\n🚪 Performing a final save...")
    saveScoresToFile();
    process.exit();
};
process.on('SIGTERM', safeExit); // Cloud restart
process.on('SIGINT', safeExit); // CTRL + C cmd

server.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});
