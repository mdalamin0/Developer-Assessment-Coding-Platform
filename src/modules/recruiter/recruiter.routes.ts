import { Router } from "express";
import { recruiterControllers } from "./recruiter.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { recruiterUpdateSchema } from "./recruiter.validation";
import { upload } from "../../lib/multer";

const router = Router();

router.patch(
  "/me",
  auth(Role.RECRUITER),
  upload.single("companyLogo"),
  validateRequest(recruiterUpdateSchema),
  recruiterControllers.updateRecruiterProfile,
);

router.get(
  "/dashboard-stats",
  auth(Role.RECRUITER),
  recruiterControllers.getRecruiterDashboardData,
);

router.get(
  "/assessment-statistics/:assessmentId",
  auth(Role.RECRUITER),
  recruiterControllers.getAssessmentStatistics,
);

export const recruiterRoutes = router;
