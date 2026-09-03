import { Prisma } from "../../../generated/prisma/client";
import {
  Difficulty,
  ProblemType,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateProblemPayload, IProblemQuery, IUpdateProblemPayload } from "./problem.interface";
import httpStatus from "http-status";

const createProblem = async (
  userId: string,
  payload: ICreateProblemPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiter: true },
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

  if (payload.type === ProblemType.MCQ) {
    if (!payload.options) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Options are required for MCQ problems.",
      );
    }

    if (!payload.correctAnswer) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Correct answer is required for MCQ problems.",
      );
    }
  }

  if (payload.type !== ProblemType.MCQ && payload.correctAnswer) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Correct answer is only allowed for MCQ problems.",
    );
  }

  const problem = await prisma.problem.create({
    data: {
      recruiterId: user.recruiter.id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      difficulty: payload.difficulty ?? Difficulty.MEDIUM,
      marks: payload.marks,
      options: payload.options,
      correctAnswer: payload.correctAnswer,
    },
  });

  return problem;
};

const getMyProblems = async (userId: string, query: IProblemQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiter: true },
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

  const andConditions: Prisma.ProblemWhereInput[] = [
    {
      recruiterId: user.recruiter.id,
    },
    {
      deletedAt: null,
    },
  ];

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Filter by problem type
  if (query.type) {
    const normalizedType = (query.type as string).toUpperCase() as ProblemType;

    andConditions.push({
      type: normalizedType,
    });
  }

  // Filter by difficulty
  if (query.difficulty) {
    const normalizedDifficulty = (
      query.difficulty as string
    ).toUpperCase() as Difficulty;

    andConditions.push({
      difficulty: normalizedDifficulty,
    });
  }

  const problems = await prisma.problem.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      recruiterId: true,
      title: true,
      description: true,
      type: true,
      difficulty: true,
      marks: true,
      options: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.problem.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: problems,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleProblem = async (userId: string, problemId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiter: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted.");
  }

  const problem = await prisma.problem.findFirst({
    where: {
      id: problemId,
      deletedAt: null,
      ...(user.role === Role.RECRUITER
        ? {
            recruiterId: user.recruiter?.id,
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      difficulty: true,
      marks: true,
      options: true,
      correctAnswer: user.role === Role.RECRUITER,
      recruiterId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

  return problem;
};

const updateProblem = async (
  userId: string,
  problemId: string,
  payload: IUpdateProblemPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiter: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted.");
  }

  // Recruiter must have recruiter profile
  if (user.role === Role.RECRUITER && !user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  // Ownership check
  const problem = await prisma.problem.findFirst({
    where: {
      id: problemId,
      deletedAt: null,
      ...(user.role === Role.RECRUITER
        ? {
            recruiterId: user.recruiter!.id,
          }
        : {}),
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found.");
  }

  // Final values after partial update
  const finalType = payload.type ?? problem.type;

  const finalOptions =
    payload.options !== undefined ? payload.options : problem.options;

  const finalCorrectAnswer =
    payload.correctAnswer !== undefined
      ? payload.correctAnswer
      : problem.correctAnswer;

  // MCQ validation
  if (finalType === ProblemType.MCQ) {
    if (!finalOptions || finalOptions.length < 2) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "MCQ must have at least 2 options.",
      );
    }

    if (!finalCorrectAnswer) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Correct answer is required for MCQ problems.",
      );
    }

    if (!finalOptions.includes(finalCorrectAnswer)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Correct answer must match one of the options.",
      );
    }
  }

  // Written/Coding validation
  if (finalType !== ProblemType.MCQ) {
    if (finalOptions && finalOptions.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Options are only allowed for MCQ problems.",
      );
    }

    if (finalCorrectAnswer) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Correct answer is only allowed for MCQ problems.",
      );
    }
  }

  const updatedProblem = await prisma.problem.update({
    where: {
      id: problem.id,
    },
    data: {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      difficulty: payload.difficulty,
      marks: payload.marks,
      options: finalType === ProblemType.MCQ ? finalOptions : [],
      correctAnswer: finalType === ProblemType.MCQ ? finalCorrectAnswer : null,
    },
  });

  return updatedProblem;
};

const deleteProblem = async (userId: string, problemId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiter: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted.");
  }

  if (user.role === Role.RECRUITER && !user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  const problem = await prisma.problem.findFirst({
    where: {
      id: problemId,
      deletedAt: null,
      ...(user.role === Role.RECRUITER
        ? {
            recruiterId: user.recruiter!.id,
          }
        : {}),
    },
  });

  if (!problem) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Problem not found or you do not have permission to delete it.",
    );
  }


  const deletedProblem = await prisma.problem.update({
    where: {
      id: problemId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return deletedProblem;
};

export const problemServices = {
  createProblem,
  getMyProblems,
  getSingleProblem,
  updateProblem,
  deleteProblem,
};
