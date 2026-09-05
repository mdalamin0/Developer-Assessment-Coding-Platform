import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { AttemptStatus, ResultStatus, Role, UserStatus } from "../../../generated/prisma/enums";
import { IResultsQuery } from "./result.interface";
import { Prisma } from "../../../generated/prisma/client";

// candidate services
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

const getMyResults = async (userId: string, query: IResultsQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Candidate not found");
  }

  if (user.role !== Role.CANDIDATE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only candidates can access their results.",
    );
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Candidate is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Candidate is deleted.");
  }

  const andConditions: Prisma.ResultWhereInput[] = [
    {
      attempt: {
        candidateId: userId,
      },
    },
  ];

  if (query.searchTerm) {
    andConditions.push({
      attempt: {
        assessment: {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (query.status) {
    const normalizedStatus = (
      query.status as string
    ).toUpperCase() as ResultStatus;

    andConditions.push({
      status: {
        equals: normalizedStatus,
      },
    });
  }

  const results = await prisma.result.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      attempt: {
        select: {
          id: true,
          submittedAt: true,
          assessment: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              passingMarks: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.result.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// recruiter services
const getAssessmentResults = async (
  userId: string,
  assessmentId: string,
  query: IResultsQuery,
) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you do not have access to it.",
    );
  }

  const andConditions: Prisma.ResultWhereInput[] = [
    {
      attempt: {
        assessmentId,
      },
    },
  ];

  const results = await prisma.result.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      attempt: {
        select: {
          id: true,
          submittedAt: true,
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          assessment: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              passingMarks: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.result.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const resultService = {
  getAttemptResult,
  getMyResults,
  getAssessmentResults
};
