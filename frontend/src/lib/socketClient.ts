import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) ||
  (import.meta.env.VITE_API_URL as string)?.replace("/api", "") ||
  "http://localhost:5000";

let socket: Socket | null = null;

export function connectSocket(empId: string, role: string): Socket {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket.IO client connected. Joining rooms...");
    socket?.emit("join", empId);
    socket?.emit("joinRole", role);
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected.");
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
