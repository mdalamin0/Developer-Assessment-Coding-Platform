import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { AttemptStatus, UserStatus } from "../../../generated/prisma/enums";

const getAttemptResult = async (userId: string, attemptId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Candidate not found.");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Candidate is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Candidate is deleted.");
  }

  const attempt = await prisma.attempt.findFirst({
    where: {
      id: attemptId,
      candidateId: userId,
    },
    select: {
      id: true,
      status: true,
      assessment: {
        select: {
          id: true,
          title: true,
          totalMarks: true,
          passingMarks: true,
        },
      },
      result: {
        select: {
          id: true,
          totalScore: true,
          percentage: true,
          passed: true,
          status: true,
          generatedAt: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found.");
  }

  if (attempt.status !== AttemptStatus.SUBMITTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You must submit the assessment before viewing the result.",
    );
  }

  if (!attempt.result) {
    throw new AppError(httpStatus.NOT_FOUND, "Result not found.");
  }

  return {
    attemptId: attempt.id,
    assessment: attempt.assessment,
    result: attempt.result,
  };
};

export const resultService = {
  getAttemptResult,
};
