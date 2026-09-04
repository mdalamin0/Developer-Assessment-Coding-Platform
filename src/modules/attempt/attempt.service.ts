import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { AttemptStatus, AssessmentStatus, AuditAction, AuditEntity, InvitationStatus, UserStatus } from "../../../generated/prisma/enums";

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

  const attempt = await prisma.attempt.create({
    data: {
      assessmentId,
      candidateId: userId,
      startedAt: new Date(),
      status: AttemptStatus.IN_PROGRESS,
    },
    select: {
      id: true,
      assessmentId: true,
      candidateId: true,
      startedAt: true,
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
          submissions: true,
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


export const attemptServices = {
  startAssessment,
  getMySingleAttempt,
  getAttemptQuestions,
};

