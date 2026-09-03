import { Router } from "express";
import { problemControllers } from "./problem.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { createProblemValidationSchema, updateProblemValidationSchema } from "./problem.validation";

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

router.get(
  "/:id",
  auth(Role.RECRUITER, Role.ADMIN),
  problemControllers.getSingleProblem,
);

router.patch(
  "/:id",
  auth(Role.RECRUITER),
  validateRequest(updateProblemValidationSchema),
  problemControllers.updateProblem,
);

router.delete(
  "/:id",
  auth(Role.RECRUITER, Role.ADMIN),
  problemControllers.deleteProblem,
);

export const problemRoutes = router;
