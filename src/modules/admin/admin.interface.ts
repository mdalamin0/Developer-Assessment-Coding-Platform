import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export interface AdminUpdatePayload {
  name?: string;
}


export type IUserQuery = IQuery & Prisma.UserWhereInput;