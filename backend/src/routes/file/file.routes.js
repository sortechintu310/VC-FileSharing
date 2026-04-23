import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import {
  getFileById,
  getFileShares,
  getMyFiles,
  grantAccess,
  reconstructFile,
  uploadFile,
} from "../../controllers/file/file.controller.js";

const router = Router();

router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/my", protect, getMyFiles);
router.post("/reconstruct", protect, reconstructFile);
router.get("/:fileId", protect, getFileById);
router.get("/:fileId/shares", protect, getFileShares);
router.post("/:fileId/grant-access", protect, grantAccess);

export default router;
