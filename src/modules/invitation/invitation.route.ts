import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { invitationControllers } from "./invitation.controller";

const router = Router();

router.post("/", auth(Role.RECRUITER), invitationControllers.createInvitation);

export const invitationRoutes = router;
