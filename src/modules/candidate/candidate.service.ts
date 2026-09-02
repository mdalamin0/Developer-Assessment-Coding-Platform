import { UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { cloudinary } from "../../lib/cloudinary";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { CandidateUpdatePayload } from "./candidate.interface";

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
                "Failed to upload resume.",
              ),
            );
          }
          resolve(result);
        },
      )
      .end(buffer);
  });
};

const updateCandidateProfile = async (
  userId: string,
  payload: CandidateUpdatePayload,
  file?: Express.Multer.File,
) => {
  const candidate = await prisma.candidate.findUnique({
    where: { userId },
  });

  if (!candidate) {
    throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
  }

  let resumeUrl = candidate.resumeUrl;
  let resumePublicId = candidate.resumePublicId;
  let isNewFileUploaded = false;

  if (file) {
    const cloudinaryResult = await uploadToCloudinary(file.buffer);
    resumeUrl = cloudinaryResult.secure_url;
    resumePublicId = cloudinaryResult.public_id;
    isNewFileUploaded = true;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
      },
      omit: { password: true },
    });

    const updatedCandidate = await tx.candidate.update({
      where: { userId },
      data: {
        ...(payload.contactNumber !== undefined && {
          contactNumber: payload.contactNumber,
        }),
        ...(payload.bio !== undefined && { bio: payload.bio }),
        ...(payload.skills !== undefined && { skills: payload.skills }),
        ...(payload.experience !== undefined && {
          experience: payload.experience,
        }),
        ...(payload.githubUrl !== undefined && {
          githubUrl: payload.githubUrl,
        }),
        ...(payload.linkedinUrl !== undefined && {
          linkedinUrl: payload.linkedinUrl,
        }),
        ...(isNewFileUploaded && {
          resumeUrl,
          resumePublicId,
        }),
      },
    });

    return { ...updatedUser, profile: updatedCandidate };
  });

  if (isNewFileUploaded && candidate.resumePublicId) {
    try {
      await cloudinary.uploader.destroy(candidate.resumePublicId);
    } catch (error) {
      console.error("Failed to delete old resume:", error);
    }
  }

  return result;
};

export const candidateServices = {
  updateCandidateProfile,
};
