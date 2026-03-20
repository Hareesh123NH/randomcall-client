import { useState, useRef, useEffect } from "react";
import { pipeline, env } from "@xenova/transformers";

// Required for Vite/browser environments
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.logLevel = "fatal"; // Suppress the massive block of harmless ONNX graph warnings

const getAudioDataAt16kHz = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    // Use target sample rate of 16kHz for Whisper
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    // Return Float32Array of the first channel
    return audioBuffer.getChannelData(0);
};

export default function AudioRecorder() {
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [transcription, setTranscription] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Provide a way to cache the pipeline
    const transcriberRef = useRef(null);

    // Preload model on mount
    useEffect(() => {
        const loadModel = async () => {
            try {
                if (!transcriberRef.current) {
                    console.log("Loading Whisper model...");
                    // Using 'Xenova/whisper-tiny.en' which is ~40MB
                    transcriberRef.current = await pipeline(
                        "automatic-speech-recognition", 
                        "Xenova/whisper-tiny.en"
                    );
                    console.log("Model loaded successfully!");
                }
            } catch (err) {
                console.error("Error loading model:", err);
            }
        };
        loadModel();
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: "audio/webm" } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
                try {
                    setIsProcessing(true);
                    console.log("Decoding audio...");
                    const audioData = await getAudioDataAt16kHz(blob);
                    
                    // Transcribe using @xenova/transformers
                    await transcribeAudio(audioData);
                } catch (err) {
                    console.error("Error processing audio: ", err);
                } finally {
                    setIsProcessing(false);
                }
                
                // Cleanup tracks so the mic indicator turns off
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTranscription("");
            console.log("Recording started...");
        } catch (err) {
            console.error("Error accessing microphone: ", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log("Recording stopped...");
        }
    };

    const transcribeAudio = async (audioData) => {
        try {
            console.log("Transcribing audio...");
            if (!transcriberRef.current) {
                console.log("Initializing whisper model...");
                transcriberRef.current = await pipeline(
                    "automatic-speech-recognition", 
                    "Xenova/whisper-tiny.en"
                );
            }

            const output = await transcriberRef.current(audioData);
            console.log("Transcription:", output.text);
            setTranscription(output.text);
        } catch (err) {
            console.error("Whisper Error: ", err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Audio Whisper Test</h2>
            <div style={{ marginBottom: "20px" }}>
                <button 
                    onClick={startRecording} 
                    disabled={isRecording || isProcessing}
                    style={{ marginRight: "10px", padding: "10px", backgroundColor: "#3b82f6", color: "white", borderRadius: "5px", border: "none" }}
                >
                    Start Recording
                </button>
                <button 
                    onClick={stopRecording} 
                    disabled={!isRecording}
                    style={{ padding: "10px", backgroundColor: isRecording ? "#ef4444" : "#ccc", color: "white", borderRadius: "5px", border: "none" }}
                >
                    Stop Recording
                </button>
            </div>
            
            <div>
                {isRecording && <p style={{ color: "#ef4444", fontWeight: "bold" }}>🔴 Recording...</p>}
                {isProcessing && <p style={{ color: "#eab308", fontWeight: "bold" }}>⏳ Processing Audio & Transcribing...</p>}
                
                {transcription && (
                    <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f3f4f6", borderRadius: "8px", border: "1px solid #d1d5db" }}>
                        <strong style={{ display: "block", marginBottom: "5px" }}>Transcription Result (whisper-tiny.en):</strong>
                        <p style={{ margin: 0 }}>{transcription}</p>
                    </div>
                )}
            </div>
        </div>
    );
}