import { useRef, useState, useEffect, useCallback } from "react";
import { socket } from "../socket";
import VideoSection from "../components/VideoSection";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";

export default function VideoChat() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [connecting, setConnecting] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const pendingCandidates = useRef([]);

  /* ---------------- START MEDIA ---------------- */
  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    return stream;
  }, []);

  /* ---------------- ASSIGN LOCAL VIDEO ---------------- */
  useEffect(() => {
    // ✅ Assign localStream to video element after it exists
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
  }, [localStream]);
  /* ---------------- SOCKET + PEER ---------------- */
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected to server");
      socket.emit("ready");
    });

    socket.on("create-offer", async () => {
      const stream = await startMedia();
      setupPeer(stream, true);
    });

    socket.on("wait-offer", async () => {
      const stream = await startMedia();
      setupPeer(stream, false);
    });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, { self: false, text: msg }]);
    });

    socket.on("partner-left", () => {
      setConnecting(true);
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
      if (peerRef.current) peerRef.current.close();
      peerRef.current = null;
    });

    return () => {
      socket.off("connect");
      socket.off("create-offer");
      socket.off("wait-offer");
      socket.off("chat-message");
      socket.off("partner-left");
      socket.disconnect();
    };
  }, []);

  /* ---------------- PEER SETUP ---------------- */
  const setupPeer = (stream, isOfferer) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = peer;

    // Add local tracks
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    // Show remote stream
    peer.ontrack = (e) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
      }
    };

    // ICE candidate
    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", { candidate: e.candidate });
      }
    };

    // Connection state
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setConnecting(false);
    };

    // Handle signals
    socket.on("signal", async (data) => {
      try {
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
          if (peer.remoteDescription) {
            await peer.addIceCandidate(data.candidate);
          } else {
            pendingCandidates.current.push(data.candidate);
          }
        }

        // Add queued candidates once remoteDescription is set
        if (peer.remoteDescription && pendingCandidates.current.length) {
          for (const c of pendingCandidates.current) {
            await peer.addIceCandidate(c);
          }
          pendingCandidates.current = [];
        }
      } catch (err) {
        console.error("Signal error:", err);
      }
    });

    // If offerer, create offer immediately
    if (isOfferer) {
      createOffer(peer);
    }

    // Set local video
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }
  };

  const createOffer = async (peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("signal", { offer });
  };

  /* ---------------- TOGGLES ---------------- */
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    });
  };

  /* ---------------- CHAT ---------------- */
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("chat-message", message);
    setMessages((prev) => [...prev, { self: true, text: message }]);
    setMessage("");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-screen bg-[#0f172a] text-white flex overflow-hidden">
      {/* VIDEO AREA */}
      <div
        className={`${
          showChat ? "w-2/3" : "w-full"
        } relative transition-all duration-300`}
      >
        <VideoSection
          connecting={connecting}
          localVideo={localVideo}
          remoteVideo={remoteVideo}
          camOn={camOn}
        />
        <Controls
          micOn={micOn}
          camOn={camOn}
          toggleMic={toggleMic}
          toggleCamera={toggleCamera}
          toggleChat={() => setShowChat(!showChat)}
        />
      </div>

      {/* CHAT AREA */}
      {showChat && (
        <div className="w-1/3 min-w-75 border-l border-gray-700 bg-[#1e293b]">
          <ChatPanel
            messages={messages}
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        </div>
      )}
    </div>
  );
}
