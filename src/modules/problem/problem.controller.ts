import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { problemServices } from "./problem.service";
import httpStatus from "http-status";

const createProblem = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;

  const result = await problemServices.createProblem(recruiterId, req.body);

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

const getSingleProblem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const problemId = req.params.id as string;
  const result = await problemServices.getSingleProblem(userId, problemId);

  sendResponse(
    res,
    {
      message: "Problem retrieved successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const updateProblem = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;
  const problemId = req.params.id as string;

  const result = await problemServices.updateProblem(
    recruiterId,
    problemId,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Problem updated successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const deleteProblem = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;
  const problemId = req.params.id as string;

  const result = await problemServices.deleteProblem(
    recruiterId,
    problemId,
  );

  sendResponse(
    res,
    {
      message: "Problem deleted successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

export const problemControllers = {
  createProblem,
  getMyProblems,
  getSingleProblem,
  updateProblem,
  deleteProblem,
};
