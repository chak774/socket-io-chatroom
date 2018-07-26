const express = require('express');
const socket = require('socket.io');
const http = require('http');

const app = express();
const httpServer = http.Server(app);

app.get('/*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

const io = socket(httpServer);

//To Store Room Users
let roomUsers = {};

const joinRoom = (socket, roomName) => {
  console.log(`${socket.id} ${socket.userName} joined ${roomName}. `)
  socket.join(roomName);
  socket.room=roomName;
  if(!roomUsers[roomName]){
    roomUsers[roomName] = [];
  }
  if(roomUsers[roomName].indexOf(socket.userName)==-1 && socket.userName){
    roomUsers[roomName].push(socket.userName);
  }
}

const leaveRoom = (socket) => {
  console.log(`${socket.id} ${socket.userName} left ${socket.room}. `)
  socket.leaveAll();
  if(roomUsers[socket.room]){
    for(var i=0;i<roomUsers[socket.room].length;i++){
      if(roomUsers[socket.room][i]==socket.userName){
        roomUsers[socket.room].splice(i, 1);
      }
    }
  }
}

io.on('connection', function (socket) {
  console.log(`${socket.id} connected.`);

  socket.on('joinRoom', function(roomName){
    //Leave previous room first
    if(socket.room){
      leaveRoom(socket);
      //Update Previous Room Online Users
      io.to(socket.room).emit('updateOnlineUsers', roomUsers[socket.room]);
    }
    joinRoom(socket, roomName);
    //Update New Room Online Users
    io.to(socket.room).emit('updateOnlineUsers', roomUsers[socket.room]);
  });

  socket.on('newUser', function(userName){
    socket.userName=userName;
    joinRoom(socket, 'public');
    //Update Room Online Users
    io.to(socket.room).emit('updateOnlineUsers', roomUsers[socket.room]);
  });

  socket.on('updateOnlineUsers', function () {
    socket.to(socket.room).broadcast.emit('updateOnlineUsers', roomUsers[socket.roomName]);
  });

  socket.on('disconnect', function () {
    console.log(`${socket.id} disconnected.`);
    if(socket.room){
      leaveRoom(socket);
      //Update Previous Room Online Users
      io.to(socket.room).emit('updateOnlineUsers', roomUsers[socket.room]);
    }
  });

  socket.on('newMessage', function (msg) {
    //console.log('emit message to '+socket.room);
    socket.to(socket.room).broadcast.emit('newMessage', msg);
  });

  socket.on('typing', function (msg) {
    socket.to(socket.room).broadcast.emit('typing', msg);
  });

  socket.on('leaveTyping', function (msg) {
    socket.to(socket.room).broadcast.emit('leaveTyping', msg);
  });

});

httpServer.listen(8082, () => {
  console.log('Chatroom is started. Port: 8082')
});


