import { Router } from "express";
import { recruiterControllers } from "./recruiter.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import multer from "multer";
import validateRequest from "../../middlewares/validateRequest";
import { recruiterUpdateSchema } from "./recruiter.validation";
import { upload } from "../../lib/multer";

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (_req, file, cb) => {
//     const allowedMimeTypes = [
//       "image/jpeg",
//       "image/png",
//       "image/gif",
//       "image/webp",
//       "image/svg+xml",
//     ];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed for company logo upload."));
//     }
//   },
// });

const router = Router();

router.patch(
  "/me",
  auth(Role.RECRUITER),
  upload.single("companyLogo"),
  validateRequest(recruiterUpdateSchema),
  recruiterControllers.updateRecruiterProfile,
);

export const recruiterRoutes = router;
