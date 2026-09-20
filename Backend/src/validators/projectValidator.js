import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ message: "Project name is required" })
    .trim()
    .min(1, "Project name is required")
    .max(150, "Project name cannot exceed 150 characters"),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name cannot be empty")
      .max(150, "Project name cannot exceed 150 characters")
      .optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: z
      .enum(["ACTIVE", "ARCHIVED"], {
        message: "Invalid project status",
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field is required to update the project",
    }
  );
