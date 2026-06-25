import { z } from "@hono/zod-openapi"
import { models } from "@workspace/db/zod"
import { fieldDesc } from "./openapi-helpers"

export const EvidenceTagResultItemSchema = z
  .object({
    evidenceId: z.string().openapi(fieldDesc("ID minh chứng.")),
    evidence: models.EvidenceScalarSchema.nullable()
      .optional()
      .openapi(fieldDesc("Chi tiết minh chứng.")),
    tag: z.string().openapi(fieldDesc("Mã tag gán (vd. PM.01.02.03).")),
  })
  .openapi("EvidenceTagResultItem")

export const CalcEvidenceTagsResponseSchema = z
  .object({
    evidenceTags: z
      .record(z.string(), z.string())
      .openapi(fieldDesc("Map evidenceId → chuỗi tag [PM.xxx].")),
    result: z
      .array(EvidenceTagResultItemSchema)
      .openapi(fieldDesc("Danh sách minh chứng kèm tag.")),
  })
  .openapi("CalcEvidenceTagsResponse")
