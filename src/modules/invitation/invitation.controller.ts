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

const getRecruiterMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;

  const result = await invitationServices.getRecruiterMyInvitations(
    recruiterId,
    req.query,
  );

  sendResponse(
    res,
    {
      message: "Invitations retrieved successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const respondToInvitation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const {invitationId} = req.params;
  const result = await invitationServices.respondToInvitation(
    userId,
    invitationId as string,
    req.body,
  );

  sendResponse(res, {
    message: `Invitation ${req.body.status.toLowerCase()} successfully.`,
    data: result,
  });
});

const getCandidateMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const result = await invitationServices.getCandidateMyInvitations(
    userId,
    req.query,
  );

  sendResponse(res, {
    message: "Invitations retrieved successfully!",
    data: result,
  });
});

export const invitationControllers = {
  createInvitation,
  getRecruiterMyInvitations,
  respondToInvitation,
  getCandidateMyInvitations,
}
