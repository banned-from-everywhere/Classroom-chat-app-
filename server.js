const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static
app.use(express.static(path.join(__dirname, "public")));

const botName = "Class Teacher";
//run when connect
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
 
    socket.join(user.room);
    // welcome
    socket.emit("message", formatMessage(botName, "welcome to the classroom"));

    //when user connect
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, ` ${user.username} has joined`));
    //  user,room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //when user disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} left`)
      );

      //  user,room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  // for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`running ${PORT}`));
