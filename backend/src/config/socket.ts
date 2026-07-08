import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN || "http://192.168.7.251:8085",
        "http://localhost:8085", 
        "http://127.0.0.1:8085"
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    // When a user connects, they can send a 'join' event with their empId
    socket.on("join", (empId: string) => {
      if (empId) {
        socket.join(empId);
        console.log(`Socket client ${socket.id} joined room: ${empId}`);
      }
    });

    // Also join generic rooms for roles (e.g. L2, L3, ADMIN)
    socket.on("joinRole", (role: string) => {
      if (role) {
        socket.join(role);
        console.log(`Socket client ${socket.id} joined role room: ${role}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
}

// Utility to send real-time notification to a specific employee or room
export function sendSocketNotification(target: string, data: any) {
  if (io) {
    io.to(target).emit("notification", data);
  }
}
