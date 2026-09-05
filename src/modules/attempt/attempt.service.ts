import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import {
  AttemptStatus,
  AssessmentStatus,
  AuditAction,
  AuditEntity,
  InvitationStatus,
  UserStatus,
  ProblemType,
  ResultStatus,
} from "../../../generated/prisma/enums";
import { ISubmitAnswerPayload } from "./attempt.interface";
import { isAfter, isEqual } from "date-fns";

const startAssessment = async (userId: string, assessmentId: string) => {
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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      status: AssessmentStatus.ONGOING,
      deletedAt: null,
      invitations: {
        some: {
          candidateId: userId,
          status: InvitationStatus.ACCEPTED,
        },
      },
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you are not invited to this assessment.",
    );
  }

  if (assessment.startAt && assessment.startAt > new Date()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Assessment has not started yet.",
    );
  }

  if (assessment.endAt && assessment.endAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Assessment has already ended.");
  }

  const existingAttempt = await prisma.attempt.findUnique({
    where: {
      assessmentId_candidateId: {
        assessmentId,
        candidateId: userId,
      },
    },
  });

  if (existingAttempt) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already started this assessment.",
    );
  }

  const startedAt = new Date();

  const durationExpiresAt = new Date(
    startedAt.getTime() + assessment.duration * 60 * 1000,
  );

  const expiresAt =
    assessment.endAt && assessment.endAt < durationExpiresAt
      ? assessment.endAt
      : durationExpiresAt;

  const attempt = await prisma.attempt.create({
    data: {
      assessmentId,
      candidateId: userId,
      startedAt: new Date(),
      expiresAt,
      status: AttemptStatus.IN_PROGRESS,
    },
    select: {
      id: true,
      assessmentId: true,
      candidateId: true,
      startedAt: true,
      expiresAt: true,
      status: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: AuditAction.CREATE,
      entity: AuditEntity.ATTEMPT,
      entityId: attempt.id,
      newValue: {
        assessmentId,
        status: AttemptStatus.IN_PROGRESS,
      },
    },
  });

  return {
    attempt,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      startAt: assessment.startAt,
      endAt: assessment.endAt,
    },
  };
};

const getMySingleAttempt = async (userId: string, attemptId: string) => {
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
      assessmentId: true,
      candidateId: true,
      startedAt: true,
      submittedAt: true,
      status: true,
      assessment: {
        select: {
          id: true,
          title: true,
          duration: true,
          totalMarks: true,
          passingMarks: true,
          startAt: true,
          endAt: true,
        },
      },
      _count: {
        select: {
          answers: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found.");
  }

  return attempt;
};

const getAttemptQuestions = async (userId: string, attemptId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      assessmentId: true,
      status: true,

      assessment: {
        select: {
          id: true,
          title: true,
          duration: true,
          totalMarks: true,
          passingMarks: true,
          startAt: true,
          endAt: true,

          problems: {
            orderBy: {
              questionOrder: "asc",
            },
            select: {
              questionOrder: true,
              marks: true,

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
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress.",
    );
  }

  return {
    attemptId: attempt.id,
    assessment: {
      id: attempt.assessment.id,
      title: attempt.assessment.title,
      duration: attempt.assessment.duration,
      totalMarks: attempt.assessment.totalMarks,
      passingMarks: attempt.assessment.passingMarks,
      startAt: attempt.assessment.startAt,
      endAt: attempt.assessment.endAt,
    },
    questions: attempt.assessment.problems,
  };
};

const submitAnswer = async (
  userId: string,
  attemptId: string,
  payload: ISubmitAnswerPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    include: {
      assessment: {
        include: {
          problems: {
            where: {
              problemId: payload.problemId,
            },
            include: {
              problem: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress.",
    );
  }

  const now = new Date();

  // Check attempt duration
  if (isAfter(now, attempt.expiresAt) || isEqual(now, attempt.expiresAt)) {
    await prisma.$transaction(async (tx) => {
      await tx.attempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: AttemptStatus.SUBMITTED,
          submittedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.SUBMIT,
          entity: AuditEntity.ATTEMPT,
          entityId: attempt.id,
          oldValue: {
            status: AttemptStatus.IN_PROGRESS,
          },
          newValue: {
            status: AttemptStatus.SUBMITTED,
            reason: "TIME_EXPIRED",
          },
        },
      });
    });

    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Assessment time has expired. Your attempt has been submitted automatically.",
    );
  }

  // Check assessment lifecycle
  if (attempt.assessment.status !== AssessmentStatus.ONGOING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This assessment is no longer ongoing.",
    );
  }

  // Extra safety check for assessment endAt
  if (
    attempt.assessment.endAt &&
    (isAfter(now, attempt.assessment.endAt) ||
      isEqual(now, attempt.assessment.endAt))
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.attempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: AttemptStatus.SUBMITTED,
          submittedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.SUBMIT,
          entity: AuditEntity.ATTEMPT,
          entityId: attempt.id,
          oldValue: {
            status: AttemptStatus.IN_PROGRESS,
          },
          newValue: {
            status: AttemptStatus.SUBMITTED,
            reason: "ASSESSMENT_ENDED",
          },
        },
      });
    });

    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Assessment time has ended. Your attempt has been submitted automatically.",
    );
  }

  const assessmentProblem = attempt.assessment.problems[0];

  if (!assessmentProblem) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "This problem does not belong to the assessment.",
    );
  }

  const problem = assessmentProblem.problem;

  // Validate MCQ answer
  if (problem.type === ProblemType.MCQ) {
    if (!problem.options.includes(payload.answer)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid option selected.");
    }
  }

  // Calculate correctness only for MCQ
  const isCorrect =
    problem.type === ProblemType.MCQ
      ? problem.correctAnswer === payload.answer
      : null;

  // Create or update answer
  const answer = await prisma.answer.upsert({
    where: {
      attemptId_problemId: {
        attemptId,
        problemId: payload.problemId,
      },
    },
    create: {
      attemptId,
      problemId: payload.problemId,
      answer: payload.answer,
      isCorrect,
    },
    update: {
      answer: payload.answer,
      isCorrect,
    },
    select: {
      id: true,
      attemptId: true,
      problemId: true,
      answer: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: AuditAction.SUBMIT,
      entity: AuditEntity.ATTEMPT,
      entityId: attemptId,
      newValue: {
        problemId: payload.problemId,
      },
    },
  });

  return answer;
};

