import { z } from "@hono/zod-openapi";

export const PaginationQuerySchema = z
  .object({
    page: z.number({ coerce: false }).optional(),
    limit: z.number({ coerce: true }).optional(),
  })
  .openapi("PaginationQuery");

export const ListOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  PaginationQuerySchema.extend({
    data: z.array(itemSchema),
    count: z.number(),
  }).openapi("ListOf" + itemSchema._def.openapi?._internal?.refId);
