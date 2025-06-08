import { z } from "zod";

// Define the interruption type enum to match Prisma schema
export const interruptionTypeSchema = z.enum([
  "SCHEDULED",
  "UNSCHEDULED",
  "EMERGENCY",
]);

// GeoJSON geometry schema for validation
const geoJsonGeometrySchema = z.object({
  type: z.enum(["Polygon", "MultiPolygon"]),
  coordinates: z.array(z.array(z.array(z.number()))),
});

// Schema for multiple polygons - can be array of geometries or FeatureCollection
const polygonDataSchema = z
  .union([
    z.array(geoJsonGeometrySchema), // Array of polygon geometries
    geoJsonGeometrySchema, // Single polygon geometry
    z.object({
      type: z.literal("FeatureCollection"),
      features: z.array(
        z.object({
          type: z.literal("Feature"),
          geometry: geoJsonGeometrySchema,
          properties: z.record(z.any()).optional(),
        })
      ),
    }), // GeoJSON FeatureCollection
    z.null(),
    z.undefined(), // Allow undefined
  ])
  .optional(); // Make the entire schema optional

export const createInterruptionSchema = z
  .object({
    startTime: z
      .string()
      .transform((val) => {
        // Try to parse and convert to ISO string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date.toISOString();
      })
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
      .transform((val) => {
        if (!val) return null;
        // Try to parse and convert to ISO string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date.toISOString();
      })
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
    polygon: polygonDataSchema, // Updated to handle multiple polygons
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
      .transform((val) => {
        // Try to parse and convert to ISO string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date.toISOString();
      })
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
      .transform((val) => {
        if (!val) return null;
        // Try to parse and convert to ISO string
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date.toISOString();
      })
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
    polygon: polygonDataSchema, // Updated to handle multiple polygons
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

export const partialInterruptionSchema = createInterruptionSchema
  .innerType()
  .partial();

export type CreateInterruptionInput = z.infer<typeof createInterruptionSchema>;
export type UpdateInterruptionInput = z.infer<typeof updateInterruptionSchema>;
export type InterruptionQueryInput = z.infer<typeof interruptionQuerySchema>;
export type InterruptionType = z.infer<typeof interruptionTypeSchema>;
export type PartialInterruptionInput = z.infer<
  typeof partialInterruptionSchema
>;