const submitAssessment = async (userId: string, attemptId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    include: {
      assessment: {
        select: {
          id: true,
          status: true,
          endAt: true,
          totalMarks: true,
          passingMarks: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt has already been submitted.",
    );
  }

  const now = new Date();

  let submitReason: "TIME_EXPIRED" | "ASSESSMENT_ENDED" | "MANUAL_SUBMIT" =
    "MANUAL_SUBMIT";

  // Attempt duration expired
  if (isAfter(now, attempt.expiresAt) || isEqual(now, attempt.expiresAt)) {
    submitReason = "TIME_EXPIRED";
  }

  // Assessment ended
  else if (
    attempt.assessment.endAt &&
    (isAfter(now, attempt.assessment.endAt) ||
      isEqual(now, attempt.assessment.endAt))
  ) {
    submitReason = "ASSESSMENT_ENDED";
  }

  // If it is not expired, assessment must still be ongoing
  if (
    submitReason === "MANUAL_SUBMIT" &&
    attempt.assessment.status !== AssessmentStatus.ONGOING
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This assessment is no longer ongoing.",
    );
  }

  const submittedAttempt = await prisma.$transaction(async (tx) => {
    // 1. Submit attempt
    const updatedAttempt = await tx.attempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: now,
      },
      select: {
        id: true,
        assessmentId: true,
        candidateId: true,
        startedAt: true,
        expiresAt: true,
        submittedAt: true,
        status: true,
      },
    });

    // 2. Check whether the assessment has subjective questions
    const subjectiveQuestions = await tx.assessmentProblem.count({
      where: {
        assessmentId: attempt.assessment.id,
        problem: {
          type: {
            in: [ProblemType.WRITTEN, ProblemType.CODING],
          },
        },
      },
    });

    // 3. If there are no subjective questions,
    //    result is immediately READY
    if (subjectiveQuestions === 0) {
      const answers = await tx.answer.findMany({
        where: {
          attemptId: attempt.id,
        },
        select: {
          marksObtained: true,
        },
      });

      const totalScore = answers.reduce(
        (total, answer) => total + (answer.marksObtained ?? 0),
        0,
      );

      const percentage =
        attempt.assessment.totalMarks > 0
          ? (totalScore / attempt.assessment.totalMarks) * 100
          : 0;

      const passed = totalScore >= attempt.assessment.passingMarks;

      await tx.result.create({
        data: {
          attemptId: attempt.id,
          totalScore,
          percentage,
          passed,
          status: ResultStatus.READY,
          generatedAt: now,
        },
      });
    } else {
      // 4. Subjective answers exist,
      //    so result remains PROCESSING
      await tx.result.create({
        data: {
          attemptId: attempt.id,
          status: ResultStatus.PROCESSING,
        },
      });
    }

    // 5. Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: AuditAction.SUBMIT,
        entity: AuditEntity.ATTEMPT,
        entityId: attempt.id,
        oldValue: {
          status: AttemptStatus.IN_PROGRESS,
        },
        newValue: {
          status: AttemptStatus.SUBMITTED,
          reason: submitReason,
        },
      },
    });

    return updatedAttempt;
  });

  return submittedAttempt;
};

export const attemptServices = {
  startAssessment,
  getMySingleAttempt,
  getAttemptQuestions,
  submitAnswer,
  submitAssessment,
};
