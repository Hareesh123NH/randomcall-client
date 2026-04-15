import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import VideoSection from "../components/VideoSection";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
// eslint-disable-next-line no-unused-vars
import { pipeline, env } from "@xenova/transformers";
import { SarvamAIClient } from "sarvamai";

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;

// Required for Vite/browser environments
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.logLevel = "fatal"; // Suppress the massive block of harmless ONNX graph warnings

const float32ToRawPCMBase64 = (float32Array) => {
  const pcmBuffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(pcmBuffer);

  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // true = little endian (pcm_s16le)
  }

  const uint8Array = new Uint8Array(pcmBuffer);
  let binaryString = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(
      null,
      uint8Array.subarray(i, i + chunkSize),
    );
  }
  return btoa(binaryString);
};

const getAudioDataAt16kHz = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000,
  });
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  return audioBuffer.getChannelData(0);
};

export default function VideoChat() {
  const navigate = useNavigate();
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const allStreamsRef = useRef([]);

  // Ensure ANY created stream is completely stopped on unmount
  useEffect(() => {
    return () => {
      allStreamsRef.current.forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop());
      });
      allStreamsRef.current = [];
    };
  }, []);

  // eslint-disable-next-line no-unused-vars
  const transcriberRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false); // ✅ chat open by default
  const [connecting, setConnecting] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [remoteSubtitle, setRemoteSubtitle] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [modelLoaded, setModelLoaded] = useState(true); // For Sarvam, directly true

  /* ---------------- LOAD WHISPER MODEL ---------------- */
  useEffect(() => {
    // Commenting out Whisper
    /*
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
    */
    // For SarvamAI, we bypass Whisper loading
  }, []);

  /* ---------------- START MEDIA ---------------- */

  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    allStreamsRef.current.push(stream);
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
    let activeStream = null;

    const initCall = async () => {
      const stream = await startMedia();
      activeStream = stream;

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
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startMedia]);

  useEffect(() => {
    let pendingCandidates = [];

    const handleChat = (msg) => {
      setMessages((p) => [...p, { self: false, text: msg }]);
    };

    socket.on("chat-message", handleChat);

    socket.on("subtitle", (text) => {
      console.log("📺 Remote subtitle received:", text);
      setRemoteSubtitle(text);
      setTimeout(() => setRemoteSubtitle(""), 2000); // auto-clear after 2s
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
            new RTCSessionDescription(data.offer),
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
            new RTCSessionDescription(data.answer),
          );

          // Add queued candidates
          for (const c of pendingCandidates) {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates = [];
        }

        if (data.candidate) {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
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
      setRemoteSubtitle(""); // clear subtitle when partner leaves
    });

    return () => {
      socket.off("create-offer");
      socket.off("wait-offer");
      socket.off("signal");
      socket.off("partner-left");
      socket.off("chat-message", handleChat);
      socket.off("subtitle");
    };
  }, []);

  /* ---------------- LIVE AUDIO TRANSCRIPTION ---------------- */
  useEffect(() => {
    if (
      !localStream ||
      localStream.getAudioTracks().length === 0 ||
      !modelLoaded ||
      connecting
    ) {
      return;
    }

    console.log("🎙️ Starting live transcription loop...");

    let isActive = true;
    let currentMediaRecorder = null;

    // --- Initialize Sarvam AI Client ONCE per session ---
    let sarvamSocket = null;
    let socketOpen = false;

    const initSarvam = async () => {
      try {
        // console.log("_API KEY___", SARVAM_API_KEY);
        const client = new SarvamAIClient({
          apiSubscriptionKey: SARVAM_API_KEY,
        });

        // connect() returns a Promise, so we MUST await it!
        sarvamSocket = await client.speechToTextStreaming.connect({
          model: "saaras:v3",
          mode: "translate",
          "language-code": "en-IN",
          high_vad_sensitivity: "true",
          reconnectAttempts: 3,
          input_audio_codec: "pcm_s16le", // Explicitly state raw 16-bit PCM since it's a stream
        });

        sarvamSocket.on("open", () => {
          console.log("✅ Sarvam WebSocket OPENED! Ready for audio chunks.");
          socketOpen = true;
        });

        sarvamSocket.on("error", (error) => {
          console.error("❌ Sarvam WebSocket Error:", error);
        });

        // Intercept raw websocket messages to see if the SDK is crashing during parse
        if (sarvamSocket.socket) {
          sarvamSocket.socket.addEventListener("message", (event) => {
            console.log("🌐 RAW WS MESSAGE EVENT:", event.data);
          });
          sarvamSocket.socket.addEventListener("error", (err) => {
            console.error("🌐 RAW WS ERROR EVENT:", err);
          });
        }

        sarvamSocket.on("close", () => {
          console.log("Sarvam socket closed");
          socketOpen = false;
        });

        sarvamSocket.on("message", (response) => {
          console.log("Result:", response);
          let text = "";

          if (typeof response === "string") {
            try {
              const parsed = JSON.parse(response);
              if (parsed.data?.transcript) text = parsed.data.transcript;
              else if (parsed.text) text = parsed.text;
              else if (parsed.transcript) text = parsed.transcript;
            } catch {
              // Ignore parse errors
              text = response;
            }
          } else if (response?.data?.transcript !== undefined) {
            text = response.data.transcript; // ✅ Main path: {type:"data", data:{transcript:"..."}}
          } else if (response?.text) {
            text = response.text;
          } else if (response?.transcript) {
            text = response.transcript;
          }

          console.log("✅ Translated", text);

          if (text && text.trim() && !text.includes("[BLANK_AUDIO]")) {
            console.log("✅ Translated with Sarvam, sending to remote:", text);
            socket.emit("subtitle", text); // Send to remote partner
          }
        });
      } catch (err) {
        console.error("Failed to initialize Sarvam Socket:", err);
      }
    };

    initSarvam();

    const recordAndTranscribe = () => {
      if (!isActive) return;

      try {
        const options = MediaRecorder.isTypeSupported("audio/webm")
          ? { mimeType: "audio/webm" }
          : undefined;

        // CRITICAL: localStream contains both Video and Audio tracks!
        const activeAudioTracks = localStream
          .getAudioTracks()
          .filter((t) => t.readyState === "live");
        if (activeAudioTracks.length === 0) {
          console.warn(
            "⚠️ No live audio tracks found! Stopping transcription loop.",
          );
          return;
        }

        const audioOnlyStream = new MediaStream(activeAudioTracks);
        const recorder = new MediaRecorder(audioOnlyStream, options);
        currentMediaRecorder = recorder;

        let localAudioChunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            localAudioChunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          console.log(
            `⏹️ Recording stopped. Chunks collected: ${localAudioChunks.length}`,
          );

          if (isActive) {
            console.log("➡️ Restarting next loop...");
            recordAndTranscribe();
          }

          // 2. Transcribe the chunk we just recorded
          if (localAudioChunks.length > 0) {
            const blob = new Blob(localAudioChunks, {
              type: recorder.mimeType || "audio/webm",
            });

            // Ignore tiny empty blobs (usually 110 bytes of webm headers)
            if (blob.size < 1000) {
              console.log(`Skipping small blob of size ${blob.size} bytes.`);
              return;
            }

            try {
              console.log(
                `⚙️ Decoding ${blob.size} byte blob into 16kHz Float32Array...`,
              );
              const audioData = await getAudioDataAt16kHz(blob);
              console.log("🧠 Passing raw PCM chunk to Sarvam API...");
              const base64Audio = float32ToRawPCMBase64(audioData);

              if (
                sarvamSocket &&
                (socketOpen || sarvamSocket.readyState === 1)
              ) {
                console.log("🚀 Calling sarvamSocket.transcribe()...");
                sarvamSocket.transcribe({
                  audio: base64Audio,
                  sample_rate: 16000,
                  encoding: "audio/wav",
                });

                // Explicitly send a flush signal so the server knows this chunk is complete
                // and forces the transcript to be returned immediately instead of buffering.
                if (typeof sarvamSocket.flush === "function") {
                  sarvamSocket.flush();
                  console.log("💨 Called sarvamSocket.flush() successfully!");
                } else {
                  console.warn("⚠️ sarvamSocket.flush is not a function!");
                }
              } else {
                console.warn("⚠️ Sarvam Socket not open, skipping chunk...");
              }
            } catch (err) {
              console.error("❌ Transcription error:", err);
            }
          } else {
            console.warn(
              "⚠️ No chunks collected. Skipping transcription step.",
            );
          }
        };

        recorder.start();
        console.log("⏺️ MediaRecorder started successfully.");

        // Stop recording after 2 seconds
        setTimeout(() => {
          if (isActive && recorder.state === "recording") {
            recorder.stop();
          }
        }, 3000);
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
      if (sarvamSocket) {
        try {
          sarvamSocket.close();
        } catch {
          // ignore
        }
      }
    };
  }, [localStream, modelLoaded, connecting]);

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

  const onSwitch = () => {
    window.location.reload();
  };

  const onEnd = () => {
    allStreamsRef.current.forEach((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
    });
    navigate("/");
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
    <div className="h-screen bg-[#020617] text-white flex flex-col md:flex-row overflow-hidden relative font-sans">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* VIDEO AREA */}
      <div
        className={`${
          showChat ? "h-1/2 md:h-full md:w-2/3" : "h-full w-full"
        } relative transition-all duration-500 shrink-0 md:shrink z-10 flex flex-col justify-center items-center`}
      >
        <VideoSection
          connecting={connecting}
          localVideo={localVideo}
          remoteVideo={remoteVideo}
          camOn={camOn}
          remoteSubtitle={remoteSubtitle}
        />

        <Controls
          micOn={micOn}
          camOn={camOn}
          toggleMic={toggleMic}
          toggleCamera={toggleCamera}
          toggleChat={() => setShowChat(!showChat)}
          onSwitch={onSwitch}
          onEnd={onEnd}
        />
      </div>

      {/* CHAT AREA */}
      {showChat && (
        <div className="h-1/2 md:h-full w-full md:w-1/3 min-w-[320px] md:border-l border-white/10 bg-[#020617]/70 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.3)] relative z-20 transition-all duration-300">
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
