import express, { Application, Request, Response, urlencoded } from "express";
import cors from "cors";
import config from "./config";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.route";
import "./config/passport";
import { userRoutes } from "./modules/user/user.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { candidateRoutes } from "./modules/candidate/candidate.routes";
import { recruiterRoutes } from "./modules/recruiter/recruiter.routes";
import { adminRoutes } from "./modules/admin/admin.route";
import { assessmentRoutes } from "./modules/assessment/assessment.route";
import { problemRoutes } from "./modules/problem/problem.route";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  urlencoded({
    extended: true,
  }),
);
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Developer Assessment $ Coding Platfrom server is running successfully!",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/recruiters", recruiterRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/v1/problems", problemRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
