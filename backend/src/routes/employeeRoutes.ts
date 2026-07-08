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

// CRUD operations on employees (Admin/L3)
router.get("/", authenticateToken, requireRole(["ADMIN", "L3"]), listEmployees);
router.get("/:empId", authenticateToken, getEmployee);
router.post("/", authenticateToken, requireRole(["ADMIN", "L3"]), createEmployee);
router.put("/:empId", authenticateToken, requireRole(["ADMIN", "L3"]), updateEmployee);
router.delete("/:empId", authenticateToken, requireRole(["ADMIN", "L3"]), deleteEmployee);

export default router;
