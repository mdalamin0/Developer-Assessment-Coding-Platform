import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export interface ICreateInvitationPayload {
  candidateId: string;
  expiresAt?: string;
}

export type IInvitationQuery  = IQuery & Prisma.InvitationWhereInput;

export interface IInvitationResponsePayload {
  status: "ACCEPTED" | "DECLINED";
}