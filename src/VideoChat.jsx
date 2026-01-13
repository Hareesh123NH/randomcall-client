import { useRef, useState, useEffect, useCallback } from "react";
import { socket } from "./socket";

const VideoChat = () => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);



  /* -------------------- MEDIA -------------------- */

  const startMedia = useCallback(async () => {
    if (localStream) return localStream;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);
    return stream;
  }, [localStream]);

  /* Attach local stream AFTER video mounts */
  useEffect(() => {
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
  }, [localStream, started]);

  /* -------------------- TOGGLES -------------------- */

  const toggleMic = useCallback(() => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
      socket.emit("camera-toggle", track.enabled);
    });
  }, [localStream]);

  /* -------------------- SOCKET LISTENERS -------------------- */

  useEffect(() => {
    socket.on("chat-message", msg =>
      setMessages(p => [...p, { self: false, text: msg }])
    );

    socket.on("partner-left", () => {
      setRemoteCamOn(true);
      setMessages(p => [...p, { self: false, text: "⚠️ Partner disconnected" }])
    }
    );

    socket.on("remote-camera-toggle", setRemoteCamOn);

    socket.on("signal", async data => {
      const peer = peerRef.current;
      if (!peer) return;

      if (data.offer) {
        await peer.setRemoteDescription(data.offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal", { answer });
      }

      if (data.answer) {
        await peer.setRemoteDescription(data.answer);
      }

      if (data.candidate) {
        await peer.addIceCandidate(data.candidate);
      }
    });

    socket.on("create-offer", async () => {
      const peer = peerRef.current;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("signal", { offer });
    });

    return () => socket.removeAllListeners();
  }, []);

  /* -------------------- START CALL -------------------- */

  const startCall = async () => {
    const stream = await startMedia();

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = e => {
      remoteVideo.current.srcObject = e.streams[0];
      e.track.onmute = () => setRemoteCamOn(false);
      e.track.onunmute = () => setRemoteCamOn(true);
    };

    peer.onicecandidate = e => {
      if (e.candidate) socket.emit("signal", { candidate: e.candidate });
    };

    socket.emit("ready");
    setStarted(true);
  };

  /* -------------------- CHAT -------------------- */

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("chat-message", message);
    setMessages(p => [...p, { self: true, text: message }]);
    setMessage("");
  };

  /* -------------------- UI -------------------- */

  return (

    <div style={{ height: "100vh", display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row", }}>


      {/* ================= LEFT : VIDEO (2/3) ================= */}
      <div
        style={{
          flex: isMobile ? "0 0 60%" : 2,
          height: isMobile ? "60%" : "100%",
          position: "relative",
          background: "black",
          overflow: "hidden",
        }}
      >
        {!started && (
          <button
            onClick={startCall}
            style={btnStart}
          >
            ▶ Start Call
          </button>
        )}

        {/* REMOTE VIDEO */}
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />

        {started && !remoteCamOn && <Overlay />}

        {/* LOCAL VIDEO (BOTTOM RIGHT) */}
        {started && (
          <div
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              width: 180,
              height: 130,
              borderRadius: 10,
              overflow: "hidden",
              background: "black",
              boxShadow: "0 0 10px rgba(0,0,0,0.6)",
            }}
          >
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
            {!camOn && <Overlay />}
          </div>
        )}

        {/* CONTROLS */}
        {started && (
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 15,
            }}
          >


            <CircleBtn onClick={toggleMic} on={micOn} onIcon="🎤" offIcon="🔇" />
            <CircleBtn onClick={toggleCamera} on={camOn} onIcon="📷" offIcon="📵" />
          </div>
        )}
      </div>

      {/* ================= RIGHT : CHAT (1/3) ================= */}
    
      <div
        style={{
          flex: isMobile ? "0 0 40%" : 1,
          height: isMobile ? "40%" : "100%",
          display: "flex",
          flexDirection: "column",
          borderLeft: isMobile ? "none" : "1px solid #ccc",
          borderTop: isMobile ? "1px solid #ccc" : "none",
          background: "#fff",
          overflow: "hidden",
        }}
      >



        {started && (
          <ChatBox
            messages={messages}
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        )}


      </div>

    </div>
  );
};

/* -------------------- SMALL COMPONENTS -------------------- */

const Overlay = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
    }}
  >
    Camera Off
  </div>
);



const CircleBtn = ({ onClick, on, onIcon, offIcon }) => (
  <button
    onClick={onClick}
    style={{
      width: 48,
      height: 48,
      borderRadius: "50%",
      fontSize: 20,
      background: on ? "#007bff" : "#dc3545",
      color: "white",
      border: "none",
      cursor: "pointer",
    }}
  >
    {on ? onIcon : offIcon}
  </button>
);


const ChatBox = ({ messages, message, setMessage, sendMessage }) => {
  const bottomRef = useRef(null);

  // AUTO SCROLL TO LATEST MESSAGE
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        padding: 15,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          border: "1px solid gray",
          overflowY: "auto",
          padding: 10,
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.self ? "right" : "left" }}>
            <span
              style={{
                background: m.self ? "#dcf8c6" : "#f1f0f0",
                padding: "6px 10px",
                borderRadius: 10,
                display: "inline-block",
                marginBottom: 5,
              }}
            >
              {m.text}
            </span>
          </div>
        ))}

        {/* INVISIBLE ANCHOR */}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          placeholder="Send a message......"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={sendMessage} style={{ marginLeft: 5 }}>
          Send
        </button>
      </div>
    </div>
  );
};



const btnStart = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  padding: "10px 18px",
  fontSize: 14,
  background: "#28a745",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  zIndex: 5,
};

export default VideoChat;

