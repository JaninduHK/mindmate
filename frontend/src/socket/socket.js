import { io } from "socket.io-client";

// Get socket URL from environment variable, fallback to localhost:5000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

console.log("Socket connecting to:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});