import { Response } from "express";
import { Notification } from "../models/Notification";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const empId = req.user?.empId;

    if (!empId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Limit to latest 10 notifications, similar to frontend mock
    const notifications = await Notification.find({ empId })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json(notifications);
  } catch (error: any) {
    console.error("List notifications error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const empId = req.user?.empId;

    if (!empId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Notification.updateMany({ empId }, { read: true });
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const empId = req.user?.empId;

    if (!empId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notification = await Notification.findOne({ id, empId });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
