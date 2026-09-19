import { Prisma } from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";

export type IPaymentsQuery = IQuery & Prisma.PaymentWhereInput; 