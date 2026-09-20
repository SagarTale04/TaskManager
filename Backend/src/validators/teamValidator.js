import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string({ message: "Team name is required" })
    .trim()
    .min(1, "Team name is required")
    .max(100, "Team name cannot exceed 100 characters"),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const addTeamMemberSchema = z.object({
  userId: z
    .coerce
    .number({
      message: "userId must be a number",
    })
    .int("userId must be an integer")
    .positive("userId must be positive"),
  role: z
    .enum(["ADMIN", "MEMBER"], {
      message: "Invalid team role",
    })
    .optional()
    .default("MEMBER"),
});

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    message: "Invalid team role",
  }),
});
