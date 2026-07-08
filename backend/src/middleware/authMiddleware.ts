import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  user?: {
    empId: string;
    role: "ADMIN" | "USER" | "L2" | "L3";
    division: "IT" | "NSL" | "QoS" | "B&CS" | "F&EA" | "ALL";
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden: Insufficient permissions" });
    }
    next();
  };
}
