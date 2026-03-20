import { useRef, useState, useEffect, useCallback } from "react";
import { socket } from "../socket";
import VideoSection from "../components/VideoSection";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
import { pipeline, env } from "@xenova/transformers";

// Required for Vite/browser environments
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.logLevel = "fatal"; // Suppress the massive block of harmless ONNX graph warnings

const getAudioDataAt16kHz = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  return audioBuffer.getChannelData(0);
};

export default function VideoChat() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const transcriberRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false); // ✅ chat open by default
  const [connecting, setConnecting] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [subtitle, setSubtitle] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);

  /* ---------------- LOAD WHISPER MODEL ---------------- */
  useEffect(() => {
    const loadModel = async () => {
      try {
        if (!transcriberRef.current) {
          console.log("Loading Whisper model for Video Chat...");
          transcriberRef.current = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
          console.log("Model loaded successfully!");
          setModelLoaded(true);
        } else {
          setModelLoaded(true);
        }
      } catch (err) {
        console.error("Error loading model:", err);
      }
    };
    loadModel();
  }, []);

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
  useEffect(() => {
    const initCall = async () => {
      const stream = await startMedia();

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = (e) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
        }
      };

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("signal", { candidate: e.candidate });
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setConnecting(false);
        }
      };
    };

    initCall();

    return () => {
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [startMedia]);

  useEffect(() => {
    let pendingCandidates = [];

    const handleChat = msg => {
      setMessages(p => [...p, { self: false, text: msg }]);
    };

    socket.on("chat-message", handleChat);

    socket.on("subtitle", (text) => {
      console.log("📺 Subtitle received:", text);
      setSubtitle(text);
    });

    socket.on("create-offer", async () => {
      const peer = peerRef.current;
      if (!peer) return;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("signal", { offer });
    });

    socket.on("wait-offer", () => {
      console.log("🟢 Waiting for offer...");
    });

    socket.on("signal", async (data) => {
      const peer = peerRef.current;
      if (!peer) return;

      try {
        if (data.offer) {
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          // Add queued candidates
          for (const c of pendingCandidates) {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates = [];

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("signal", { answer });
        }

        if (data.answer) {
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );

          // Add queued candidates
          for (const c of pendingCandidates) {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates = [];
        }

        if (data.candidate) {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            pendingCandidates.push(data.candidate);
          }
        }
      } catch (err) {
        console.error("Signal error:", err);
      }
    });

    socket.on("partner-left", () => {
      setConnecting(true);
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
      setSubtitle(""); // clear subtitle when partner leaves
    });

    return () => {
      socket.off("create-offer");
      socket.off("wait-offer");
      socket.off("signal");
      socket.off("partner-left");
      socket.off("chat-message", handleChat);
      socket.off("subtitle")
    };
  }, []);

  /* ---------------- LIVE AUDIO TRANSCRIPTION ---------------- */
  useEffect(() => {
    if (!localStream || localStream.getAudioTracks().length === 0 || !modelLoaded) {
      return;
    }

    console.log("🎙️ Starting live transcription loop...");

    let isActive = true;
    let currentMediaRecorder = null;

    const recordAndTranscribe = () => {
      if (!isActive) return;

      try {
        const options = MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : undefined;

        // CRITICAL: localStream contains both Video and Audio tracks!
        // Recording a Video track into an audio/webm codec crashes MediaRecorder.
        // We must create an audio-only stream.
        const activeAudioTracks = localStream.getAudioTracks().filter(t => t.readyState === "live");
        if (activeAudioTracks.length === 0) {
          console.warn("⚠️ No live audio tracks found! Stopping transcription loop.");
          return;
        }

        const audioOnlyStream = new MediaStream(activeAudioTracks);

        // Define isolated instances for THIS iteration
        const recorder = new MediaRecorder(audioOnlyStream, options);
        currentMediaRecorder = recorder; // update global reference for cleanup

        let localAudioChunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            localAudioChunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          console.log(`⏹️ Recording stopped. Chunks collected: ${localAudioChunks.length}`);

          // 1. Immediately kick off the next recording loop
          if (isActive) {
            console.log("➡️ Restarting next loop...");
            recordAndTranscribe();
          } else {
            console.log("🛑 isActive is false, discarding loop repeat.");
          }

          console.log(`Chunks collected BEFORE transcription: ${localAudioChunks.length}`);

          // 2. Transcribe the chunk we just recorded if the pipeline is ready
          if (localAudioChunks.length > 0 && transcriberRef.current) {
            // Because localAudioChunks is isolated, it hasn't been cleared by the next loop!
            const blob = new Blob(localAudioChunks, { type: recorder.mimeType || "audio/webm" });
            try {
              console.log(`⚙️ Decoding ${blob.size} byte blob into 16kHz Float32Array...`);
              const audioData = await getAudioDataAt16kHz(blob);

              console.log("🧠 Passing array to Whisper model...");
              const output = await transcriberRef.current(audioData);
              const text = output.text ? output.text.trim() : "";

              // Whisper outputs "[BLANK_AUDIO]" or similar tags when it detects silence.
              if (text && !text.includes("[BLANK_AUDIO]")) {
                console.log("✅ Transcribed locally, sending to remote:", text);
                // ONLY send to remote peer, do not show on local screen
                socket.emit("subtitle", text);
              } else if (text.includes("[BLANK_AUDIO]")) {
                console.log("🔇 Silence detected (ignored).");
              } else {
                console.log("🈳 Empty transcription object returned.");
              }
            } catch (err) {
              console.error("❌ Transcription error:", err);
            }
          } else {
            console.warn("⚠️ No chunks collected or transcriber missing. Skipping transcription step.");
          }
        };

        // Start recording the current loop
        recorder.start();
        console.log("⏺️ MediaRecorder started successfully.");

        // Stop recording after 2 seconds to force the onstop logic & transcription
        setTimeout(() => {
          if (isActive && recorder.state === "recording") {
            recorder.stop();
          }
        }, 2000);

      } catch (err) {
        console.error("❌ Failed to setup transcription recorder:", err);
      }
    };

    // Begin loop immediately 
    recordAndTranscribe();

    return () => {
      isActive = false;
      if (currentMediaRecorder && currentMediaRecorder.state === "recording") {
        currentMediaRecorder.stop();
      }
    };
  }, [localStream, modelLoaded]);

  /* ---------------- VIDEO SYNC ---------------- */
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
          subtitle={subtitle}
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
