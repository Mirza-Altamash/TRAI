import http from "http";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./config/socket";
import fs from "fs";
import path from "path";

import { Employee } from "./models/Employee";
import { seedDatabase } from "./services/seed";
import { startAutoCloseJob } from "./jobs/autoCloseJob";

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Ensure the local uploads folder exists for ticket attachments
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB and start listening
connectDB().then(async () => {
  server.listen(env.PORT, env.HOST, () => {
    console.log(`TRAI API Server running in ${env.NODE_ENV} mode on ${env.HOST}:${env.PORT}`);
    // Start auto-close job
    startAutoCloseJob();
  });
}).catch((err) => {
  console.error("Failed to start server due to database connection issue:", err);
});
