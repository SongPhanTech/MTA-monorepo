import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { Prisma } from "@workspace/db"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { prisma } from ".."

const SqlTransactionItemSchema = z
  .object({
    model: z.nativeEnum(Prisma.ModelName).openapi(fieldDesc("Tên model Prisma.")),
    operation: z.string().openapi(fieldDesc("Tên thao tác (create, update, delete, ...).")),
    data: z.any().openapi(fieldDesc("Dữ liệu truyền vào thao tác.")),
  })
  .openapi("SqlTransactionItem")

const app = new OpenAPIHono({ strict: false })
app.openapi(
  createRoute({
    operationId: "sqlTransaction",
    tags: ["SQL Transaction"],
    summary: "Thực thi batch thao tác Prisma trong transaction",
    path: "/transaction",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.array(SqlTransactionItemSchema),
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(z.any()), "Kết quả từng thao tác trong transaction"),
      500: {
        description: "Model hoặc operation không tồn tại",
        content: { "application/json": { schema: ErrorMessageResponseSchema } },
      },
    },
  }),
  async (c) => {
    const data = c.req.valid("json")
    const authUser = c.get("user") as any
    const updatedById = authUser?.id || null

    const res = await prisma.$transaction(
      async (tx) => {
        const result = []
        for (const element of data) {
          const key = (element.model.charAt(0).toLowerCase() +
            element.model.slice(1)) as keyof Prisma.TransactionClient

          if (!tx[key]) {
            throw new Error(`Model ${element.model} not found in transaction`)
          }
          const operation = element.operation as any
          if (!operation) {
            throw new Error(`Operation ${element.operation} not found in model ${element.model}`)
          }

          // Intercept updates to SubjectClass to validate locking and log changes
          if (
            element.model === "SubjectClass" &&
            (operation === "update" || operation === "updateMany")
          ) {
            const classId = element.data?.where?.id
            if (classId) {
              const currData = await tx.subjectClass.findUnique({
                where: { id: classId },
              })

              if (currData) {
                const newData = element.data?.data || {}
                const isLocked = currData.isLockLecturer ?? true

                // 1. Check if lecturer fields are modified when locked
                const isLecturerChanging =
                  (newData.lecturerId !== undefined &&
                    newData.lecturerId !== currData.lecturerId) ||
                  (newData.extraLecturerId !== undefined &&
                    newData.extraLecturerId !== currData.extraLecturerId) ||
                  (newData.enterGradeLecturerId !== undefined &&
                    newData.enterGradeLecturerId !== currData.enterGradeLecturerId)

                if (isLocked && isLecturerChanging) {
                  throw new Error("Lớp học phần đang bị khoá phân công giảng viên")
                }

                // 2. Create history log if lecturer or lock status changes
                const isLockStatusChanging =
                  newData.isLockLecturer !== undefined &&
                  newData.isLockLecturer !== currData.isLockLecturer

                if (isLecturerChanging || isLockStatusChanging) {
                  await tx.subjectClassHistory.create({
                    data: {
                      subjectClassId: classId,
                      isLockLecturer:
                        newData.isLockLecturer !== undefined
                          ? newData.isLockLecturer
                          : currData.isLockLecturer,
                      isLockScore: currData.isLockScore,
                      isLockExamScore: currData.isLockExamScore,
                      updatedById: updatedById,
                    },
                  })
                }
              }
            }
          }

          // Đăng ký cá nhân xóa điểm khi đổi lớp. Bài thi chưa phách chặn khóa ngoại ExamPaper.
          if (
            element.model === "StudentSubjectScore" &&
            (operation === "delete" || operation === "deleteMany") &&
            element.data?.where
          ) {
            const scores = await tx.studentSubjectScore.findMany({
              where: element.data.where,
              select: {
                id: true,
                examPaper: { select: { examCode: true } },
              },
            })
            if (scores.some((score) => score.examPaper?.examCode)) {
              throw new Error("Học phần đã đánh phách, không thể đổi lớp.")
            }
            const scoreIds = scores.map((score) => score.id)
            if (scoreIds.length > 0) {
              const where = { studentSubjectScoreId: { in: scoreIds } }
              await tx.examPaper.deleteMany({ where })
              await tx.studentSubjectScoreHistory.deleteMany({ where })
            }
          }

          // @ts-expect-error
          result.push(await tx[key][operation](element.data))
        }
        return result
      },
      { timeout: 120_000, maxWait: 30_000 }
    )
    return c.json(res)
  }
)

export default app
