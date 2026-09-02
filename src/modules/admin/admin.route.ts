import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { adminControllers } from "./admin.controller";
import { updateAdminProfileSchema } from "./admin.validation";


const router = Router();

router.patch(
  "/me",
  auth(Role.ADMIN),
  validateRequest(updateAdminProfileSchema),
  adminControllers.updateAdminProfile,
);

export const adminRoutes = router;
