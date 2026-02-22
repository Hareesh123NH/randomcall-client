import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">

      {/* ================= NAVBAR ================= */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-wide">
          Peer<span className="text-indigo-500">Connect</span>
        </h1>

        <button
          onClick={() => navigate("/call")}
          className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium transition"
        >
          Start Call
        </button>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="flex flex-1 flex-col justify-center items-center text-center px-6">

        <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Connect Instantly <br />
          With Anyone, Anywhere
        </h2>

        <p className="text-gray-400 max-w-2xl text-lg mb-10">
          PeerConnect lets you start secure, real-time video and audio calls 
          with built-in chat support. Powered by WebRTC and Socket.IO 
          for fast and seamless communication.
        </p>

        <button
          onClick={() => navigate("/call")}
          className="bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
        >
          🚀 Start Video Call
        </button>

      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-[#111827] py-16 px-8 grid md:grid-cols-3 gap-10 text-center">

        <div className="p-6 rounded-xl bg-[#1f2937] hover:bg-[#273549] transition">
          <h3 className="text-xl font-semibold mb-3 text-indigo-400">
            🎥 HD Video
          </h3>
          <p className="text-gray-400">
            Crystal clear peer-to-peer video streaming with low latency.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#1f2937] hover:bg-[#273549] transition">
          <h3 className="text-xl font-semibold mb-3 text-indigo-400">
            🔒 Secure Connection
          </h3>
          <p className="text-gray-400">
            Direct WebRTC communication — no middle storage, fully secure.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#1f2937] hover:bg-[#273549] transition">
          <h3 className="text-xl font-semibold mb-3 text-indigo-400">
            💬 Live Chat
          </h3>
          <p className="text-gray-400">
            Send real-time messages while staying connected on video.
          </p>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-800">
        © 2026 PeerConnect. All rights reserved.
      </footer>

    </div>
  );
}