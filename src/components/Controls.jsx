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
    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-3 md:gap-5 bg-[#020617]/60 backdrop-blur-2xl px-5 py-3 md:px-8 md:py-4 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/10 z-40 w-[96%] md:w-auto justify-center overflow-x-auto overflow-y-hidden">

      {/* MIC */}
      <button
        onClick={toggleMic}
        className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          micOn
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]"
        }`}
      >
        {micOn ? <Mic size={24} className="md:w-7 md:h-7" /> : <MicOff size={24} className="md:w-7 md:h-7" />}
      </button>

      {/* CAMERA */}
      <button
        onClick={toggleCamera}
        className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          camOn
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]"
        }`}
      >
        {camOn ? <Video size={24} className="md:w-7 md:h-7" /> : <VideoOff size={24} className="md:w-7 md:h-7" />}
      </button>

      {/* CHAT */}
      <button
        onClick={toggleChat}
        className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <MessageCircle size={24} className="md:w-7 md:h-7" />
      </button>

      {/* SWITCH */}
      <button
        onClick={onSwitch}
        className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-[1.1]"
      >
        <Repeat size={24} className="md:w-7 md:h-7" />
      </button>

      {/* END */}
      <button
        onClick={onEnd}
        className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-rose-600/80 text-white border border-rose-500 hover:bg-rose-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <PhoneOff size={24} className="md:w-7 md:h-7" />
      </button>

    </div>
  );
}