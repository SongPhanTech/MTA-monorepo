import { z } from "@hono/zod-openapi"

export const RequestSchema = z.object({
  preview: z.boolean().optional().default(false),

  labels: z
    .array(z.enum(["target", "admitted", "enrolled", "rate"]))
    .optional()
    .default(["target", "admitted", "enrolled", "rate"]),

  trainingLevelNames: z.array(z.string()).optional(),
  includeEmpty: z.boolean().optional().default(false),
})
export const ResponseSchema = z.object({
  year: z.string(),
  objectType: z.string(),
  trainingLevel: z.string(),
  target: z.number().optional(),
  admitted: z.number().optional(),
  enrolled: z.number().optional(),
  rate: z.number().optional(),
})
