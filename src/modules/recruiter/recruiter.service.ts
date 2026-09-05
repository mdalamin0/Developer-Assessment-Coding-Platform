import { UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { cloudinary } from "../../lib/cloudinary";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { RecruiterUpdatePayload } from "./recruiter.interface";
import { AssessmentStatus, AttemptStatus, ProblemType, ResultStatus, UserStatus } from "../../../generated/prisma/enums";


const uploadToCloudinary = (buffer: Buffer): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(
              new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Failed to upload company logo.",
              ),
            );
          }
          resolve(result);
        },
      )
      .end(buffer);
  });
};

const updateRecruiterProfile = async (
  userId: string,
  payload: RecruiterUpdatePayload,
  file?: Express.Multer.File,
) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
  });

  if (!recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
  }

  let companyLogo = recruiter.companyLogo;
  let logoPublicId = recruiter.logoPublicId;
   let isNewFileUploaded = false;

  if (file) {
    const cloudinaryResult = await uploadToCloudinary(file.buffer);
    companyLogo = cloudinaryResult.secure_url;
    logoPublicId = cloudinaryResult.public_id;
    isNewFileUploaded = true
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
      },
      omit: { password: true },
    });

    const updatedRecruiter = await tx.recruiter.update({
      where: { userId },
      data: {
        ...(payload.companyName !== undefined && {
          companyName: payload.companyName,
        }),
        ...(payload.companyWebsite !== undefined && {
          companyWebsite: payload.companyWebsite,
        }),
        ...(payload.companyDescription !== undefined && {
          companyDescription: payload.companyDescription,
        }),
        ...(payload.designation !== undefined && {
          designation: payload.designation,
        }),
        ...(isNewFileUploaded && {
          companyLogo,
          logoPublicId,
        }),
      },
    });

    return { ...updatedUser, profile: updatedRecruiter };
  });


   if (isNewFileUploaded && recruiter.logoPublicId) {
     try {
       await cloudinary.uploader.destroy(recruiter.logoPublicId);
     } catch (error) {
       console.error("Failed to delete old logo:", error);
     }
   }


  return result;
};

const getRecruiterDashboardData = async (userId: string) => {
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

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  const recruiterId = user.recruiter.id;

  const [
    totalAssessments,
    publishedAssessments,
    totalCandidates,
    totalAttempts,
    pendingEvaluations,
    scoreData,
  ] = await Promise.all([
    prisma.assessment.count({
      where: {
        recruiterId,
        deletedAt: null,
      },
    }),

    prisma.assessment.count({
      where: {
        recruiterId,
        status: AssessmentStatus.PUBLISHED,
        deletedAt: null,
      },
    }),

    prisma.attempt.findMany({
      where: {
        assessment: {
          recruiterId,
          deletedAt: null,
        },
      },
      distinct: ["candidateId"],
      select: {
        candidateId: true,
      },
    }),

    prisma.attempt.count({
      where: {
        assessment: {
          recruiterId,
          deletedAt: null,
        },
      },
    }),

    prisma.answer.count({
      where: {
        evaluation: null,
        problem: {
          type: {
            in: [ProblemType.WRITTEN, ProblemType.CODING],
          },
        },
        attempt: {
          status: AttemptStatus.SUBMITTED,
          assessment: {
            recruiterId,
            deletedAt: null,
          },
        },
      },
    }),

    prisma.result.aggregate({
      where: {
        status: ResultStatus.READY,
        attempt: {
          assessment: {
            recruiterId,
            deletedAt: null,
          },
        },
      },
      _avg: {
        percentage: true,
      },
    }),
  ]);

  return {
    totalAssessments,
    publishedAssessments,
    totalCandidates: totalCandidates.length,
    totalAttempts,
    pendingEvaluations,
    averageScore: scoreData._avg.percentage ?? 0,
  };
};

const getAssessmentStatistics = async (
  userId: string,
  assessmentId: string,
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
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter not found.");
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
    select: {
      id: true,
      title: true,
      totalMarks: true,
      passingMarks: true,
    },
  });

  if (!assessment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Assessment not found or you do not have access to it.",
    );
  }

  const [
    totalCandidates,
    totalAttempts,
    completedAttempts,
    pendingEvaluation,
    passed,
    failed,
    averageScore,
  ] = await Promise.all([
    prisma.invitation.count({
      where: {
        assessmentId,
      },
    }),

    prisma.attempt.count({
      where: {
        assessmentId,
      },
    }),

    prisma.attempt.count({
      where: {
        assessmentId,
        status: AttemptStatus.SUBMITTED,
      },
    }),

    prisma.answer.count({
      where: {
        evaluation: null,
        problem: {
          type: {
            in: [ProblemType.WRITTEN, ProblemType.CODING],
          },
        },
        attempt: {
          assessmentId,
          status: AttemptStatus.SUBMITTED,
        },
      },
    }),

    prisma.result.count({
      where: {
        status: ResultStatus.READY,
        passed: true,
        attempt: {
          assessmentId,
        },
      },
    }),

    prisma.result.count({
      where: {
        status: ResultStatus.READY,
        passed: false,
        attempt: {
          assessmentId,
        },
      },
    }),

    prisma.result.aggregate({
      where: {
        status: ResultStatus.READY,
        attempt: {
          assessmentId,
        },
      },
      _avg: {
        percentage: true,
      },
    }),
  ]);

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
    },
    statistics: {
      totalCandidates,
      totalAttempts,
      completedAttempts,
      pendingEvaluation,
      passed,
      failed,
      averageScore: averageScore._avg.percentage ?? 0,
    },
  };
};

export const recruiterServices = {
  updateRecruiterProfile,
  getRecruiterDashboardData,
  getAssessmentStatistics
};
