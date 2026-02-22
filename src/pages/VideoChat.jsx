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
  const [showChat, setShowChat] = useState(true); // ✅ chat open by default
  const [connecting, setConnecting] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  /* ---------------- START MEDIA ---------------- */

  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);
    return stream;
  }, []);

  /* ---------------- AUTO START CALL ---------------- */
  // 1️⃣ Connect socket when component mounts
  // 1️⃣ Connect socket when component mounts
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected to server");
      socket.emit("ready");
    });

    return () => {
      socket.off("connect"); // remove listener
      socket.disconnect();
    };
  }, []);

  // 2️⃣ Start media + peer connection
  // 2️⃣ Start media + peer connection
  useEffect(() => {
    let peer;

    const initCall = async () => {
      const stream = await startMedia();

      peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerRef.current = peer;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // When remote stream arrives
      peer.ontrack = (e) => {
        remoteVideo.current.srcObject = e.streams[0];
      };

      // ICE candidates
      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("signal", { candidate: e.candidate });
        }
      };

      // Connection state
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setConnecting(false);
        }
      };

      /* ---------------- SIGNALING ---------------- */

      // Create offer (first user)
      socket.on("create-offer", async () => {
        console.log("🟡 Creating offer");

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("signal", { offer });
      });

      // Second user waits
      socket.on("wait-offer", () => {
        console.log("🟢 Waiting for offer...");
      });

      // Receive signal
      socket.on("signal", async (data) => {
        try {
          if (data.offer) {
            console.log("📩 Offer received");

            await peer.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("signal", { answer });
          }

          if (data.answer) {
            console.log("📩 Answer received");

            await peer.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          }

          if (data.candidate) {
            await peer.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }
        } catch (err) {
          console.error("Signal error:", err);
        }
      });

      // Partner left
      socket.on("partner-left", () => {
        console.log("❌ Partner left");
        setConnecting(true);
        remoteVideo.current.srcObject = null;
      });
    };

    initCall();

    return () => {
      socket.off("create-offer");
      socket.off("wait-offer");
      socket.off("signal");
      socket.off("partner-left");

      if (peer) {
        peer.close();
      }
    };
  }, [startMedia]);

  useEffect(() => {
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
  }, [localStream]);

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
        className={`${showChat ? "w-2/3" : "w-full"
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
        <div className="w-1/3 min-w-[300px] border-l border-gray-700 bg-[#1e293b]">
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
