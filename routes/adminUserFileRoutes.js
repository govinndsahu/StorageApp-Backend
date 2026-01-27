import express from "express";
import { isOwner, isOwnerOrAdmin } from "../middlewares/authMiddleware.js";
import {
  deleteUserFile,
  readUserFile,
  renameUserFile,
  uploadInitiateUserFile,
} from "../controllers/adminUserFileController.js";
import { throttle } from "../utils/helpers.js";
import { renameLimiter } from "../utils/limiter.js";

const router = express.Router();

router.get("/read/user/file/:id", isOwnerOrAdmin, readUserFile);

router.post(
  "/upload/user/file/initiate/{:parentDirId}",
  throttle(2),
  isOwner,
  uploadInitiateUserFile,
);

router.delete("/delete/user/file/:id", isOwner, deleteUserFile);

router.patch(
  "/rename/user/file/:id",
  renameLimiter,
  throttle(1),
  isOwner,
  renameUserFile,
);

export default router;
