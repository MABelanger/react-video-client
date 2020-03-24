import React, { useRef, useEffect } from 'react';


function App() {
  const videoRef = useRef(null);

  function onSuccess(stream){
    videoRef.current.srcObject = stream;
  }

  function onFailure(error){
    console.log(error);
  }

  useEffect(()=>{
    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

    navigator.getUserMedia( {video: true}, onSuccess, onFailure )
  },[])

  return (
    <div className="App">
        <video ref={videoRef}  autoPlay></video>
    </div>
  );
}

export default App;
