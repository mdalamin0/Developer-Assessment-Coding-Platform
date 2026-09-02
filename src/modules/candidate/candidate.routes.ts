import { Router } from "express";
import { candidateControllers } from "./candidate.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import multer from "multer";
import validateRequest from "../../middlewares/validateRequest";
import { candidateUpdateSchema } from "./candidate.validation";
import { upload } from "../../lib/multer";

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (_req, file, cb) => {
//     const allowedMimeTypes = [
//       "application/pdf",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     ];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF and DOCX files are allowed for resume upload."));
//     }
//   },
// });

const router = Router();

router.patch(
  "/me",
  auth(Role.CANDIDATE),
  upload.single("resume"),
  validateRequest(candidateUpdateSchema),
  candidateControllers.updateCandidateProfile,
);

export const candidateRoutes = router;
