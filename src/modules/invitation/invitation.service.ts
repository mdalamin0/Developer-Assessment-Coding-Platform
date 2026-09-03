import { AssessmentStatus, AuditAction, AuditEntity, Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";


const createInvitation = async (
  userId: string,
  assessmentId: string,
  payload: any,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      recruiter: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found.");
  }

  if (
    assessment.status === AssessmentStatus.ONGOING ||
    assessment.status === AssessmentStatus.COMPLETED ||
    assessment.status === AssessmentStatus.ARCHIVED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Candidates cannot be invited to this assessment.",
    );
  }

  const candidate = await prisma.user.findFirst({
    where: {
      id: payload.candidateId,
      role: Role.CANDIDATE,
      status: UserStatus.ACTIVE,
    },
  });

  if (!candidate) {
    throw new AppError(httpStatus.NOT_FOUND, "Active candidate not found.");
  }

  const existingInvitation = await prisma.invitation.findUnique({
    where: {
      assessmentId_candidateId: {
        assessmentId: assessment.id,
        candidateId: candidate.id,
      },
    },
  });

  if (existingInvitation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Candidate has already been invited to this assessment.",
    );
  }

  const invitation = await prisma.invitation.create({
    data: {
      assessmentId: assessment.id,
      candidateId: candidate.id,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.INVITE,
      entity: AuditEntity.INVITATION,
      entityId: invitation.id,
      newValue: {
        assessmentId: assessment.id,
        candidateId: candidate.id,
      },
    },
  });

  return invitation;
};


export const invitationServices = {
  createInvitation
}
