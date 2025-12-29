import { useRef, useState, useEffect } from "react";
import { socket } from "./socket";

const VideoChat = () => {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const peerRef = useRef(null);
    const [started, setStarted] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    // Chat state
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    // Receive messages
    useEffect(() => {

        const handleChatMessage = (msg) => {
            console.log("💬 Received on client:", msg);
            setMessages(prev => [...prev, { self: false, text: msg }]);
          };
      
          socket.on("chat-message", handleChatMessage);

        socket.on("partner-left", () => {
            setMessages(prev => [...prev, { self: false, text: "⚠️ Partner disconnected" }]);
        });

        return () => {
            socket.off("chat-message");
            socket.off("partner-left");
        };
    }, []);


    // Send chat message
    const sendMessage = () => {
        if (!message.trim()) return;
        console.log("💬 Sending:", message);
        socket.emit("chat-message", message);
        setMessages(prev => [...prev, { self: true, text: message }]);
        setMessage("");
    };

    // One-time getUserMedia
    const startMedia = async () => {
        if (localStream) return localStream;

        console.log("🎥 Requesting camera and microphone...");
        let constraints = { video: true, audio: true };

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            if (!devices.some(d => d.kind === "videoinput")) {
                console.warn("⚠️ No camera found. Disabling video");
                constraints.video = false;
            }
            if (!devices.some(d => d.kind === "audioinput")) {
                console.warn("⚠️ No microphone found. Disabling audio");
                constraints.audio = false;
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("✅ Media stream obtained:", stream);
            setLocalStream(stream);
            localVideo.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error("❌ getUserMedia error:", err);
            alert("Failed to access camera/microphone: " + err.message);
            return null;
        }
    };

    const startCall = async () => {
        console.log("🟡 START button clicked");

        const stream = await startMedia();
        if (!stream) return;

        console.log("🔧 Creating RTCPeerConnection");
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerRef.current = peer;

        // Add local tracks
        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
            console.log(`➕ Added track: ${track.kind}`);
        });

        // Remote stream
        peer.ontrack = e => {
            console.log("📺 Remote track received");
            remoteVideo.current.srcObject = e.streams[0];
        };

        // ICE candidate
        peer.onicecandidate = e => {
            if (e.candidate) {
                console.log("🧊 ICE candidate generated");
                socket.emit("signal", { candidate: e.candidate });
            }
        };

        // Handle signals
        socket.on("create-offer", async () => {
            console.log("📨 Server says: CREATE OFFER");
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            console.log("📤 Offer sent");
            socket.emit("signal", { offer });
        });

        socket.on("signal", async data => {
            console.log("📩 Signal received:", Object.keys(data));

            if (data.offer) {
                console.log("📥 Offer received");
                await peer.setRemoteDescription(data.offer);
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                console.log("📤 Answer sent");
                socket.emit("signal", { answer });
            }

            if (data.answer) {
                console.log("📥 Answer received");
                await peer.setRemoteDescription(data.answer);
            }

            if (data.candidate) {
                console.log("🧊 ICE candidate received");
                await peer.addIceCandidate(data.candidate);
            }
        });

        console.log("📢 Sending READY to server");
        socket.emit("ready");
        setStarted(true);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            {!started && (
                <button
                    onClick={startCall}
                    style={{
                        padding: "20px 40px",
                        fontSize: "18px",
                        cursor: "pointer",
                        backgroundColor: "green",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                    }}
                >
                    START
                </button>
            )}

            <div style={{ marginTop: "20px" }}>
                <video
                    ref={localVideo}
                    autoPlay
                    muted
                    playsInline
                    width="300"
                    style={{ border: "1px solid gray", marginRight: "10px" }}
                />
                <video
                    ref={remoteVideo}
                    autoPlay
                    playsInline
                    width="300"
                    style={{ border: "1px solid gray" }}
                />
            </div>

            {started && (
                <div style={{ marginTop: "20px", maxWidth: "600px", margin: "20px auto", textAlign: "left" }}>
                    <div style={{ border: "1px solid gray", height: "200px", overflowY: "auto", padding: "10px" }}>
                        {messages.map((m, idx) => (
                            <div key={idx} style={{ textAlign: m.self ? "right" : "left", margin: "5px 0" }}>
                                <span
                                    style={{
                                        background: m.self ? "#dcf8c6" : "#f1f0f0",
                                        padding: "5px 10px",
                                        borderRadius: "10px",
                                        display: "inline-block",
                                    }}
                                >
                                    {m.text}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "10px", display: "flex" }}>
                        <input
                            type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{ flex: 1, padding: "10px", fontSize: "16px" }}
                            onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{ padding: "10px 20px", marginLeft: "5px", fontSize: "16px" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoChat;
