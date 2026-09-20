import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string({ message: "Task title is required" })
    .trim()
    .min(1, "Task title is required")
    .max(200, "Task title cannot exceed 200 characters"),
  description: z.string().trim().max(10000).optional().nullable(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"], {
      message: "Invalid task status",
    })
    .optional()
    .default("TODO"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
      message: "Invalid task priority",
    })
    .optional()
    .default("MEDIUM"),
  storyPoints: z
    .coerce
    .number({ message: "storyPoints must be a number" })
    .int("storyPoints must be an integer")
    .min(0, "storyPoints cannot be negative")
    .optional()
    .nullable(),
  assignedTo: z.coerce.number().int().positive().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  sprintId: z.coerce.number().int().positive().optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title cannot be empty")
      .max(200)
      .optional(),
    description: z.string().trim().max(10000).optional().nullable(),
    status: z
      .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"], {
        message: "Invalid task status",
      })
      .optional(),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
        message: "Invalid task priority",
      })
      .optional(),
    storyPoints: z
      .coerce
      .number({ message: "storyPoints must be a number" })
      .int("storyPoints must be an integer")
      .min(0, "storyPoints cannot be negative")
      .optional()
      .nullable(),
    assignedTo: z.coerce.number().int().positive().optional().nullable(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be in YYYY-MM-DD format")
      .optional()
      .nullable(),
    sprintId: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.storyPoints !== undefined ||
      data.assignedTo !== undefined ||
      data.dueDate !== undefined ||
      data.sprintId !== undefined,
    {
      message: "At least one field is required to update the task",
    }
  );
