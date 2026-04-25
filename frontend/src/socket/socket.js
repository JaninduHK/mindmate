import { io } from "socket.io-client";

export const socket = import.meta.env.VITE_SOCKET_URL
  ? io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true })
  : io({ withCredentials: true });