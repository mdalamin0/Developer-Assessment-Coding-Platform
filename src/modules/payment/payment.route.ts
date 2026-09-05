import { Router } from "express";
import { paymentControllers } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/create-payment",
  auth(Role.RECRUITER),
  paymentControllers.createPayment,
);
router.get("/bkash-payment/callback", paymentControllers.bkashPaymentCallback);

export const paymentRoutes = router;
