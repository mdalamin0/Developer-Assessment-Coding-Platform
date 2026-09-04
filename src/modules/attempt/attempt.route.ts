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

export const attemptRoutes = router;
