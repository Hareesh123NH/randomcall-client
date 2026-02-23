// export default function ChatPanel({
//     messages,
//     message,
//     setMessage,
//     sendMessage,
//   }) {
//     return (
//       <div className="h-full flex flex-col">
  
//         <div className="p-4 border-b border-gray-700 font-semibold">
//           Live Chat
//         </div>
  
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {messages.map((m, i) => (
//             <div key={i} className={m.self ? "text-right" : "text-left"}>
//               <span
//                 className={`inline-block px-3 py-2 rounded-lg text-sm ${
//                   m.self ? "bg-indigo-600" : "bg-gray-700"
//                 }`}
//               >
//                 {m.text}
//               </span>
//             </div>
//           ))}
//         </div>
  
//         {/* INPUT AREA FIXED */}
//         <div className="p-3 border-t border-gray-700 flex gap-2">
//           <input
//             value={message}
//             onChange={e => setMessage(e.target.value)}
//             onKeyDown={e => e.key === "Enter" && sendMessage()}
//             placeholder="Type message..."
//             className="flex-1 bg-[#0f172a] px-3 py-2 rounded-md outline-none"
//           />
//           <button
//             onClick={sendMessage}
//             className="bg-indigo-600 px-4 py-2 rounded-md whitespace-nowrap"
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     );
//   }


import { useEffect, useRef } from "react";

export default function ChatPanel({ messages, message, setMessage, sendMessage }) {
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 font-semibold">
        Live Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.self ? "text-right" : "text-left"}>
            <span
              className={`inline-block px-3 py-2 rounded-lg text-sm ${
                m.self ? "bg-indigo-600" : "bg-gray-700"
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
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          className="flex-1 bg-[#0f172a] px-3 py-2 rounded-md outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 px-4 py-2 rounded-md whitespace-nowrap"
        >
          Send
        </button>
      </div>
    </div>
  );
}