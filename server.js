const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();

const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/user');
const path = require('path');
//set static folder

app.use(express.static(path.join(__dirname,'public')))

//run when client connect

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

            //welcome the current user
        socket.emit('message', formatMessage('Admin bot','Welcome to the chat'));

        //broadcast when a user connect

        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage('Admin bot',`${user.username} has join the chat`)
        );

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    }); 

    //listen for chatMessage

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    //run when the client disconnet 
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room)
            .emit(
                'message',
                formatMessage('',` ${user.username } has left the chat`)
            );

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        
    });

});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`server running on  ${PORT}`));