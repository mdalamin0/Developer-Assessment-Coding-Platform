import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminServices } from "./admin.service";

const updateAdminProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    console.log(req.user, "user");
    const payload = req.body ? req.body : {};
    const result = await adminServices.updateAdminProfile(userId!, payload);

    sendResponse(res, {
      message: "Admin profile updated successfully.",
      data: result,
    });
  },
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await adminServices.getAllUsers(req.query);

    sendResponse(res, {
      message: "All users retrive successfully.",
      data: result,
    });
  },
);

const updateUserStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await adminServices.updateUserStatus(id as string, status);

    sendResponse(res, {
      message: "User status updated successfully.",
      data: result,
    });
  },
);

const getAuditLogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await adminServices.getAuditLogs(req.query);

    sendResponse(res, {
      message: "Audit Logs Retrive Successfully.",
      data: result,
    });
  },
);

export const adminControllers = {
  updateAdminProfile,
  getAllUsers,
  updateUserStatus,
  getAuditLogs
};
