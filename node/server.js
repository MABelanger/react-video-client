const express = require("express");

const utils = require("./utils");
const dotenv = require("dotenv");

// read .env file and add it to process.env
dotenv.config();
// use the default env if .env is  not set.
if (
  !(
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production"
  )
) {
  utils.overwriteEnv(".env.default.development");
}

let io = require("socket.io")({
  path: "/webrtc"
});

const app = express();
const port = process.env.PORT;

app.use(express.static(__dirname + "/build"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/build/index.html");
});

const server = app.listen(port, () => {
  console.log(`Example app listen on port : ${port}`);
});

io.listen(server);

const peers = io.of("/webrtcPeer");

let connectedPeers = new Map();

peers.on("connection", socket => {
  console.log(socket.id);
  socket.emit("connection-success", { success: socket.id });
  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", data => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("offerOrAnswer", data.payload);
      }
    }
  });

  socket.on("candidate", data => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("candidate", data.payload);
      }
    }
  });
});
