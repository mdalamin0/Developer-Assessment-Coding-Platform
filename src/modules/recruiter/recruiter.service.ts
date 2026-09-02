import { UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { cloudinary } from "../../lib/cloudinary";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { RecruiterUpdatePayload } from "./recruiter.interface";


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

  if (file) {
    const cloudinaryResult = await uploadToCloudinary(file.buffer);
    companyLogo = cloudinaryResult.secure_url;
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
        ...(companyLogo !== recruiter.companyLogo && { companyLogo }),
      },
    });

    return { ...updatedUser, profile: updatedRecruiter };
  });

  return result;
};

export const recruiterServices = {
  updateRecruiterProfile,
};
