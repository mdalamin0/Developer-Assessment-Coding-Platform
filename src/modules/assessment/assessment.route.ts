import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import {
  addProblemValidationSchema,
  createAssessmentValidationSchema,
} from "./assessment.validation";
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

// Assessment-Problem Routes
router.post(
  "/:assessmentId/problems",
  auth(Role.RECRUITER),
  validateRequest(addProblemValidationSchema),
  assessmentControllers.addProblemToAssessment,
);

router.get(
  "/:assessmentId/problems",
  auth(Role.RECRUITER),
  assessmentControllers.getAssessmentProblems,
);

router.delete(
  "/:assessmentId/problems/:problemId",
  auth(Role.RECRUITER),
  assessmentControllers.removeProblemFromAssessment,
);

router.patch(
  "/:assessmentId/problems/reorder",
  auth(Role.RECRUITER),
  assessmentControllers.reorderAssessmentProblems,
);


router.get(
  "/candidate/available-assessments",
  auth(Role.CANDIDATE),
  assessmentControllers.getAvailableAssessments,
);



export const assessmentRoutes = router;
