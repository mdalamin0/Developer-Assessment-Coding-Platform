import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { answerService } from "./answer.service";
import { catchAsync } from "../../utils/catchAsync";

const getPendingAnswers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const result = await answerService.getPendingAnswers(userId, req.query);

  sendResponse(res, {
    message: "Pending answers retrieved successfully.",
    data: result,
  });
});

const getSingleAnswer = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { answerId } = req.params;
  const result = await answerService.getSingleAnswer(
    userId,
    answerId as string,
  );

  sendResponse(res, {
    message: "Answer retrieved successfully.",
    data: result,
  });
});

const evaluateAnswer = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { answerId } = req.params;
  const payload = req.body;

  const result = await answerService.evaluateAnswer(userId, answerId as string, payload);

  sendResponse(res, {
    message: "Answer evaluated successfully.",
    data: result,
  });
});



export const answerController = {
  getPendingAnswers,
  getSingleAnswer,
  evaluateAnswer,
};


