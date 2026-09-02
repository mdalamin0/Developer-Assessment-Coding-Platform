import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.service";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await userServices.getMe(userId as string);

    sendResponse(res, {
      message: "User data retrive successfully.",
      data: result,
    });
  },
);

const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const userId = req.user?.id;
    const result = await userServices.updateMe(payload, userId!);

    sendResponse(res, {
      message: "User update successfully.",
      data: result,
    });
  },
);

const uploadProfileImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new AppError(httpStatus.BAD_REQUEST, "No file uploaded");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated!");
    }

    const result = await userServices.uploadProfileImage(
      req.file?.buffer,
      userId,
    );

    sendResponse(res, {
      message: "Profile image updated successfully.",
      data: result,
    });
  },
);

export const userControllers = {
  uploadProfileImage,
  getMe,
  updateMe
};
