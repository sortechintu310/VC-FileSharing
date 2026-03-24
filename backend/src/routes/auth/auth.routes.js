import {Router} from "express";
import { getMe, login, signup } from "../../controllers/auth/auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;