import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import { read, utils } from "xlsx"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"

const app = new OpenAPIHono({ strict: false })

const classDivision = createRoute({
  operationId: "classDivision",
  path: "/upload-excel-update-user-profile",
  method: "post",
  summary: "Phân lớp học viên từ Excel",
  description: `Import Excel gán học viên vào lớp niên chế (quản lý).

**Bảng dữ liệu nguồn:** FixedClass, UserProfile, Student.

**Tham số:** file — file Excel danh sách (cột mã HV, mã lớp).`,
  tags: ["FixedClass"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.openapi("classDivision"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(z.any()),
        },
      },
      description: "Tải danh sách thành công",
    },
    400: {
      description: "Invalid file upload",
    },
  },
})

app.openapi(classDivision, async (c) => {
  const { file } = c.req.valid("form")
  const fileSize = file.size // Kích thước file trong byte
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  if (fileSize > maxFileSize) {
    return c.json({ message: "File size exceeds 50MB" }, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: "array" })

  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return c.json({ message: "No sheets found in the uploaded Excel file" }, 400)
  }
  const sheet = workbook.Sheets[sheetName]

  if (!sheet) {
    return c.json({ message: "Sheet is undefined in the uploaded Excel file" }, 400)
  }

  // Chuyển đổi dữ liệu từ sheet thành JSON
  const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

  // Duyệt dòng 11 theo mẫu
  const data = await prisma.$transaction(async (prisma) => {
    return await Promise.all(
      rowData.slice(11).map(async (row, index) => {
        const fixedClass = await prisma.fixedClass.findFirst({
          where: { code: row[7] }, // Tìm kiếm lớp quản lý
        })
        if (!fixedClass) {
          return `Không tìm thấy lớp quản lý ${row[7]}`
        }
        const userProfile = await prisma.userProfile.findFirst({
          where: { code: row[1] }, // Tìm kiếm UserType của Sinh viên
        })
        if (!userProfile) {
          return `Không tìm thấy học viên ${row[1]}`
        }
        let fixedClassStudent = await prisma.student.findFirst({
          where: {
            userProfileId: userProfile.id,
            fixedClassId: fixedClass.id,
          },
        })
        if (!fixedClassStudent) {
          fixedClassStudent = await prisma.student.create({
            data: {
              fixedClassId: fixedClass.id,
              userProfileId: userProfile.id,
              from: new Date(),
            },
          })
        }
        return fixedClassStudent
      })
    )
  })
  return c.json(data, 200)
})

const fixedClassStudentCount = createRoute({
  operationId: "fixed-class-student-count",
  tags: ["FixedClass"],
  path: "/fixed-class-student-count",
  method: "get",
  summary: "Xuất quân số theo khóa",
  description: `Xuất Excel thống kê quân số học viên theo lớp niên chế trong khóa.

**Bảng dữ liệu nguồn:** FixedClass, Student, TrainingCourse, TrainingObjectType.

**Tham số:** trainingObjectTypeId, trainingCourseId (query).`,
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
      trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
    }),
  },
  responses: {
    200: {
      description: "File Excel quân số theo khóa",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(fixedClassStudentCount, async (c) => {
  const { trainingObjectTypeId, trainingCourseId } = c.req.valid("query")

  const trainingObjectType = await prisma.trainingObjectType.findUniqueOrThrow({
    where: { id: trainingObjectTypeId },
    select: { name: true },
  })

  const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
    where: { id: trainingCourseId },
    select: { name: true },
  })

  const classes = await prisma.fixedClass.findMany({
    where: {
      deletedAt: null,
      trainingCourseId,
      OR: [
        {
          curriculumVersion: {
            trainingObjectType: {
              id: trainingObjectTypeId,
            },
          },
        },
        { curriculumVersion: null },
      ],
    },
    select: {
      code: true,
      name: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  })

  const buffer = await getTemplateBuffer(prisma, "THONG_KE_QUAN_SO_HOC_VIEN_THEO_KHOA")
  const template = new XlsxTemplate(buffer)

  template.substitute(1, {
    ĐTĐT: trainingObjectType.name,
    KHOÁ: trainingCourse.name,
    data: classes.map((r, idx) => ({ no: idx + 1, count: r._count.students, ...r })),
    total: classes.reduce((total, r) => total + r._count.students, 0),
  })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = `QS theo khoá_${trainingObjectType.name}_${trainingCourse.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
