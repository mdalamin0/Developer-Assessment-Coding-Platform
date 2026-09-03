import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { assessmentServices } from "./assessment.service";

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;

  const result = await assessmentServices.createAssessment(
    recruiterId,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Assessment created successfully!",
      data: result,
    },
    httpStatus.CREATED,
  );
});


export const assessmentControllers = {
  createAssessment,
};
