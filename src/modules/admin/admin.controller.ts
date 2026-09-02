import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminServices } from "./admin.service";

const updateAdminProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    console.log(req.user, "user");
    const payload = req.body ? req.body : {};
    const result =  await adminServices.updateAdminProfile(
      userId!,
      payload,
    );

    sendResponse(res, {
      message: "Admin profile updated successfully.",
      data: result,
    });
  },
);

export const adminControllers = {
  updateAdminProfile,
};
