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
            },
          },
        },
      },
    },
  })

  if (!period) {
    return c.json({ message: "Đợt đánh giá không tồn tại" }, 404)
  }

  const seen = new Set<string>()
  const evidenceTags: Record<string, string> = {}
  const result: any[] = []

  for (const [o1, standard] of period.standards.entries()) {
    for (const [o2, criteria] of standard.criteria.entries()) {
      let evidenceCount = 0

      for (const req of criteria.analysisCriterions?.requirementCriterions ?? []) {
        for (const ev of req.evidences) {
          if (seen.has(ev.evidenceId)) continue

          seen.add(ev.evidenceId)
          evidenceCount++

          const tag = [o1 + 1, o2 + 1, evidenceCount]
            .map((t) => t.toString().padStart(2, "0"))
            .join(".")

          result.push({ ...ev, tag })
          evidenceTags[ev.evidenceId] = `[PM.${tag}]`
        }
      }
    }
  }

  return c.json({ evidenceTags, result }, 200)
})

export default app
