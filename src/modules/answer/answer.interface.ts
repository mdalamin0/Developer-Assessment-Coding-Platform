import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export type IPendingAnswerQuery = IQuery & Prisma.AnswerWhereInput;

export interface IEvaluateAnswerPayload {
  score: number;
  feedback?: string;
}