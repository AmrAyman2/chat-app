const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));


io.on("connection", (socket) => {
    socket.on("join-room", (username) => {
        socket.broadcast.emit("update", username + " has joined the chat");
    });

    socket.on("exit", (username) => {
        socket.broadcast.emit("update", username + " has left the chat");
    });

    socket.on("chat", (data) => {
        socket.broadcast.emit("chat", data);
    });

});
server.listen(5000);