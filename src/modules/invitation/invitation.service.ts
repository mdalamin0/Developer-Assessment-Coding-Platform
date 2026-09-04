import { Prisma } from "../../../generated/prisma/client";
import {
  AssessmentStatus,
  AuditAction,
  AuditEntity,
  InvitationStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { ICreateInvitationPayload, IInvitationQuery } from "./invitation.interface";

const createInvitation = async (
  userId: string,
  assessmentId: string,
  payload: ICreateInvitationPayload,
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

const getMyInvitations = async (userId: string, query: IInvitationQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      recruiter: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  const andConditions: Prisma.InvitationWhereInput[] = [
    {
      assessment: {
        recruiterId: user.recruiter.id,
        deletedAt: null,
      },
    },
  ];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          candidate: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          candidate: {
            email: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          assessment: {
            title: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.status) {
    const normalizedStatus = (
      query.status as string
    ).toUpperCase() as InvitationStatus;

    andConditions.push({
      status: normalizedStatus,
    });
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      AND: andConditions,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
          duration: true,
          totalMarks: true,
          passingMarks: true,
          status: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  const total = await prisma.invitation.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: invitations,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const invitationServices = {
  createInvitation,
  getMyInvitations,
};
