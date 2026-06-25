import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { read, utils } from "xlsx"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { excelSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const exportExcelListStudentFixedClassTrainingPoint = createRoute({
  operationId: "exportStudentFixedClassExcelTrainingPoint",
  path: "/export-xlsx-list-student-fixed-class-training-point",
  summary: "Xuất điểm rèn luyện lớp NC",
  description: `Xuất Excel danh sách học viên và điểm rèn luyện theo lớp niên chế.

**Bảng dữ liệu nguồn:** FixedClass, Student, TrainingScore.

**Tham số:** fixedClassId (query).`,
  tags: ["Điểm rèn luyện"],
  method: "get",
  request: {
    query: z.object({
      fixedClassId: z.string().openapi(fieldDesc("ID lớp niên chế (FixedClass).")),
    }),
  },
  responses: {
    ...excelSuccess("File Excel điểm rèn luyện lớp niên chế"),
    ...standardErrorResponses(),
    400: {
      description: "Tham số không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy lớp niên chế",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

const uploadExcelImportTrainingScore = createRoute({
  operationId: "uploadExcelImportTrainingScore",
  path: "/upload-excel-import-score",
  method: "post",
  summary: "Import điểm rèn luyện",
  description: `Nhập điểm rèn luyện lớp niên chế từ Excel.

**Bảng dữ liệu nguồn:** TrainingScore, FixedClass, TrainingSession.

**Tham số:** file, fixedClassId, trainingSessionId.`,
  tags: ["Điểm rèn luyện"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            fixedClassId: z.string().openapi(fieldDesc("ID lớp niên chế.")),
            trainingSessionId: z.string().openapi(fieldDesc("ID đợt đánh giá rèn luyện.")),
          }).openapi("uploadExcelImportTrainingScore"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.number()),
            count: z.number(),
          }),
        },
      },
      description: "Import điểm rèn luyện thành công",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "File không hợp lệ hoặc dữ liệu không khớp",
    },
  },
})

app.openapi(uploadExcelImportTrainingScore, async (c) => {
  const { file, fixedClassId, trainingSessionId } = c.req.valid("form")

  const maxFileSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxFileSize) {
    return c.json({ message: "File vượt quá 50MB" }, 400)
  }

  // Đọc file Excel
  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: "array" })

  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }

  // Chuyển đổi dữ liệu từ sheet thành JSON
  const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

  // Kiểm tra mã lớp có trùng với đầu vào không để tránh nhập nhầm
  const cellAddress = "C4"
  const cell = sheet[cellAddress]
  const cellValue = cell ? cell.v : null
  console.log(`Giá trị ô ${cellAddress}:`, cellValue)

  const fixedClass = await prisma.fixedClass.findFirst({
    where: { id: fixedClassId },
  })

  if (!fixedClass?.code) {
    return c.json({ message: "Không tìm thấy lớp học" }, 400)
  }
  if (fixedClass?.name !== cellValue) {
    return c.json({ message: "Tên lớp không trùng khớp" }, 400)
  }

  const scoreUpdates = rowData
    .slice(11)
    .map((row) => ({
      studentCode: row[1],
      scoreRL: Number(row[5]),
    }))
    .filter((update) => update.studentCode)

  const studentCodes = scoreUpdates
    .map((update) => update.studentCode)
    .filter((code): code is string => Boolean(code))
  const students = await prisma.student.findMany({
    where: {
      active: true,
      code: { in: studentCodes },
    },
    select: {
      id: true,
      code: true,
    },
  })
  // Prepare data for bulk insert
  const recordsToInsert = scoreUpdates.reduce(
    (acc, { studentCode, scoreRL }) => {
      const student = students.find((s) => s.code === studentCode)
      if (student) {
        acc.push({
          studentId: student.id,
          score: scoreRL,
          trainingScoreSessionId: trainingSessionId,
          active: true,
        })
      }
      return acc
    },
    [] as {
      studentId: string
      score: number
      trainingScoreSessionId: string
      active: boolean
    }[]
  )

  // Bulk insert the records
  const insertResult = await prisma.studentTrainingScore.createMany({
    data: recordsToInsert,
    skipDuplicates: true,
  })
  const totalInserted = insertResult.count
  console.log(`Total records inserted: ${totalInserted}`)

  return c.json({ data: [totalInserted], count: totalInserted }, 200)
})

export default app
