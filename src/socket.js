// import { io } from "socket.io-client";

// export const socket = io("http://localhost:5000");


import { io } from "socket.io-client";

const backendUrl =import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";





export const socket = io(backendUrl, {
  autoConnect: false, // ❗ important
});