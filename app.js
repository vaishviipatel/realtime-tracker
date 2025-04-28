const express = require("express");
const app = express();

const http = require("http");
const path = require("path");

const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); // ✅ Fixed

io.on("connection", (socket) => {
    console.log("New user connected");

    socket.on("send-location", ({ latitude, longitude }) => {
        io.emit("receive-location", { latitude, longitude });
    });

    // Receive source & destination from user
    socket.on("set-route", ({ source, destination }) => {
        io.emit("update-route", { source, destination });
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
