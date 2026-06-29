import { Router } from "express";
import { login, refreshToken, logout, changePassword } from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/change-password", authenticateToken, changePassword);

export default router;
