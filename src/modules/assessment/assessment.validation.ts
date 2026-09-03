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

export const updateAssessmentValidationSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),

    description: z.string().optional(),

    duration: z
      .number()
      .int()
      .positive("Duration must be greater than 0")
      .optional(),

    totalMarks: z
      .number()
      .int()
      .positive("Total marks must be greater than 0")
      .optional(),

    passingMarks: z
      .number()
      .int()
      .positive("Passing marks must be greater than 0")
      .optional(),

    startAt: z.string().datetime().nullable().optional(),

    endAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.totalMarks !== undefined && data.passingMarks !== undefined) {
        return data.passingMarks <= data.totalMarks;
      }

      return true;
    },
    {
      message: "Passing marks cannot be greater than total marks.",
      path: ["passingMarks"],
    },
  )
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }

      return true;
    },
    {
      message: "End time must be greater than start time.",
      path: ["endAt"],
    },
  );

export const addProblemValidationSchema = z.object({
  problemId: z.string().uuid("Invalid problem ID"),
});

export const reorderProblemsValidationSchema = z.object({
  problems: z
    .array(
      z.object({
        problemId: z.string().uuid("Invalid problem ID"),
        questionOrder: z
          .number()
          .int()
          .positive("Question order must be greater than 0"),
      }),
    )
    .min(1, "At least one problem is required"),
});