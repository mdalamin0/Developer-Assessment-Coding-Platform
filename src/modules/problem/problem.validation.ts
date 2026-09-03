import z from "zod";

export const createProblemValidationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  type: z.enum(["MCQ", "WRITTEN", "CODING"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  marks: z.number().int().positive("Marks must be greater than 0"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});

export const updateProblemValidationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().min(5, "Description must be at least 5 characters").optional(),
  type: z.enum(["MCQ", "WRITTEN", "CODING"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  marks: z.number().int().positive("Marks must be greater than 0").optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});
