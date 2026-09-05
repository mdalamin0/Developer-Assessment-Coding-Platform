import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { recruiterServices } from "./recruiter.service";
import sendResponse from "../../utils/sendResponse";

const updateRecruiterProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body.data ? JSON.parse(req.body.data) : {};
    const result = await recruiterServices.updateRecruiterProfile(
      userId!,
      payload,
      req.file,
    );

    sendResponse(res, {
      message: "Recruiter profile updated successfully.",
      data: result,
    });
  },
);

const getRecruiterDashboardData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await recruiterServices.getRecruiterDashboardData(userId!);

    sendResponse(res, {
      message: "Recruiter Dashboard Data Retrive Successfully.",
      data: result,
    });
  },
);

const getAssessmentStatistics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { assessmentId } = req.params;
    const result = await recruiterServices.getAssessmentStatistics(
      userId!,
      assessmentId as string,
    );

    sendResponse(res, {
      message: "Assessment Statistics Retrive Successfully.",
      data: result,
    });
  },
);

export const recruiterControllers = {
  updateRecruiterProfile,
  getRecruiterDashboardData,
  getAssessmentStatistics
};
