import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string({ message: "Comment content is required" })
    .trim()
    .min(1, "Comment content is required")
    .max(10000, "Comment content cannot exceed 10000 characters"),
});

export const updateCommentSchema = z.object({
  content: z
    .string({ message: "Comment content is required" })
    .trim()
    .min(1, "Comment content is required")
    .max(10000, "Comment content cannot exceed 10000 characters"),
});
