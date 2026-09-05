import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export type IResultsQuery = IQuery & Prisma.ResultWhereInput; 