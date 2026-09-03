import {
  AssessmentStatus,
  AuditAction,
  AuditEntity,
  PaymentStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  IAddProblemPayload,
  IAssessmentQuery,
  ICreateAssessmentPayload,
  IReorderProblemsPayload,
  IUpdateAssessmentPayload,
} from "./assessment.interface";
import httpStatus from "http-status";
import { add, isBefore, parseISO } from "date-fns";
import { Prisma } from "../../../generated/prisma/client";
import { isAfter } from "date-fns";

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

const getMyAssessments = async (userId: string, query: IAssessmentQuery) => {
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

  const andConditions: Prisma.AssessmentWhereInput[] = [
    {
      recruiterId: user.recruiter.id,
    },
    {
      deletedAt: null,
    },
  ];

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

  if (query.status) {
    const normalizedStatus = (
      query.status as string
    ).toUpperCase() as AssessmentStatus;

    andConditions.push({
      status: {
        equals: normalizedStatus,
      },
    });
  }

  const assessments = await prisma.assessment.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      recruiter: true,
    },
  });

  const total = await prisma.assessment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: assessments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleAssessment = async (userId: string, assessmentId: string) => {
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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
      ...(user.role === Role.RECRUITER
        ? { recruiterId: user.recruiter?.id }
        : {}),
    },
    include: {
      recruiter: true,
      problems: {
        include: {
          problem: true,
        },
        orderBy: {
          questionOrder: "asc",
        },
      },
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you do not have permission to view it.",
    );
  }

  return assessment;
};

const getAllAssessments = async (userId: string, query: IAssessmentQuery) => {
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

  const andConditions: Prisma.AssessmentWhereInput[] = [
    {
      deletedAt: null,
    },
  ];

  if (user.role === Role.RECRUITER) {
    andConditions.push({
      recruiterId: user.recruiter!.id,
    });
  }

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

  if (query.status) {
    const normalizedStatus = (
      query.status as string
    ).toUpperCase() as AssessmentStatus;

    andConditions.push({
      status: {
        equals: normalizedStatus,
      },
    });
  }

  const assessments = await prisma.assessment.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      recruiter: true,
    },
  });

  const total = await prisma.assessment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: assessments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

 const updateAssessment = async (
  userId: string,
  assessmentId: string,
  payload: IUpdateAssessmentPayload,
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
      "Assessment not found or you do not have permission to update it.",
    );
  }

  if (
    assessment.status === AssessmentStatus.ONGOING ||
    assessment.status === AssessmentStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Assessment cannot be updated because it is already ${assessment.status.toLowerCase()}.`,
    );
  }

  const totalMarks = payload.totalMarks ?? assessment.totalMarks;

  const passingMarks = payload.passingMarks ?? assessment.passingMarks;

  if (passingMarks > totalMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Passing marks cannot be greater than total marks.",
    );
  }

  const startAt =
    payload.startAt === undefined
      ? assessment.startAt
      : payload.startAt === null
        ? null
        : new Date(payload.startAt);

  const endAt =
    payload.endAt === undefined
      ? assessment.endAt
      : payload.endAt === null
        ? null
        : new Date(payload.endAt);

  if (startAt && endAt && !isAfter(endAt, startAt)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time must be greater than start time.",
    );
  }

  const updatedAssessment = await prisma.assessment.update({
    where: {
      id: assessmentId,
    },
    data: {
      ...(payload.title !== undefined && {
        title: payload.title,
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),

      ...(payload.duration !== undefined && {
        duration: payload.duration,
      }),

      ...(payload.totalMarks !== undefined && {
        totalMarks: payload.totalMarks,
      }),

      ...(payload.passingMarks !== undefined && {
        passingMarks: payload.passingMarks,
      }),

      startAt,
      endAt,
    },
  });

  return updatedAssessment;
};

const publishAssessment = async (userId: string, assessmentId: string) => {
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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
      deletedAt: null,
    },
    include: {
      problems: true,
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you do not have permission to publish it.",
    );
  }

  if (assessment.status !== AssessmentStatus.DRAFT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only draft assessments can be published.",
    );
  }

  if (assessment.problems.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Assessment must contain at least one problem before publishing.",
    );
  }

  const payment = await prisma.payment.findFirst({
    where: {
      assessmentId: assessment.id,
      recruiterId: user.recruiter.id,
      status: PaymentStatus.COMPLETED
    },
  });

  if (!payment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment is required before publishing the assessment.",
    );
  }

  const publishedAssessment = await prisma.assessment.update({
    where: {
      id: assessment.id,
    },
    data: {
      status: AssessmentStatus.PUBLISHED,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.PUBLISH,
      entity: AuditEntity.ASSESSMENT,
      entityId: assessment.id,
      oldValue: {
        status: assessment.status,
      },
      newValue: {
        status: AssessmentStatus.PUBLISHED,
      },
    },
  });

  return publishedAssessment;
};

const deleteAssessment = async (userId: string, assessmentId: string) => {
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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
      ...(user.role === Role.RECRUITER
        ? {
            recruiterId: user.recruiter!.id,
          }
        : {}),
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you do not have permission to delete it.",
    );
  }

  if (
    assessment.status === AssessmentStatus.ONGOING ||
    assessment.status === AssessmentStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Assessment cannot be deleted because it is already ${assessment.status.toLowerCase()}.`,
    );
  }

  const deletedAssessment = await prisma.assessment.update({
    where: {
      id: assessmentId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return deletedAssessment;
};



// Assessment-problem services 
const addProblemToAssessment = async (
  userId: string,
  assessmentId: string,
  payload: IAddProblemPayload,
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

  // Assessment ownership + status check
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
      deletedAt: null,
    },
    include: {
      problems: true,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found.");
  }

  if (
    assessment.status === AssessmentStatus.ONGOING ||
    assessment.status === AssessmentStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Problems cannot be added to an ongoing or completed assessment.",
    );
  }

  // Find recruiter's problem
  const problem = await prisma.problem.findFirst({
    where: {
      id: payload.problemId,
      recruiterId: user.recruiter.id,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found.");
  }

  // Prevent duplicate problem
  const alreadyAdded = assessment.problems.some(
    (item) => item.problemId === problem.id,
  );

  if (alreadyAdded) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This problem is already added to the assessment.",
    );
  }

  // Backend generates the next question order
  const questionOrder = assessment.problems.length + 1;

  const assessmentProblem = await prisma.assessmentProblem.create({
    data: {
      assessmentId: assessment.id,
      problemId: problem.id,
      questionOrder,
      marks: problem.marks,
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          marks: true,
          options: true,
        },
      },
    },
  });

  return assessmentProblem;
};

