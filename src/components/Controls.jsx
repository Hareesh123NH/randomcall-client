import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MessageCircle,
    Repeat,
    PhoneOff,
  } from "lucide-react";
  
  export default function Controls({
    micOn,
    camOn,
    toggleMic,
    toggleCamera,
    toggleChat,
    onSwitch,
    onEnd,
  }) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-[#1e293b]/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-gray-700 z-30">
  
        {/* MIC */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            micOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
  
        {/* CAMERA */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            camOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
  
        {/* CHAT */}
        <button
          onClick={toggleChat}
          className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition"
        >
          <MessageCircle size={20} />
        </button>
  
        {/* SWITCH */}
        <button
          onClick={onSwitch}
          className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition"
        >
          <Repeat size={20} />
        </button>
  
        {/* END */}
        <button
          onClick={onEnd}
          className="w-12 h-12 rounded-full bg-red-700 hover:bg-red-800 flex items-center justify-center transition"
        >
          <PhoneOff size={20} />
        </button>
  
      </div>
    );
  }