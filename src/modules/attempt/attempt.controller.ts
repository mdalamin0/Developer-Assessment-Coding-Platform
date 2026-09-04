import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { attemptServices } from "./attempt.service";

const startAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { assessmentId } = req.params;

  const result = await attemptServices.startAssessment(
    userId,
    assessmentId as string,
  );

  sendResponse(res, {
    message: "Assessment started successfully!",
    data: result,
  });
});

const getMySingleAttempt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { attemptId } = req.params;

  const result = await attemptServices.getMySingleAttempt(
    userId,
    attemptId as string,
  );

  sendResponse(res, {
    message: "Attempt retrieved successfully!",
    data: result,
  });
});

const getAttemptQuestions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { attemptId } = req.params;

  const result = await attemptServices.getAttemptQuestions(
    userId,
    attemptId as string,
  );

  sendResponse(res, {
    message: "Attempt questions retrieved successfully!",
    data: result,
  });
});

export const attemptControllers = {
  startAssessment,
  getMySingleAttempt,
  getAttemptQuestions,
};
