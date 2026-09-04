import z from "zod";

export const submitAnswerValidationSchema = z.object({
  problemId: z.string().uuid("Invalid problem ID"),
  answer: z.string().min(1, "Answer is required"),
});
