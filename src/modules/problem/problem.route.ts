import { Router } from "express";
import { problemControllers } from "./problem.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { createProblemValidationSchema } from "./problem.validation";

const router = Router();

router.post(
  "/",
  auth(Role.RECRUITER),
  validateRequest(createProblemValidationSchema),
  problemControllers.createProblem,
);

router.get(
  "/my-problems",
  auth(Role.RECRUITER),
  problemControllers.getMyProblems,
);

export const problemRoutes = router;
