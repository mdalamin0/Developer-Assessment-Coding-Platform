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


export const assessmentRoutes = router;