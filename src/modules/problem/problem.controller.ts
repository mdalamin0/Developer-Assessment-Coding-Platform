import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { problemServices } from "./problem.service";
import httpStatus from "http-status";

const createProblem = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;

  const result = await problemServices.createProblem(
    recruiterId,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Problem created successfully!",
      data: result,
    },
    httpStatus.CREATED,
  );
});

const getMyProblems = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;
  const result = await problemServices.getMyProblems(recruiterId, req.query);

  sendResponse(
    res,
    {
      message: "Problems retrieved successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

export const problemControllers = {
  createProblem,
  getMyProblems,
};
