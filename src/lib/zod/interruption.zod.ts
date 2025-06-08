import { z } from "zod";

// Define the interruption type enum to match Prisma schema
export const interruptionTypeSchema = z.enum([
  "SCHEDULED",
  "UNSCHEDULED",
  "EMERGENCY",
]);

export const createInterruptionSchema = z
  .object({
    startTime: z
      .string()
      .datetime("Invalid start time format")
      .refine((date) => {
        const startDate = new Date(date);
        const now = new Date();
        // Allow dates up to 1 year in the past and 1 year in the future
        const oneYearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        const oneYearFromNow = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        return startDate >= oneYearAgo && startDate <= oneYearFromNow;
      }, "Start time must be within a reasonable date range"),
    endTime: z
      .string()
      .datetime("Invalid end time format")
      .optional()
      .nullable()
      .refine((date) => {
        if (!date) return true;
        const endDate = new Date(date);
        const now = new Date();
        const oneYearFromNow = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        return endDate <= oneYearFromNow;
      }, "End time must be within a reasonable date range"),
    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .trim()
      .optional()
      .nullable(),
    feederIds: z
      .array(z.string().cuid("Invalid feeder ID format"))
      .min(1, "At least one feeder must be selected")
      .max(50, "Cannot select more than 50 feeders at once"),
    type: interruptionTypeSchema,
    polygon: z.any().optional().nullable(), // GeoJSON polygon data
    customArea: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.endTime && data.startTime) {
        const startDate = new Date(data.startTime);
        const endDate = new Date(data.endTime);
        return endDate >= startDate;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateInterruptionSchema = z
  .object({
    startTime: z
      .string()
      .datetime("Invalid start time format")
      .refine((date) => {
        const startDate = new Date(date);
        const now = new Date();
        const oneYearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        const oneYearFromNow = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        return startDate >= oneYearAgo && startDate <= oneYearFromNow;
      }, "Start time must be within a reasonable date range")
      .optional(),
    endTime: z
      .string()
      .datetime("Invalid end time format")
      .refine((date) => {
        if (!date) return true;
        const endDate = new Date(date);
        const now = new Date();
        const oneYearFromNow = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        return endDate <= oneYearFromNow;
      }, "End time must be within a reasonable date range")
      .optional()
      .nullable(),
    description: z
      .string()
      .max(500, "Description must not exceed 500 characters")
      .trim()
      .optional()
      .nullable(),
    feederIds: z
      .array(z.string().cuid("Invalid feeder ID format"))
      .min(1, "At least one feeder must be selected")
      .max(50, "Cannot select more than 50 feeders at once")
      .optional(),
    type: interruptionTypeSchema.optional(),
    polygon: z.any().optional().nullable(), // GeoJSON polygon data
    customArea: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.endTime && data.startTime) {
        const startDate = new Date(data.startTime);
        const endDate = new Date(data.endTime);
        return endDate >= startDate;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const interruptionQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search term must not exceed 100 characters")
    .optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  status: z.enum(["active", "completed", "all"]).optional().default("all"),
});

export type CreateInterruptionInput = z.infer<typeof createInterruptionSchema>;
export type UpdateInterruptionInput = z.infer<typeof updateInterruptionSchema>;
export type InterruptionQueryInput = z.infer<typeof interruptionQuerySchema>;
export type InterruptionType = z.infer<typeof interruptionTypeSchema>;
