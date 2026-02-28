import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import itemRoutes from "./items.js";
import stickerRoutes from "./stickers.js";
import scanRoutes from "./scans.js";
import publicRoutes from "./public.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", userRoutes);
router.use("/items", itemRoutes);
router.use("/stickers", stickerRoutes);
router.use("/scans", scanRoutes);
router.use("/", publicRoutes);

export default router;
