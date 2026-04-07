import { useNavigate } from "react-router-dom";
import { Video, ShieldCheck, MessageSquare, Zap } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden flex flex-col font-sans">
      
      {/* Background Glowing Blobs */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-600/30 rounded-full blur-[100px] md:blur-[140px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-600/30 rounded-full blur-[100px] md:blur-[140px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* ================= NAVBAR ================= */}
      <nav className="relative z-10 flex justify-between items-center px-4 py-3 md:px-12 md:py-6 bg-[#020617]/50 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Zap className="text-indigo-400" size={24} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">
            Peer<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Connect</span>
          </h1>
        </div>

        <button
          onClick={() => navigate("/call")}
          className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 md:px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 text-sm md:text-base"
        >
          Sign In
        </button>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative z-10 flex flex-1 flex-col justify-center items-center text-center px-4 py-16 md:py-24">
        
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs md:text-sm font-semibold tracking-wide backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Next-Gen Video Calling
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6 tracking-tight max-w-5xl">
          Connect Instantly <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            With Anyone, Anywhere
          </span>
        </h2>

        <p className="text-gray-400 max-w-2xl text-base md:text-lg lg:text-xl mb-10 leading-relaxed px-4">
          PeerConnect lets you start secure, real-time video and audio calls 
          with built-in chat support. Powered by advanced WebRTC for seamless communication.
        </p>

        <button
          onClick={() => navigate("/call")}
          className="group relative inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-xl font-bold text-white transition-all duration-300 shadow-[0_0_30px_rgba(79,70,229,0.4)] md:shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] md:hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Video className="group-hover:scale-110 transition-transform duration-300" size={24} />
          Start Video Call
        </button>

      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative z-10 py-12 md:py-16 px-4 md:px-12 lg:px-24 grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 text-center">

        <div className="group p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-lg hover:-translate-y-2 hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col items-center cursor-default">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full md:rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
            <Video className="text-indigo-400" size={28} />
          </div>
          <h3 className="text-lg md:text-2xl font-semibold mb-2 md:mb-3 text-white">
            HD Video Quality
          </h3>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Crystal clear peer-to-peer video streaming with ultra-low latency.
          </p>
        </div>

        <div className="group p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-lg hover:-translate-y-2 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all duration-500 flex flex-col items-center cursor-default">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full md:rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-inner">
            <ShieldCheck className="text-purple-400" size={28} />
          </div>
          <h3 className="text-lg md:text-2xl font-semibold mb-2 md:mb-3 text-white">
            Secure Connection
          </h3>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Direct WebRTC communication — no middle storage, fully end-to-end encrypted.
          </p>
        </div>

        <div className="group sm:col-span-2 md:col-span-1 p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-lg hover:-translate-y-2 hover:bg-white/10 hover:border-pink-500/50 hover:shadow-[0_0_40px_rgba(236,72,153,0.15)] transition-all duration-500 flex flex-col items-center cursor-default">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full md:rounded-2xl bg-pink-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
            <MessageSquare className="text-pink-400" size={28} />
          </div>
          <h3 className="text-lg md:text-2xl font-semibold mb-2 md:mb-3 text-white">
            Live Interactive Chat
          </h3>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Send real-time messages and share thoughts while staying connected on video.
          </p>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 text-center py-6 md:py-8 text-gray-500 text-xs md:text-sm border-t border-white/10 backdrop-blur-sm mt-auto">
        <p>© {new Date().getFullYear()} PeerConnect. All rights reserved.</p>
        <p className="mt-1 md:mt-2 opacity-70">Powered by WebRTC & Socket.IO</p>
      </footer>

    </div>
  );
}