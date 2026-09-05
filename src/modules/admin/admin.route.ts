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

router.get(
  "/all-users",
  auth(Role.ADMIN),
  adminControllers.getAllUsers,
);

router.patch(
  "/users/:id",
  auth(Role.ADMIN),
  adminControllers.updateUserStatus,
);

export const adminRoutes = router;
