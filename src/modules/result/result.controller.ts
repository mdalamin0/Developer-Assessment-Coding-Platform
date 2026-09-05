import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { resultService } from "./result.service";
import { catchAsync } from "../../utils/catchAsync";

const getAttemptResult = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const userId = req.user?.id!;

  const result = await resultService.getAttemptResult(
    userId,
    attemptId as string,
  );

  sendResponse(
    res,
    {
      message: "Result retrieved successfully.",
      data: result,
    },
    httpStatus.OK,
  );
});

const getMyResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const result = await resultService.getMyResults(userId, req.query);

  sendResponse(res, {
    message: "My results retrieved successfully.",
    data: result,
  });
});

const getAssessmentResults = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { assessmentId } = req.params;
  const result = await resultService.getAssessmentResults(
    userId,
    assessmentId as string,
    req.query,
  );

  sendResponse(res, {
    message: "Assessment results retrieved successfully.",
    data: result,
  });
});

export const resultControllers = {
  getAttemptResult,
  getMyResults,
  getAssessmentResults,
};
