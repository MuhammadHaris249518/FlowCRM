import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error-handler";
import { documentsController } from "./documents.controller";

const upload = multer({ storage: multer.memoryStorage() });

export const documentsRouter = Router();

documentsRouter.use(requireAuth());
documentsRouter.get("/", asyncHandler(documentsController.list));
documentsRouter.post("/", upload.single("file"), asyncHandler(documentsController.upload));
documentsRouter.get("/:id/download-url", asyncHandler(documentsController.getDownloadUrl));
documentsRouter.delete("/:id", asyncHandler(documentsController.delete));
