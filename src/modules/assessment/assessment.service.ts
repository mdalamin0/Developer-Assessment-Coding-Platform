import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateAssessmentPayload } from "./assessment.interface";
import httpStatus from "http-status";
import { isBefore, parseISO } from "date-fns";

const createAssessment = async (
  userId: string,
  payload: ICreateAssessmentPayload,
) => {
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

  if (payload.passingMarks > payload.totalMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Passing marks cannot be greater than total marks.",
    );
  }


if (payload.startAt && payload.endAt) {
  const startDate = parseISO(payload.startAt);
  const endDate = parseISO(payload.endAt);
  
  if (
    isBefore(endDate, startDate) ||
    endDate.getTime() === startDate.getTime()
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time must be strictly greater than start time.",
    );
  }


  if (isBefore(startDate, new Date())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Start time cannot be in the past.",
    );
  }
}

  const assessment = await prisma.assessment.create({
    data: {
      recruiterId: user.recruiter.id,
      title: payload.title,
      description: payload.description,
      duration: payload.duration,
      totalMarks: payload.totalMarks,
      passingMarks: payload.passingMarks,
      startAt: payload.startAt ? parseISO(payload.startAt) : undefined,
      endAt: payload.endAt ? parseISO(payload.endAt) : undefined,
    },
  });

  return assessment;
};



export const assessmentServices = {
  createAssessment,
};
