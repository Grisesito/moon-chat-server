const express = require('express');
const socketio = require('socket.io');
const http = require('http');
// const cors = require('cors'); 
const { addUser, removeUser, getUser, getUsers } = require('./users');
const PORT = process.env.PORT || 5000;

const router = require('./router')
const app = express();
// app.use(cors());
const server = http.createServer(app);
const io = socketio(server,{
  cors:{
    origin:"http://localhost:8080",
    methods: ["GET", "POST"],
  }
});

app.use(router);
io.on('connect', (socket) => {
  socket.on('join', ({ name }, callback) => {
    const { error, user } = addUser({ id: socket.id, name });
    if(error) return callback(error);
    socket.join(user.name);
    socket.emit('message', { user: 'admin', text: `${user.name}, Bienvenido a Moon chat.`});
    socket.broadcast.emit('message', { user: 'admin', text: `${user.name} se ha unido a Moon!` });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    io.emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.emit('message', { user: 'Admin', text: `${user.name} se ha ido.` });
      io.emit('roomData', {  users: getUsers()});
    }
  })
});

server.listen(PORT,()=> console.log(`Server has started on port ${PORT}`));