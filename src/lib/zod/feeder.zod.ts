import { z } from "zod";

export const createFeederSchema = z.object({
  name: z
    .string()
    .min(1, "Feeder name is required")
    .max(100, "Feeder name must not exceed 100 characters")
    .trim(),
});

export const updateFeederSchema = z.object({
  name: z
    .string()
    .min(1, "Feeder name is required")
    .max(100, "Feeder name must not exceed 100 characters")
    .trim()
    .optional(),
});

export const partialFeederSchema = createFeederSchema.partial();

export const feederQuerySchema = z.object({
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
});

export type CreateFeederInput = z.infer<typeof createFeederSchema>;
export type UpdateFeederInput = z.infer<typeof updateFeederSchema>;
export type PartialFeederInput = z.infer<typeof partialFeederSchema>;
export type FeederQueryInput = z.infer<typeof feederQuerySchema>;
