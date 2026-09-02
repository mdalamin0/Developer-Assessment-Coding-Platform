import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { recruiterServices } from "./recruiter.service";
import sendResponse from "../../utils/sendResponse";

const updateRecruiterProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await recruiterServices.updateRecruiterProfile(
      userId!,
      req.body,
      req.file,
    );

    sendResponse(res, {
      message: "Recruiter profile updated successfully.",
      data: result,
    });
  },
);

export const recruiterControllers = {
  updateRecruiterProfile,
};
