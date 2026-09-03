import z from "zod";

export const createAssessmentValidationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  duration: z.number().int().positive("Duration must be greater than 0"),
  totalMarks: z.number().int().positive("Total marks must be greater than 0"),
  passingMarks: z
    .number()
    .int()
    .positive("Passing marks must be greater than 0"),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});
