import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Valid email is required")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  role: z
    .enum(["SUPER_ADMIN", "ADMIN", "DEVELOPER"], {
      message: "Invalid role",
    })
    .optional()
    .default("DEVELOPER"),
});

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Valid email is required"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});
