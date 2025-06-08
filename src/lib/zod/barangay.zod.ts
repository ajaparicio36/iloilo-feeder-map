import { z } from "zod";

export const createBarangaySchema = z.object({
  name: z
    .string()
    .min(1, "Barangay name is required")
    .max(100, "Barangay name must not exceed 100 characters")
    .trim(),
  psgcId: z
    .string()
    .min(1, "PSGC ID is required")
    .max(20, "PSGC ID must not exceed 20 characters")
    .regex(/^[0-9]+$/, "PSGC ID must contain only numbers")
    .trim(),
});

export const updateBarangaySchema = z.object({
  name: z
    .string()
    .min(1, "Barangay name is required")
    .max(100, "Barangay name must not exceed 100 characters")
    .trim()
    .optional(),
  psgcId: z
    .string()
    .min(1, "PSGC ID is required")
    .max(20, "PSGC ID must not exceed 20 characters")
    .regex(/^[0-9]+$/, "PSGC ID must contain only numbers")
    .trim()
    .optional(),
});

export const partialBarangaySchema = createBarangaySchema.partial();

export const barangayQuerySchema = z.object({
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

export type CreateBarangayInput = z.infer<typeof createBarangaySchema>;
export type UpdateBarangayInput = z.infer<typeof updateBarangaySchema>;
export type PartialBarangayInput = z.infer<typeof partialBarangaySchema>;
export type BarangayQueryInput = z.infer<typeof barangayQuerySchema>;
