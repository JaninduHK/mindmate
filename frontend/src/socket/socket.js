import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const socket = io(URL, {
  withCredentials: true
});