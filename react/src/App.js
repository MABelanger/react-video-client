import React, { useRef, useEffect, useState } from "react";

import io from "socket.io-client";

let candidates = [];

function App() {
  let localVideoRef = useRef(null);
  let remoteVideoRef = useRef(null);
  let textRef = useRef(null);
  let socket = useRef(null);

  // const pcConfig = null;
  const pcConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]
  };
  const pc = new RTCPeerConnection(pcConfig);

  useEffect(() => {
    connectPeer();
    startCamera();
    connectSocketIo();
  }, []);

  function onSuccess(stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track =>
      pc.addTrack(track, (localVideoRef.current.srcObject = stream))
    );
    // pc.addTrack(tracks[0]);
  }

  function onFailure(error) {
    console.log(error);
  }

  function startCamera() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    navigator.getUserMedia({ video: true }, onSuccess, onFailure);
  }

  function connectPeer() {
    pc.onicecandidate = e => {
      if (e.candidate) {
        console.log(JSON.stringify(e.candidate));

        sendToPeer("candidate", e.candidate);
      }
    };

    pc.oniceconnectionstatechange = e => {
      console.log(e);
    };

    pc.ontrack = e => {
      console.log("pc.ontrack(e)", e);
      remoteVideoRef.current.srcObject = e.streams[0];
    };
  }

  function createOffer() {
    console.log("Offer");
    pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);
        sendToPeer("offerOrAnswer", sdp);
      })
      .catch(e => {
        console.log(e);
      });
  }

  function setRemoteDescription() {
    const desc = JSON.parse(textRef.current.value);
    pc.setRemoteDescription(new RTCSessionDescription(desc));
  }

  function createAnswer() {
    console.log("Answer");
    pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);

        sendToPeer("offerOrAnswer", sdp);
      })
      .catch(e => {
        console.log(e);
      });
  }

  function addCandidate() {
    const candidate = JSON.parse(textRef.current.value);
    console.log("Adding candidate:", candidate);
    pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  function connectSocketIo() {
    socket = io("/webrtcPeer", {
      path: "/webrtc",
      query: {}
    });

    socket.on("connection-success", success => {
      console.log(success);
    });

    socket.on("offerOrAnswer", sdp => {
      textRef.current.value = JSON.stringify(sdp);
    });

    socket.on("candidate", candidate => {
      candidates = [...candidates, candidate];
    });
  }

  function sendToPeer(messageType, payload) {
    socket.emit(messageType, {
      socketID: socket.id,
      payload
    });
  }

  function renderVideo(ref, color) {
    return (
      <div>
        <video
          autoPlay
          ref={ref}
          style={{
            width: 240,
            height: 240,
            margin: 5,
            backgroundColor: color
          }}
        ></video>
      </div>
    );
  }

  return (
    <div className="App">
      {renderVideo(localVideoRef, "black")}
      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>
      <br />
      <textarea ref={textRef} />
      <button onClick={setRemoteDescription}>setRemoteDescription</button>
      <button onClick={addCandidate}>addCandidate</button>
      {renderVideo(remoteVideoRef, "yellow")}
    </div>
  );
}

export default App;
