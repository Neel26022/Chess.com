const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniqueSocket) {
    console.log("connected");

    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("PlayerRole", "w");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("PlayerRole", "b");
    } else {
        uniqueSocket.emit("SpectatorRole");
    }

    uniqueSocket.on('disconnect', function () {
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardstate", chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniqueSocket.emit("invalid move", move);
            }
        } catch (error) {
            console.log(error);
            uniqueSocket.emit("invalid move", move);
        }
    });
});

server.listen(3000, function () {
    console.log("server started at 3000");
});
