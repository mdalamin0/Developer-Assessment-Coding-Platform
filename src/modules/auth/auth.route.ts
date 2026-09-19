import { Router } from "express";
import { authControllers } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  ForgotPasswordZodSchema,
  loginValidationSchema,
  registerValidationSchema,
  resendVerificationCodeSchema,
  ResetPasswordZodSchema,
  userVerifyEmailZodSchema,
} from "./auth.validation";
import passport from "passport";
import config from "../../config";

const router = Router();

router.post(
  "/register",
  validateRequest(registerValidationSchema),
  authControllers.registerUser,
);

router.post(
  "/resend-verification-code",
  validateRequest(resendVerificationCodeSchema),
  authControllers.resendVerificationCode,
);

router.post(
  "/verify-email",
  validateRequest(userVerifyEmailZodSchema),
  authControllers.verifyEmail,
);

router.post(
  "/login",
  validateRequest(loginValidationSchema),
  authControllers.loginUser,
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.frontend_url}/login?error=google-login-failed`,
  }),
  authControllers.googleCallback,
);


router.post("/logout", authControllers.logout);

router.post(
  "/forgot-password",
  validateRequest(ForgotPasswordZodSchema),
  authControllers.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(ResetPasswordZodSchema),
  authControllers.resetPassword,
);


export const authRoutes = router;
