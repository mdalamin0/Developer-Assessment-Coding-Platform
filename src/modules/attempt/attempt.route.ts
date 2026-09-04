import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { attemptControllers } from "./attempt.controller";


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

export const attemptRoutes = router;
