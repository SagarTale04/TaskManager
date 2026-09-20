import { z } from "zod";

export const createSprintSchema = z
  .object({
    name: z
      .string({ message: "Sprint name is required" })
      .trim()
      .min(1, "Sprint name is required")
      .max(150, "Sprint name cannot exceed 150 characters"),
    goal: z.string().trim().max(5000).optional().nullable(),
    startDate: z
      .string({ message: "startDate is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format"),
    endDate: z
      .string({ message: "endDate is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format"),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );

export const updateSprintSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Sprint name cannot be empty")
      .max(150)
      .optional(),
    goal: z.string().trim().max(5000).optional().nullable(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format")
      .optional(),
    status: z
      .enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"], {
        message: "Invalid sprint status",
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.goal !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field is required to update the sprint",
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );
