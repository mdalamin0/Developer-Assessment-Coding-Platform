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

  sendResponse(res, {
    message: "Result retrieved successfully.",
    data: result,
  }, httpStatus.OK);
});

export const resultController = {
  getAttemptResult,
};
