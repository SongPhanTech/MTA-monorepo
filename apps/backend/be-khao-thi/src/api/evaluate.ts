import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })

const calcEvidenceTagsRoute = createRoute({
  operationId: "calc-evidence-tags",
  path: "/calc-evidence-tags",
  tags: ["Evaluate"],
  summary: "Đánh tag minh chứng cho đợt đánh giá",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              id: z.string().openapi("id", { description: "ID đợt đánh giá" }),
            })
            .openapi("calc-evidence-tags"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Danh sách minh chứng kèm tag.",
      content: {
        "application/json": {
          schema: z.object({
            evidenceTags: z.record(z.string(), z.string()),
            result: z.array(z.any()),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

app.openapi(calcEvidenceTagsRoute, async (c) => {
  const { id } = c.req.valid("json")

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id },
    select: {
      standards: {
        orderBy: { order: "asc" },
        select: {
          criteria: {
            orderBy: { order: "asc" },
            select: {
              analysisCriterions: {
                select: {
                  requirementCriterions: {
                    select: {
                      evidences: {
                        select: {
                          evidenceId: true,
                          evidence: true,
                        },
                      },
                    },
                  },
                },
              },
              evaluationCriterion: {
                select: {
                  currentSituation: true,
                  strengths: true,
                  weakness: true,
                  actionPlan: true,
                  score: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!period) {
    return c.json({ message: "Đợt đánh giá không tồn tại" }, 404)
  }

  const evidenceDetailsMap = new Map<string, any>()
  for (const standard of period.standards) {
    for (const criterion of standard.criteria) {
      for (const req of criterion.analysisCriterions?.requirementCriterions ?? []) {
        for (const ev of req.evidences) {
          if (!evidenceDetailsMap.has(ev.evidenceId)) {
            evidenceDetailsMap.set(ev.evidenceId, ev.evidence)
          }
        }
      }
    }
  }

  function extractSpanIds(html: string | null | undefined): string[] {
    if (!html) return []
    const ids: string[] = []
    const regex = /<span[^>]+data-evidence-id="([^"]+)"[^>]*>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      ids.push(match[1]!)
    }
    return ids
  }

  const seen = new Set<string>()
  const evidenceTags: Record<string, string> = {}
  const result: any[] = []

  for (const [o1, standard] of period.standards.entries()) {
    for (const [o2, criterion] of standard.criteria.entries()) {
      let evidenceCount = 0
      const ev = criterion.evaluationCriterion
      const htmlFields = [ev?.currentSituation, ev?.strengths, ev?.weakness, ev?.actionPlan, ev?.score]

      for (const html of htmlFields) {
        for (const evidenceId of extractSpanIds(html)) {
          if (seen.has(evidenceId)) continue
          seen.add(evidenceId)
          evidenceCount++

          const tag = [o1 + 1, o2 + 1, evidenceCount]
            .map((t) => t.toString().padStart(2, "0"))
            .join(".")

          const evidence = evidenceDetailsMap.get(evidenceId)
          result.push({ evidenceId, evidence, tag })
          evidenceTags[evidenceId] = `[PM.${tag}]`
        }
      }
    }
  }

  return c.json({ evidenceTags, result }, 200)
})

export default app
