import { Router } from "express";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listMembers
} from "../controllers/employeeController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Members route is accessed by regular users during ticket assignment/reassignment
router.get("/members", authenticateToken, listMembers);

// CRUD operations on employees (Admin only)
router.get("/", authenticateToken, requireRole(["ADMIN"]), listEmployees);
router.get("/:empId", authenticateToken, getEmployee);
router.post("/", authenticateToken, requireRole(["ADMIN"]), createEmployee);
router.put("/:empId", authenticateToken, requireRole(["ADMIN"]), updateEmployee);
router.delete("/:empId", authenticateToken, requireRole(["ADMIN"]), deleteEmployee);

export default router;
