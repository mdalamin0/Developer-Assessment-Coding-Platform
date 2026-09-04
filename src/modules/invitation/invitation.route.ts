import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { invitationControllers } from "./invitation.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createInvitationValidationSchema, invitationResponseValidationSchema } from "./invitation.validation";

const router = Router();

router.post(
  "/:assessmentId",
  auth(Role.RECRUITER),
  validateRequest(createInvitationValidationSchema),
  invitationControllers.createInvitation,
);

router.get(
  "/recruiter/my-invitations",
  auth(Role.RECRUITER),
  invitationControllers.getRecruiterMyInvitations,
);

router.get(
  "/candidate/my-invitations",
  auth(Role.CANDIDATE),
  invitationControllers.getCandidateMyInvitations,
);


router.patch(
  "/:invitationId/respond",
  auth(Role.CANDIDATE),
  validateRequest(invitationResponseValidationSchema),
  invitationControllers.respondToInvitation,
);

export const invitationRoutes = router;
