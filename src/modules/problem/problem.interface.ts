import { Prisma } from "../../../generated/prisma/client";
import { Difficulty, ProblemType } from "../../../generated/prisma/enums";
import { IQuery } from "../../interfaces";

export interface ICreateProblemPayload {
  title: string;
  description: string;
  type: ProblemType;
  difficulty?: Difficulty;
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

export type IProblemQuery = IQuery & Prisma.ProblemWhereInput;
