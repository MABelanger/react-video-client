import React, { useRef, useEffect, useState } from "react";

import io from "socket.io-client";

export function AppText() {
  let signalingTextRef = useRef(null);
  // let signalingTextRef = useRef(null);
  let socket = useRef(null);

  // const pcConfig = null;
  const pcConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  const pc = new RTCPeerConnection(pcConfig);
  let offerDataChannel = pc.createDataChannel("chat");

  function handleMessage(event) {
    console.log("I receive data from remote: ", event.data);
  }

  useEffect(() => {
    connectPeer();
    // text...
    connectSocketIo();
  }, []);

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
  }

  function createOffer() {
    console.log("createOffer");
    pc.createOffer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);
        sendToPeer("offerOrAnswer", sdp);
      })
      .catch((e) => {
        console.log(e);
      });

    offerDataChannel.onopen = (event) => {
      console.log("->>> dataChannel.onopen");
      // prit the received message

      offerDataChannel.send("Hi I want to chat");
    };
    offerDataChannel.onmessage = handleMessage;
  }

  function createAnswer() {
    console.log("createAnswer");
    pc.createAnswer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.setLocalDescription(sdp);

        sendToPeer("offerOrAnswer", sdp);
      })
      .catch((e) => {
        console.log(e);
      });

    pc.ondatachannel = function (event) {
      console.log("->>> ondatachannel");
      let answerDataChannel = event.channel;
      answerDataChannel.onopen = function (event) {
        answerDataChannel.send("Hi back!");
      };
      answerDataChannel.onmessage = handleMessage;
    };
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
      signalingTextRef.current.value = JSON.stringify(sdp);
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
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
      {
        //renderVideo(localVideoRef, "black", true)
      }
      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>
      <br />
      <textarea ref={signalingTextRef} />
      {
        //renderVideo(remoteVideoRef, "yellow", false)
      }
    </div>
  );
}

export default AppText;
