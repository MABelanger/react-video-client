const express = require("express");

let io = require("socket.io")({
  path: "/webrtc"
});

const app = express();
const port = 8080;

app.use(express.static(__dirname + "/build"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/build/index.html");
});

const server = app.listen(port, () => {
  console.log(`Example app listen on port : ${port}`);
});
