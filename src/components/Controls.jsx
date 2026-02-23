export default function Controls({
    micOn,
    camOn,
    toggleMic,
    toggleCamera,
    toggleChat,
  }) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-5 bg-[#1e293b]/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl z-30">
  
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition ${
            micOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>
  
        <button
          onClick={toggleCamera}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition ${
            camOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {camOn ? "📷" : "📵"}
        </button>
  
        <button
          onClick={toggleChat}
          className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-lg"
        >
          💬
        </button>
  
      </div>
    );
  }