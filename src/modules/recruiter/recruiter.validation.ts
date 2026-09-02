import z from "zod";

export const recruiterUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  companyName: z
    .string()
    .min(1, "Company name cannot be empty")
    .max(200, "Company name must not exceed 200 characters")
    .optional(),
  companyWebsite: z
    .string()
    .url("Invalid company website URL")
    .optional()
    .or(z.literal("")),
  companyDescription: z
    .string()
    .max(2000, "Company description must not exceed 2000 characters")
    .optional(),
  designation: z
    .string()
    .max(100, "Designation must not exceed 100 characters")
    .optional(),
});
