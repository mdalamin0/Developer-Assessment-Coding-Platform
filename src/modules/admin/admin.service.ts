import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status"
import { AdminUpdatePayload } from "./admin.interface";

const updateAdminProfile = async (
  userId: string,
  payload: AdminUpdatePayload,
) => {
  const admin = await prisma.user.findUnique({
    where: { id:  userId },
  });

  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, "Admin profile not found!");
  }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
      },
      omit: { password: true },
    });

 

  return updatedUser;
};


export const adminServices = {
updateAdminProfile
}