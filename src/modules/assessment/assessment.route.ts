import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { createAssessmentValidationSchema } from "./assessment.validation";
import { assessmentControllers } from "./assessment.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post(
  "/",
  auth(Role.RECRUITER),
  validateRequest(createAssessmentValidationSchema),
  assessmentControllers.createAssessment,
);

router.get(
  "/my-assessments",
  auth(Role.RECRUITER),
  assessmentControllers.getMyAssessments,
);

router.get(
  "/:id",
  auth(Role.RECRUITER, Role.ADMIN),
  assessmentControllers.getSingleAssessment,
);

router.patch(
  "/:id",
  auth(Role.RECRUITER),
  assessmentControllers.updateAssessment,
);

export const assessmentRoutes = router;