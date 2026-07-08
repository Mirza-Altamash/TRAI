import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/authRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import trailRoutes from "./routes/trailRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();

app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "http://192.168.7.251:8085",
    "http://localhost:8085", 
    "http://127.0.0.1:8085"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded ticket attachments
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

import { authenticateToken } from "./middleware/authMiddleware";
import { exportExcelController, exportPdfController } from "./controllers/ticketController";

// Register routers
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/trail", trailRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", reportRoutes);

app.get("/api/user/my-tickets/export/excel", authenticateToken, exportExcelController);
app.get("/api/user/my-tickets/export/pdf", authenticateToken, exportPdfController);

// API health endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

export default app;
