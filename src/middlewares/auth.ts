import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import AppError from "../errors/AppError";
import httpStatus from "http-status";

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in. please log in");
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(httpStatus.UNAUTHORIZED, verifiedToken.error);
    }

    
    const { userId, email, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Forbidden, you have don't permission");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        email,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found! Please login again.");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been suspended. Please contact support!",
      );
    }

    if (user.status === UserStatus.DELETED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been deleted. Please contact support!",
      );
    }

    req.user = user;

    next();
  });
};
