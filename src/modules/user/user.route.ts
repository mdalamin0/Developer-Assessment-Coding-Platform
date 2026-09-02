import { Router } from "express";
import { userControllers } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import validateRequest from "../../middlewares/validateRequest";
import { profileUpdateSchema } from "./user.validation";

const router = Router();

router.get(
  "/me",
  auth(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER),
  userControllers.getMe,
);

// router.patch(
//   "/me",
//   auth(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER),
//   validateRequest(profileUpdateSchema),
//   userControllers.updateMe,
// );

router.patch(
  "/profile-image",
  auth(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER),
  upload.single("profileImage"),
  userControllers.uploadProfileImage,
);

export const userRoutes = router;
