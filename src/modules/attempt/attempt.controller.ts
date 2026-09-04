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

export const attemptControllers = {
  startAssessment,
};
