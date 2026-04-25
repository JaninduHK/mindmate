import { io } from "socket.io-client";


export const socket = import.meta.env.VITE_SOCKET_URL
  ? io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true })
  : io({ withCredentials: true });


// Get socket URL from environment variable, fallback to localhost:5000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";


console.log("Socket connecting to:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

export default socket;

