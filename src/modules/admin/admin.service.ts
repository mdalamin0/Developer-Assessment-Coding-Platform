import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { AdminUpdatePayload, IAuditLogQuery, IUserQuery } from "./admin.interface";
import { Prisma } from "../../../generated/prisma/client";
import { AuditAction, AuditEntity, Role, UserStatus } from "../../../generated/prisma/enums";

const updateAdminProfile = async (
  userId: string,
  payload: AdminUpdatePayload,
) => {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
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

const getAllUsers = async (query: IUserQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: Prisma.UserWhereInput[] = [
    {
      deletedAt: null,
    },
    {
      role: {
        in: [Role.CANDIDATE, Role.RECRUITER],
      },
    },
  ];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.role) {
    const normalizedRole = (query.role as string).toUpperCase() as Role;

    andConditions.push({
      role: {
        equals: normalizedRole,
      },
    });
  }

  if (query.status) {
    const normalizedStatus = (
      query.status as string
    ).toUpperCase() as UserStatus;

    andConditions.push({
      status: {
        equals: normalizedStatus,
      },
    });
  }

  const users = await prisma.user.findMany({
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
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      provider: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,

      candidate: {
        select: {
          id: true,
          contactNumber: true,
          bio: true,
          resumeUrl: true,
          resumePublicId: true,
          skills: true,
          experience: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      },

      recruiter: {
        select: {
          id: true,
          companyName: true,
          companyWebsite: true,
          companyDescription: true,
          designation: true,
        },
      },
    },
  });

  const formattedUsers = users.map((user) => {
    const { candidate, recruiter, ...userData } = user;

    if (user.role === Role.CANDIDATE) {
      return {
        ...userData,
        candidate,
      };
    }

    if (user.role === Role.RECRUITER) {
      return {
        ...userData,
        recruiter,
      };
    }

    return userData;
  });

  const total = await prisma.user.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: formattedUsers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Deleted user cannot be activated or suspended.",
    );
  }

  if (user.status === status) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is already ${status.toLowerCase()}.`,
    );
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action:
        status === UserStatus.SUSPENDED
          ? AuditAction.SUSPEND
          : AuditAction.ACTIVATE,
      entity: AuditEntity.USER,
      entityId: userId,
      oldValue: {
        status: user.status,
      },
      newValue: {
        status: updatedUser.status,
      },
    },
  });

  return updatedUser;
};

const getAuditLogs = async (query: IAuditLogQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          entityId: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.action) {
    const normalizedAction = (
      query.action as string
    ).toUpperCase() as AuditAction;

    andConditions.push({
      action: normalizedAction,
    });
  }

  if (query.entity) {
    const normalizedEntity = (
      query.entity as string
    ).toUpperCase() as AuditEntity;

    andConditions.push({
      entity: normalizedEntity,
    });
  }

  if (query.userId) {
    andConditions.push({
      userId: query.userId as string,
    });
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  const total = await prisma.auditLog.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const adminServices = {
  updateAdminProfile,
  getAllUsers,
  updateUserStatus,
  getAuditLogs
};
