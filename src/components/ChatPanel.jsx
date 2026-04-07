import { useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";

export default function ChatPanel({ messages, message, setMessage, sendMessage }) {
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col font-sans text-white">
      <div className="p-4 md:p-5 border-b border-white/10 font-bold text-lg md:text-xl tracking-wide flex items-center gap-3 bg-white/5 backdrop-blur-md shadow-sm">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <MessageCircle size={24} className="text-indigo-400" />
        </div>
        Live Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
            <span
              className={`inline-block px-4 py-3 rounded-2xl text-sm md:text-base font-medium transition-all duration-300 hover:scale-[1.02] max-w-[85%] break-words ${
                m.self 
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 text-white rounded-br-sm" 
                  : "bg-white/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-sm shadow-md"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
        {/* Dummy div to scroll into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA FIXED */}
      <div className="p-3 md:p-5 border-t border-white/10 flex gap-2 md:gap-3 bg-black/20 backdrop-blur-lg">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:bg-white/10 px-4 py-3 rounded-xl outline-none min-w-0 transition-all duration-300 shadow-inner focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] placeholder-gray-500 text-sm md:text-base"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-500 p-3 md:px-6 md:py-3 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white"
        >
          <Send size={20} className="md:hidden" />
          <span className="hidden md:inline font-semibold tracking-wide">Send</span>
        </button>
      </div>
    </div>
  );
}