const getAssessmentProblems = async (userId: string, assessmentId: string) => {
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

  const assessmentProblems = await prisma.assessmentProblem.findMany({
    where: {
      assessmentId: assessment.id,
    },
    orderBy: {
      questionOrder: "asc",
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          marks: true,
          options: true,
        },
      },
    },
  });

  return assessmentProblems;
};

const removeProblemFromAssessment = async (
  userId: string,
  assessmentId: string,
  problemId: string,
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
    assessment.status === AssessmentStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Problems cannot be removed from an ongoing or completed assessment.",
    );
  }

  const assessmentProblem = await prisma.assessmentProblem.findFirst({
    where: {
      assessmentId: assessment.id,
      problemId,
    },
  });

  if (!assessmentProblem) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Problem is not attached to this assessment.",
    );
  }

  await prisma.assessmentProblem.delete({
    where: {
      id: assessmentProblem.id,
    },
  });

  // Re-order remaining problems
  const remainingProblems = await prisma.assessmentProblem.findMany({
    where: {
      assessmentId: assessment.id,
    },
    orderBy: {
      questionOrder: "asc",
    },
  });

  await prisma.$transaction(
    remainingProblems.map((item, index) =>
      prisma.assessmentProblem.update({
        where: {
          id: item.id,
        },
        data: {
          questionOrder: index + 1,
        },
      }),
    ),
  );

  return null;
};

const reorderAssessmentProblems = async (
  userId: string,
  assessmentId: string,
  payload: IReorderProblemsPayload,
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
    assessment.status === AssessmentStatus.COMPLETED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Problems cannot be reordered in an ongoing or completed assessment.",
    );
  }

  const assessmentProblems = await prisma.assessmentProblem.findMany({
    where: {
      assessmentId: assessment.id,
    },
    select: {
      id: true,
      problemId: true,
      questionOrder: true,
    },
  });

  if (payload.problems.length !== assessmentProblems.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "All assessment problems must be included in the reorder request.",
    );
  }

  const existingProblemIds = new Set(
    assessmentProblems.map((item) => item.problemId),
  );

  const receivedProblemIds = new Set(
    payload.problems.map((item) => item.problemId),
  );

  if (existingProblemIds.size !== receivedProblemIds.size) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Duplicate problems are not allowed.",
    );
  }

  for (const problem of payload.problems) {
    if (!existingProblemIds.has(problem.problemId)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Problem ${problem.problemId} is not attached to this assessment.`,
      );
    }
  }

  const orders = payload.problems.map((item) => item.questionOrder);

  const expectedOrders = Array.from(
    { length: assessmentProblems.length },
    (_, index) => index + 1,
  );

  const isValidOrder =
    orders.length === expectedOrders.length &&
    [...orders]
      .sort((a, b) => a - b)
      .every((order, index) => order === expectedOrders[index]);

  if (!isValidOrder) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Question order must be unique and sequential.",
    );
  }

  await prisma.$transaction(async (tx) => {
    // Temporary negative orders prevent unique constraint conflicts
    for (const item of assessmentProblems) {
      await tx.assessmentProblem.update({
        where: {
          id: item.id,
        },
        data: {
          questionOrder: -item.questionOrder,
        },
      });
    }

    for (const item of payload.problems) {
      const assessmentProblem = assessmentProblems.find(
        (problem) => problem.problemId === item.problemId,
      );

      if (!assessmentProblem) continue;

      await tx.assessmentProblem.update({
        where: {
          id: assessmentProblem.id,
        },
        data: {
          questionOrder: item.questionOrder,
        },
      });
    }
  });

  return prisma.assessmentProblem.findMany({
    where: {
      assessmentId: assessment.id,
    },
    orderBy: {
      questionOrder: "asc",
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          marks: true,
          options: true,
        },
      },
    },
  });
};



export const assessmentServices = {
  createAssessment,
  getMyAssessments,
  getSingleAssessment,
  updateAssessment,
  getAllAssessments,
  deleteAssessment,
  publishAssessment,
  addProblemToAssessment,
  getAssessmentProblems,
  removeProblemFromAssessment,
  reorderAssessmentProblems
};
