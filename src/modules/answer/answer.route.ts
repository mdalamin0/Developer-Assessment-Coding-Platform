import  { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { answerController } from "./answer.controller";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { evaluateAnswerValidationSchema } from "./answer.validation";

const router = Router();

router.get(
  "/pending",
  auth(Role.RECRUITER),
  answerController.getPendingAnswers,
);

router.get(
  "/:answerId",
  auth(Role.RECRUITER),
  answerController.getSingleAnswer,
);

router.post(
  "/:answerId",
  auth(Role.RECRUITER),
  validateRequest(evaluateAnswerValidationSchema),
  answerController.evaluateAnswer,
);



export const answerRoutes = router;
