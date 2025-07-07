//REQUIREMENTS
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

//PROGRAM
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", //we show all origins fr now
        methods: ["GET","POST"]
    }
});

let globalCount = 0;

io.on('connection', (socket) => {
    console.log('🛐 New Connection Secured:', socket.id);

    //Send the current "count" in server to the user
    socket.emit('init', globalCount);

    //Handle increment events (the stuff that will increase the count)
    socket.on('increment', (amount = 1) => {
        globalCount += amount;
        console.log('➕ ${socket.id} added ${amount} -> New Count: ${globalCount}');
        io.emit('update', globalCount); //Broadcast the globalCount to everyone
    });

    socket.on('disconnect', () => {
        console.log('💀 Disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});
