import z from "zod";

export const evaluateAnswerValidationSchema = z.object({
  score: z.number().int().min(0, "Score cannot be negative."),
  feedback: z
    .string()
    .max(1000, "Feedback cannot exceed 1000 characters.")
    .optional(), 
});
