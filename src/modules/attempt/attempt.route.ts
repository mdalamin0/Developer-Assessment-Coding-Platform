import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { attemptControllers } from "./attempt.controller";
import { submitAnswerValidationSchema } from "./attempt.validation";
import validateRequest from "../../middlewares/validateRequest";


const router = Router();

router.post(
  "/:assessmentId/start",
  auth(Role.CANDIDATE),
  attemptControllers.startAssessment
);

router.get(
  "/:attemptId",
  auth(Role.CANDIDATE),
  attemptControllers.getMySingleAttempt
);

router.get(
  "/:attemptId/questions",
  auth(Role.CANDIDATE),
  attemptControllers.getAttemptQuestions
);

router.post(
  "/:attemptId/answers",
  auth(Role.CANDIDATE),
  validateRequest(submitAnswerValidationSchema),
  attemptControllers.submitAnswer,
);

router.post(
  "/:attemptId/submit",
  auth(Role.CANDIDATE),
  attemptControllers.submitAssessment,
);

export const attemptRoutes = router;
