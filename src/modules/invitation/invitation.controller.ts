import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { invitationServices } from "./invitation.service";
import httpStatus from "http-status";

const createInvitation = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;
  const { assessmentId } = req.params;

  const result = await invitationServices.createInvitation(
    recruiterId,
    assessmentId as string,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Invitation create successfully!",
      data: result,
    },
    httpStatus.CREATED,
  );
});


export const invitationControllers = {
  createInvitation
}
