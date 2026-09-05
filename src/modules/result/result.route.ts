import { Router } from "express";
import { resultController } from "./result.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  "/:attemptId",
  auth(Role.CANDIDATE),
  resultController.getAttemptResult,
);

export const resultRoutes = router;
