import { Router } from "express";
import { resultControllers } from "./result.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/my-results", auth(Role.CANDIDATE), resultControllers.getMyResults);

router.get(
  "/:attemptId",
  auth(Role.CANDIDATE),
  resultControllers.getAttemptResult,
);

router.get(
  "/assessment/:assessmentId",
  auth(Role.RECRUITER),
  resultControllers.getAssessmentResults,
);

router.get(
  "/recruiter/:resultId",
  auth(Role.RECRUITER),
  resultControllers.getSingleResult,
);


export const resultRoutes = router;
