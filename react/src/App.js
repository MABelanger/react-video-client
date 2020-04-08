import React, { useRef, useEffect, useState } from "react";

import io from "socket.io-client";

import clickSound from "./data/telephone-sound.base64.json";

export function playClickAudio() {
  let audio = new Audio("data:audio/mp3;base64," + clickSound.base64);
  audio.play();
}

function App() {
  let localVideoRef = useRef(null);
  let remoteVideoRef = useRef(null);
  let textRef = useRef(null);
  let socket = useRef(null);

  // const pcConfig = null;
  const pcConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };
  // const pcConfig = {
  //   iceServers: [
  //     {
  //       urls: "stun:173.194.207.127:19302"
  //     }
  //   ]
  // };

  const pc = new RTCPeerConnection(pcConfig);

  useEffect(() => {
    connectPeer();
    startCamera();
    connectSocketIo();
  }, []);

  function onSuccess(stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) =>
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
    navigator.getUserMedia({ video: true, audio: true }, onSuccess, onFailure);
  }

  function connectPeer() {
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log(JSON.stringify(e.candidate));

        sendToPeer("candidate", e.candidate);
      }
    };

    pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    pc.ontrack = (e) => {
      console.log("pc.ontrack(e)", e);
      remoteVideoRef.current.srcObject = e.streams[0];
    };
  }

  function createOffer() {
    console.log("Offer");
    pc.createOffer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);
        sendToPeer("offerOrAnswer", sdp);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function createAnswer() {
    console.log("Answer");
    pc.createAnswer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);

        sendToPeer("offerOrAnswer", sdp);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function connectSocketIo() {
    socket = io("/webrtcPeer", {
      path: "/webrtc",
      query: {},
    });

    socket.on("connection-success", (success) => {
      console.log(success);
    });

    socket.on("offerOrAnswer", (sdp) => {
      playClickAudio();
      textRef.current.value = JSON.stringify(sdp);
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("offerTelephoneSound", () => {
      playClickAudio();
    });

    socket.on("candidate", (candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  function sendToPeer(messageType, payload) {
    socket.emit(messageType, {
      socketID: socket.id,
      payload,
    });
  }

  function renderVideo(ref, color, isMuted) {
    return (
      <div>
        <video
          autoPlay
          muted={isMuted}
          ref={ref}
          style={{
            width: 240,
            height: 240,
            margin: 5,
            backgroundColor: color,
          }}
        ></video>
      </div>
    );
  }

  return (
    <div className="App">
      {renderVideo(localVideoRef, "black", true)}
      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>
      <br />
      <textarea ref={textRef} />
      {renderVideo(remoteVideoRef, "yellow", false)}
    </div>
  );
}

export default App;
