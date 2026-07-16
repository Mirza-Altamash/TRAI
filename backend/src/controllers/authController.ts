import { Response } from "express";
import crypto from "crypto";
import { Employee } from "../models/Employee";
import { RefreshToken } from "../models/RefreshToken";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  comparePassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../services/authService";

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { identifier, password, mode } = req.body; // mode: 'empId' | 'email'

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    // Find employee based on login mode
    const query = mode === "email"
      ? { email: identifier.toLowerCase() }
      : { empId: identifier.toUpperCase() };

    const employee = await Employee.findOne(query);

    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: "Account is inactive. Contact Administrator." });
    }

    // Validate password
    const isMatch = await comparePassword(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      empId: employee.empId,
      role: employee.role,
      division: employee.division
    });

    const refreshToken = generateRefreshToken({ empId: employee.empId });

    // Store refresh token with a 7 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      empId: employee.empId,
      token: refreshToken,
      expiresAt
    });

    // Write audit log
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: employee.empId,
      empName: employee.name,
      role: employee.role,
      action: "Login",
      createdAt: new Date()
    });

    // Clean up password hash before sending user info
    const userObj = employee.toObject();
    delete (userObj as any).passwordHash;

    return res.json({
      user: userObj,
      accessToken,
      refreshToken,
      mustChangePassword: employee.mustChangePassword
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function refreshToken(req: AuthenticatedRequest, res: Response) {
  try {
    const { refreshToken: clientToken } = req.body;

    if (!clientToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify token exists in database
    const tokenDoc = await RefreshToken.findOne({ token: clientToken });
    if (!tokenDoc) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Verify token structure
    let decoded;
    try {
      decoded = verifyRefreshToken(clientToken);
    } catch (err) {
      // Clean up invalid tokens
      await RefreshToken.deleteOne({ token: clientToken });
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    // Find the employee
    const employee = await Employee.findOne({ empId: decoded.empId });
    if (!employee || !employee.isActive) {
      await RefreshToken.deleteOne({ token: clientToken });
      return res.status(403).json({ message: "Employee inactive or not found" });
    }

    // Generate new tokens (Rotation)
    const newAccessToken = generateAccessToken({
      empId: employee.empId,
      role: employee.role,
      division: employee.division
    });

    const newRefreshToken = generateRefreshToken({ empId: employee.empId });

    // Replace old refresh token in database
    await RefreshToken.deleteOne({ token: clientToken });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      empId: employee.empId,
      token: newRefreshToken,
      expiresAt
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const { refreshToken: clientToken } = req.body;

    if (!clientToken) {
      return res.status(400).json({ message: "Refresh token is required to log out" });
    }

    const tokenDoc = await RefreshToken.findOne({ token: clientToken });
    if (tokenDoc) {
      // Find employee to write audit log
      const employee = await Employee.findOne({ empId: tokenDoc.empId });
      if (employee) {
        await AuditLog.create({
          id: crypto.randomUUID(),
          empId: employee.empId,
          empName: employee.name,
          role: employee.role,
          action: "Logout",
          createdAt: new Date()
        });
      }

      await RefreshToken.deleteOne({ token: clientToken });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { current, next } = req.body;
    const empId = req.user?.empId;

    if (!current || !next) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const employee = await Employee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Verify current password
    const isMatch = await comparePassword(current, employee.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash and update new password
    employee.passwordHash = await hashPassword(next);
    employee.mustChangePassword = false;
    await employee.save();

    // Write audit log
    await AuditLog.create({
      id: crypto.randomUUID(),
      empId: employee.empId,
      empName: employee.name,
      role: employee.role,
      action: "Password Change",
      createdAt: new Date()
    });

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    const empId = req.user?.empId;
    if (!empId) {
      return res.status(401).json({ message: "Unauthorized: Missing employee identity" });
    }
    const employee = await Employee.findOne({ empId });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: "Unauthorized: User not found or inactive" });
    }
    const userObj = employee.toObject();
    delete (userObj as any).passwordHash;
    return res.json({ user: userObj });
  } catch (error: any) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
