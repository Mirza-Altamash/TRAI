import { Response } from "express";
import { TrailLog } from "../models/TrailLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getTrailLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { ticketId } = req.params;
    const { search, role, action, page = 1, pageSize = 10, sortDir = "desc" } = req.query;

    const p = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    const query: any = { ticketId };

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { performedByName: searchRegex },
        { comment: searchRegex }
      ];
    }

    if (role) query.performerRole = role;
    if (action) {
      if (action === "Ticket Created") {
        query.action = { $regex: /Ticket Created/i };
      } else if (action === "Assignment") {
        // Match both 'Assigned' and 'Assignment' but avoid matching 'Reassigned'
        query.action = { $regex: /Assigned/i, $not: /Reassigned/i };
      } else if (action === "Reassignment") {
        query.action = { $regex: /Reassigned/i };
      } else if (action === "Resolve") {
        query.action = { $regex: /Resolve|Resolved/i };
      } else if (action === "Close") {
        query.action = { $regex: /Close|Closed/i };
      } else {
        query.action = action;
      }
    }

    const sortOrder = sortDir === "asc" ? 1 : -1;

    const total = await TrailLog.countDocuments(query);
    const logs = await TrailLog.find(query)
      .sort({ createdAt: sortOrder })
      .skip((p - 1) * size)
      .limit(size);

    return res.json({
      rows: logs,
      total,
      page: p,
      pageSize: size
    });
  } catch (error: any) {
    console.error("Get trail logs error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
