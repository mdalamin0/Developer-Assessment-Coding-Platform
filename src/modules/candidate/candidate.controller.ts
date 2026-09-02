import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { candidateServices } from "./candidate.service";
import sendResponse from "../../utils/sendResponse";

const updateCandidateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body.data ? JSON.parse(req.body.data) : {};
    const result =  await candidateServices.updateCandidateProfile(
      userId!,
      payload,
      req.file,
    );

    sendResponse(res, {
      message: "Candidate profile updated successfully.",
      data: result,
    });
  },
);

export const candidateControllers = {
  updateCandidateProfile,
};
