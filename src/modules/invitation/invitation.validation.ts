import z from "zod";

export const createInvitationValidationSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  expiresAt: z.string().datetime().optional(),
});

export const invitationResponseValidationSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

