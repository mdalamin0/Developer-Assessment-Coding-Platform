import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { invitationControllers } from "./invitation.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createInvitationValidationSchema } from "./invitation.validation";

const router = Router();

router.post(
  "/:assessmentId",
  auth(Role.RECRUITER),
  validateRequest(createInvitationValidationSchema),
  invitationControllers.createInvitation,
);

router.get(
  "/my-invitations",
  auth(Role.RECRUITER),
  invitationControllers.getMyInvitations,
);

export const invitationRoutes = router;
