import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export interface ICreateAssessmentPayload {
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startAt?: string;
  endAt?: string;
}

export type IAssessmentQuery = IQuery & Prisma.AssessmentWhereInput;

export interface IUpdateAssessmentPayload {
  title?: string;
  description?: string;
  duration?: number;
  totalMarks?: number;
  passingMarks?: number;
  startAt?: string | null;
  endAt?: string | null;
}

export interface IAddProblemPayload {
  problemId: string;
}

export interface IReorderProblem {
  problemId: string;
  questionOrder: number;
}

export interface IReorderProblemsPayload {
  problems: IReorderProblem[];
}
