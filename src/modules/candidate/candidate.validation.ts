import z from "zod";

export const candidateUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  contactNumber: z
    .string()
    .min(7, "Contact number must be at least 7 characters")
    .max(20, "Contact number must not exceed 20 characters")
    .optional(),
  bio: z.string().max(1000, "Bio must not exceed 1000 characters").optional(),
  skills: z
    .array(z.string().min(1, "Skill cannot be empty"))
    .max(50, "Cannot add more than 50 skills")
    .optional(),
  experience: z
    .number()
    .int("Experience must be a whole number")
    .min(0, "Experience cannot be negative")
    .max(50, "Experience cannot exceed 50 years")
    .optional(),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Invalid LinkedIn URL")
    .optional()
    .or(z.literal("")),
});
