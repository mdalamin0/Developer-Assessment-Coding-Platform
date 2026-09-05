import httpStatus from "http-status";
import { AttemptStatus, AuditAction, AuditEntity, Prisma, ProblemType, ResultStatus, UserStatus } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IEvaluateAnswerPayload, IPendingAnswerQuery } from "./answer.interface";

const getPendingAnswers = async (
  userId: string,
  query: IPendingAnswerQuery,
) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "updatedAt";
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
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter not found.");
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is suspended.");
  }

  if (user.status === "DELETED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

const andConditions: Prisma.AnswerWhereInput[] = [
  {
    evaluation: null,
  },
  {
    problem: {
      type: {
        in: [ProblemType.WRITTEN, ProblemType.CODING],
      },
    },
  },
  {
    attempt: {
      assessment: {
        recruiterId: user.recruiter.id,
        deletedAt: null,
      },
    },
  },
];

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          problem: {
            title: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          attempt: {
            candidate: {
              name: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          attempt: {
            candidate: {
              email: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          attempt: {
            assessment: {
              title: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  // Get answers
  const answers = await prisma.answer.findMany({
    where: {
      AND: andConditions,
    },

    skip,
    take: limit,

    orderBy: {
      [sortBy]: sortOrder,
    },

    select: {
      id: true,
      answer: true,
      isCorrect: true,
      marksObtained: true,
      createdAt: true,
      updatedAt: true,

      problem: {
        select: {
          id: true,
          title: true,
          type: true,
          difficulty: true,
          marks: true,
        },
      },

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
            },
          },
        },
      },
    },
  });

  // Total
  const total = await prisma.answer.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: answers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleAnswer = async (userId: string, answerId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      recruiter: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not active.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter profile not found.");
  }

  const answer = await prisma.answer.findFirst({
    where: {
      id: answerId,
      attempt: {
        status: AttemptStatus.SUBMITTED,
        assessment: {
          recruiterId: user.recruiter.id,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      answer: true,
      isCorrect: true,
      marksObtained: true,
      createdAt: true,
      updatedAt: true,

      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          marks: true,
        },
      },

      attempt: {
        select: {
          id: true,
          startedAt: true,
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

      evaluation: {
        select: {
          id: true,
          score: true,
          feedback: true,
          evaluatedAt: true,
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!answer) {
    throw new AppError(httpStatus.NOT_FOUND, "Answer not found.");
  }

  return answer;
};

const evaluateAnswer = async (
  userId: string,
  answerId: string,
  payload: IEvaluateAnswerPayload,
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

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not active.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter profile not found.");
  }

  const answer = await prisma.answer.findFirst({
    where: {
      id: answerId,
      attempt: {
        status: AttemptStatus.SUBMITTED,
        assessment: {
          recruiterId: user.recruiter.id,
          deletedAt: null,
        },
      },
    },
    include: {
      problem: {
        select: {
          id: true,
          type: true,
          marks: true,
        },
      },
      evaluation: true,
      attempt: {
        select: {
          id: true,
          assessmentId: true,
        },
      },
    },
  });

  if (!answer) {
    throw new AppError(httpStatus.NOT_FOUND, "Answer not found.");
  }

  if (
    answer.problem.type !== ProblemType.WRITTEN &&
    answer.problem.type !== ProblemType.CODING
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only written and coding answers can be manually evaluated.",
    );
  }

  if (answer.evaluation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This answer has already been evaluated.",
    );
  }

  if (payload.score > answer.problem.marks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Score cannot exceed ${answer.problem.marks} marks.`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create evaluation
    const evaluation = await tx.evaluation.create({
      data: {
        answerId: answer.id,
        evaluatorId: userId,
        score: payload.score,
        feedback: payload.feedback,
      },
    });

    // Update answer marks
    await tx.answer.update({
      where: {
        id: answer.id,
      },
      data: {
        marksObtained: payload.score,
      },
    });

    // Check remaining written/coding answers
    const pendingAnswers = await tx.answer.count({
      where: {
        attemptId: answer.attempt.id,
        problem: {
          type: {
            in: [ProblemType.WRITTEN, ProblemType.CODING],
          },
        },
        evaluation: null,
      },
    });

    // If all subjective answers are evaluated,
    // calculate and make result READY
    if (pendingAnswers === 0) {
      const attemptAnswers = await tx.answer.findMany({
        where: {
          attemptId: answer.attempt.id,
        },
        select: {
          marksObtained: true,
        },
      });

      const assessment = await tx.assessment.findUnique({
        where: {
          id: answer.attempt.assessmentId,
        },
        select: {
          totalMarks: true,
          passingMarks: true,
        },
      });

      if (!assessment) {
        throw new AppError(httpStatus.NOT_FOUND, "Assessment not found.");
      }

      const totalScore = attemptAnswers.reduce(
        (total, currentAnswer) => total + (currentAnswer.marksObtained ?? 0),
        0,
      );

      const percentage =
        assessment.totalMarks > 0
          ? (totalScore / assessment.totalMarks) * 100
          : 0;

      const passed = totalScore >= assessment.passingMarks;

      await tx.result.upsert({
        where: {
          attemptId: answer.attempt.id,
        },
        create: {
          attemptId: answer.attempt.id,
          totalScore,
          percentage,
          passed,
          status: ResultStatus.READY,
          generatedAt: new Date(),
        },
        update: {
          totalScore,
          percentage,
          passed,
          status: ResultStatus.READY,
          generatedAt: new Date(),
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: AuditAction.EVALUATE,
        entity: AuditEntity.ANSWER,
        entityId: answer.id,
        newValue: {
          score: payload.score,
          feedback: payload.feedback,
        },
      },
    });

    return evaluation;
  });

  return result;
};



export const answerService = {
  getPendingAnswers,
  getSingleAnswer,
  evaluateAnswer,
};
