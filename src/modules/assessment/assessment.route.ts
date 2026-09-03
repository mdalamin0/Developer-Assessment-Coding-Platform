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
  "/all-assessments",
  auth(Role.RECRUITER, Role.ADMIN),
  assessmentControllers.getAllAssessments,
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

router.patch(
  "/:id/publish",
  auth(Role.RECRUITER),
  assessmentControllers.publishAssessment,
);

router.delete(
  "/:id",
  auth(Role.RECRUITER, Role.ADMIN),
  assessmentControllers.deleteAssessment,
);

export const assessmentRoutes = router;