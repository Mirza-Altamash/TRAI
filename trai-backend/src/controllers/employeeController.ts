import { Response } from "express";
import crypto from "crypto";
import { Employee } from "../models/Employee";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { hashPassword } from "../services/authService";

export async function listEmployees(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, division, role, subRole, page = 1, pageSize = 10, sortDir = "desc" } = req.query;

    const p = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { name: searchRegex },
        { empId: searchRegex },
        { email: searchRegex }
      ];
    }

    if (division) query.division = division;
    if (role) query.role = role;
    if (subRole) query.subRole = subRole;

    const sortOrder = sortDir === "asc" ? 1 : -1;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort({ createdAt: sortOrder })
      .skip((p - 1) * size)
      .limit(size)
      .select("-passwordHash"); // Exclude hashed passwords

    return res.json({
      rows: employees,
      total,
      page: p,
      pageSize: size
    });
  } catch (error: any) {
    console.error("List employees error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function getEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    const { empId } = req.params;
    const employee = await Employee.findOne({ empId }).select("-passwordHash");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (error: any) {
    console.error("Get employee error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function createEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    const { empId, name, email, role, subRole, division, designation, floor, isActive } = req.body;

    if (!empId || !name || !email || !role || !division || !designation || !floor) {
      return res.status(400).json({ message: "Missing required employee fields" });
    }

    // Check if empId or email already exists
    const existing = await Employee.findOne({ $or: [{ empId }, { email: email.toLowerCase() }] });
    if (existing) {
      return res.status(400).json({ message: "Employee ID or Email already exists" });
    }

    // Hash default password for new accounts
    const passwordHash = await hashPassword("Password123");

    const newEmp = await Employee.create({
      empId: empId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      subRole: subRole || null,
      division,
      designation,
      floor,
      isActive: isActive !== undefined ? isActive : true
    });

    // Write audit log
    if (req.user) {
      await AuditLog.create({
        id: crypto.randomUUID(),
        empId: req.user.empId,
        empName: (await Employee.findOne({ empId: req.user.empId }))?.name || "System Admin",
        role: req.user.role,
        action: "Employee Create",
        context: newEmp.empId,
        createdAt: new Date()
      });
    }

    const resObj = newEmp.toObject();
    delete (resObj as any).passwordHash;

    return res.status(201).json(resObj);
  } catch (error: any) {
    console.error("Create employee error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function updateEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    const { empId } = req.params;
    const patch = req.body;

    // Prevent modifying sensitive keys directly through basic update
    delete patch._id;
    delete patch.empId;
    delete patch.passwordHash;

    const employee = await Employee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Apply updates
    Object.assign(employee, patch);
    await employee.save();

    // Write audit log
    if (req.user) {
      await AuditLog.create({
        id: crypto.randomUUID(),
        empId: req.user.empId,
        empName: (await Employee.findOne({ empId: req.user.empId }))?.name || "System Admin",
        role: req.user.role,
        action: "Employee Update",
        context: employee.empId,
        createdAt: new Date()
      });
    }

    const resObj = employee.toObject();
    delete (resObj as any).passwordHash;

    return res.json(resObj);
  } catch (error: any) {
    console.error("Update employee error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function deleteEmployee(req: AuthenticatedRequest, res: Response) {
  try {
    const { empId } = req.params;
    const employee = await Employee.findOne({ empId });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Employee.deleteOne({ empId });

    // Write audit log
    if (req.user) {
      await AuditLog.create({
        id: crypto.randomUUID(),
        empId: req.user.empId,
        empName: (await Employee.findOne({ empId: req.user.empId }))?.name || "System Admin",
        role: req.user.role,
        action: "Employee Delete",
        context: empId,
        createdAt: new Date()
      });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function listMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, subRole } = req.query;

    if (!role || !subRole) {
      return res.status(400).json({ message: "Role and subRole query parameters are required" });
    }

    const query = {
      role: role as string,
      subRole: subRole as string,
      isActive: true
    };

    const members = await Employee.find(query).select("empId name role subRole division isActive designation");
    return res.json(members);
  } catch (error: any) {
    console.error("List members error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
