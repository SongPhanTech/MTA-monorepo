import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import { read, utils } from "xlsx"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import {
  DocxBinaryResponseSchema,
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
} from "../dto/common-response.dto"
import { ClassDivisionResultSchema } from "../dto/student-result-openapi.dto"
import { excelSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { renderXlsxTemplate } from "../services/render-xlsx-template"
import { CtdtExportMau, exportChuongTrinhDaoTao } from "../services/export-chuong-trinh-dao-tao"

const app = new OpenAPIHono({ strict: false })

const classDivision = createRoute({
  operationId: "classDivision",
  path: "/upload-excel-update-user-profile",
  method: "post",
  summary: "Phân lớp học viên từ Excel",
  description: `Import Excel gán học viên vào lớp niên chế (quản lý).

**Bảng dữ liệu nguồn:** FixedClass, UserProfile, Student.

**Tham số:** file — file Excel danh sách (cột mã HV, mã lớp).`,
  tags: ["Lớp niên chế"],
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: ClassDivisionResultSchema,
        },
      },
      description: "Phân lớp thành công — mỗi phần tử là học viên hoặc thông báo lỗi dòng",
    },
    400: {
      description: "File không hợp lệ hoặc vượt quá 50MB",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
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
        return {
          id: fixedClassStudent.id,
          fixedClassId: fixedClassStudent.fixedClassId || fixedClass.id,
          userProfileId: fixedClassStudent.userProfileId || userProfile.id,
          from: fixedClassStudent.from?.toISOString(),
        }
      })
    )
  })
  return c.json(data, 200)
})

const fixedClassStudentCount = createRoute({
  operationId: "fixed-class-student-count",
  tags: ["Lớp niên chế"],
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
    ...excelSuccess("File Excel quân số theo khóa"),
    ...standardErrorResponses(),
    400: {
      description: "Tham số không hợp lệ",
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

  const totalCount = classes.reduce((total, r) => total + r._count.students, 0)

  const result = await renderXlsxTemplate(prisma, {
    templatePath: "/mta/template/quan_so_hoc_vien_theo_khoa.xlsx",
    sheets: [
      {
        sheet: 1,
        data: {
          ĐTĐT: trainingObjectType.name,
          KHOÁ: trainingCourse.name,
          data: classes.map((r, idx) => ({
            no: idx + 1,
            count: String(r._count.students),
            siso: String(r._count.students),
            students: String(r._count.students),
            note: "",
            ghichu: "",
            ...r,
          })),
          total: String(totalCount),
          tong: String(totalCount),
        },
      },
    ],
    mergeBlocksToOneSheet: true,
  })

  const fileName = `QS theo khoá_${trainingObjectType.name}_${trainingCourse.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(new Uint8Array(result), 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const exportChuongTrinhDaoTaoRoute = createRoute({
  operationId: "exportChuongTrinhDaoTao",
  tags: ["Lớp niên chế"],
  path: "/export-chuong-trinh-dao-tao",
  method: "post",
  summary: "Xuất CTTK / KHTK lớp quản lý",
  description: `Xuất file Word chương trình / kế hoạch toàn khóa theo mẫu CTTK hoặc KHTK.

**Bảng dữ liệu nguồn:** FixedClass, CurriculumVersion, TrainingBlockSubject.

**Tham số:** fixedClassId, mau — cttk-dai-han | cttk-ngan-han | khtk-nghien-cuu | khtk-ung-dung.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              fixedClassId: z.string().openapi(fieldDesc("ID lớp quản lý (FixedClass).")),
              mau: z
                .enum([
                  CtdtExportMau.CTTK_DAI_HAN,
                  CtdtExportMau.CTTK_NGAN_HAN,
                  CtdtExportMau.KHTK_NGHIEN_CUU,
                  CtdtExportMau.KHTK_UNG_DUNG,
                ])
                .openapi(fieldDesc("Loại mẫu xuất.")),
            })
            .openapi("ExportChuongTrinhDaoTaoRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "File Word CTTK / KHTK",
      content: {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
          schema: DocxBinaryResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportChuongTrinhDaoTaoRoute, async (c) => {
  const { fixedClassId, mau } = c.req.valid("json")
  const { buffer, fileName } = await exportChuongTrinhDaoTao({ fixedClassId, mau })
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(buffer, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": disposition,
  })
})

export default app
