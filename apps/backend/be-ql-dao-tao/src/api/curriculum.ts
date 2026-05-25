import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, createId, type Prisma } from "@workspace/db"
import { parseCurriculumSheet, zParseSheetError } from "@workspace/libs/parseExcel"
import { getMinioUrl } from "@workspace/libs/utils"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { buildSubjectMapOrThrow, buildTrainingBlockMapOrThrow } from "../utils"
import { _generateCurriculumImportTemplate } from "../services/curriculum"
import {
  ErrorDetailResponseSchema,
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  SheetParseErrorResponseSchema,
  SuccessMessageResponseSchema,
} from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

const importCurriculumVersion = createRoute({
  operationId: "import-phien-ban-CTDT",
  tags: ["Chương trình đào tạo"],
  path: "/import-phien-ban-ctdt/{curriculumVersionId}",
  method: "post",
  summary: "Import phiên bản CTĐT",
  description: `Import toàn bộ khối và môn vào phiên bản CTĐT (thay thế cấu trúc cũ).

**Bảng dữ liệu nguồn:** CurriculumVersion, TrainingBlockOnCurriculumVersion, TrainingBlockSubject.

**Tham số:** curriculumVersionId (path), file, timeout.`,
  request: {
    params: z.object({
      curriculumVersionId: z.string().openapi(fieldDesc("ID phiên bản CTĐT.")),
    }),
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            timeout: z.coerce.number().default(30).openapi(fieldDesc("Timeout (giây).", 30)),
          }).openapi("ImportPhienBanCTDT"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Import He quan su successfully",
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: SheetParseErrorResponseSchema(zParseSheetError).openapi(
            "CurriculumImportErrorResponse"
          ),
        },
      },
    },
  },
})

app.openapi(importCurriculumVersion, async (c) => {
  const { curriculumVersionId } = c.req.valid("param")

  const { trainingObjectTypeId, curriculum } = await prisma.curriculumVersion.findUniqueOrThrow({
    where: { id: curriculumVersionId },
    select: {
      trainingObjectTypeId: true,
      curriculum: {
        select: { trainingMajor: { select: { name: true } } },
      },
    },
  })

  const { file, timeout } = c.req.valid("form")

  const buf = await file.arrayBuffer()
  const data = parseCurriculumSheet(buf)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  if (data.trainingMajor !== curriculum.trainingMajor.name) {
    return c.json(
      {
        message: `Chuyên ngành đào tạo không khớp: ${data.trainingMajor} vs ${curriculum.trainingMajor.name}`,
      },
      400
    )
  }

  const trainingMajor = await prisma.trainingMajor.findFirst({
    where: { name: data.trainingMajor, active: true },
  })

  if (!trainingMajor) {
    return c.json({ message: `Đối tượng đào tạo không tồn tại: ${data.trainingMajor}` }, 400)
  }

  const trainingBlockMap = await buildTrainingBlockMapOrThrow(
    prisma,
    trainingObjectTypeId,
    data.trainingBlocks.map(({ name }) => name)
  )

  const subjectMap = await buildSubjectMapOrThrow(
    prisma,
    data.trainingBlocks.flatMap(({ subjects }) =>
      subjects.map((s) => ({
        trainingObjectTypeId,
        ...s,
        schedulePeriod: s.period,
        type: s.subjectVersionType,
        code: "",
      }))
    )
  )

  const trainingBlocksWithId = data.trainingBlocks.map((trainingBlock) => ({
    id: createId(),
    ...trainingBlock,
  }))

  const trainingBlockOnCurriculumVersion: Prisma.TrainingBlockOnCurriculumVersionCreateManyInput[] =
    trainingBlocksWithId.map(({ id, name, priority }) => ({
      id,
      curriculumVersionId,
      trainingBlockId: trainingBlockMap.get(name) as string,
      priority,
    }))

  const trainingBlockSubjects: Prisma.TrainingBlockSubjectCreateManyInput[] =
    trainingBlocksWithId.flatMap(({ id, subjects }) =>
      subjects.map(({ name, credit, period, organizationCode, ...subjectType }) => ({
        id: createId(),
        trainingBlockOnCurriculumVersionId: id,
        subjectId: subjectMap.get(name) as string,
        ...subjectType,
      }))
    )

  await prisma.$transaction(
    async (tx) => {
      await tx.trainingBlockOnCurriculumVersion.deleteMany({
        where: { curriculumVersionId },
      })
      await tx.trainingBlockOnCurriculumVersion.createMany({
        data: trainingBlockOnCurriculumVersion,
      })

      await tx.trainingBlockSubject.createMany({
        data: trainingBlockSubjects,
      })
    },
    { timeout: timeout * 1000 }
  )

  return c.json(
    {
      message: `Import training blocks successfully: ${data.trainingBlocks.length}`,
    },
    200
  )
})

const exportCurriculumVersion = createRoute({
  operationId: "export-phien-ban-CTDT",
  tags: ["Chương trình đào tạo"],
  path: "/export-phien-ban-ctdt/{id}",
  method: "get",
  summary: "Xuất phiên bản CTĐT",
  description: `Xuất Excel cấu trúc môn học của phiên bản CTĐT.

**Bảng dữ liệu nguồn:** CurriculumVersion, TrainingBlockOnCurriculumVersion, TrainingBlockSubject, SubjectVersion.

**Tham số:** id (path) — ID phiên bản CTĐT.`,
  request: {
    params: z.object({ id: z.string().openapi(fieldDesc("ID CurriculumVersion.")) }),
  },
  responses: {
    200: {
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
      description: "File Excel CTĐT",
    },
  },
})

app.openapi(exportCurriculumVersion, async (c) => {
  const curriculumVersionId = c.req.param("id")

  const data = await prisma.curriculumVersion.findUnique({
    where: { id: curriculumVersionId },
    include: {
      curriculum: {
        include: {
          managementOrganization: true,
          trainingMajor: true,
        },
      },
      trainingBlocks: {
        include: {
          trainingBlock: true,
          subjects: {
            include: {
              subject: {
                include: {
                  managementOrganization: true,
                },
              },
            },
          },
        },
        orderBy: {
          priority: "asc",
        },
      },
    },
  })

  if (!data) {
    throw new Error("Không tìm thấy phiên bản CTĐT")
  }

  const url = getMinioUrl("/mta/template/MAU-XUAT_CTDT.xlsx")
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Không tìm thấy mẫu xuất: ${res.status} ${res.statusText}`)
  }
  const buffer = await res.arrayBuffer()
  const nodeBuffer = Buffer.from(buffer)
  const template = new XlsxTemplate(nodeBuffer)

  let index = 1
  const subjects = data.trainingBlocks.flatMap((block) => {
    return block.subjects.map((s) => {
      const subj = s.subject
      let typeLabel = ""
      switch (subj.type) {
        case $Enums.SubjectVersionType.Normal:
          typeLabel = "Thường"
          break
        case $Enums.SubjectVersionType.Practice:
          typeLabel = "Thực hành"
          break
        case $Enums.SubjectVersionType.Internship:
          typeLabel = "Thực tập"
          break
        case $Enums.SubjectVersionType.Research:
          typeLabel = "Chuyên đề nghiên cứu"
          break
        case $Enums.SubjectVersionType.Project:
          typeLabel = "Đồ án"
          break
        case $Enums.SubjectVersionType.Thesis:
          typeLabel = "Luận văn-Đề án"
          break
        case $Enums.SubjectVersionType.Graduation:
          typeLabel = "Thi tốt nghiệp"
          break
      }

      let examTypeLabel = ""
      switch (subj.examType) {
        case $Enums.ExamType.OfflineWritten:
          examTypeLabel = "Thi viết"
          break
        case $Enums.ExamType.OnlineWritten:
          examTypeLabel = "Trực tuyến"
          break
        case $Enums.ExamType.Oral:
          examTypeLabel = "Vấn đáp"
          break
        case $Enums.ExamType.Practice:
          examTypeLabel = "Thực hành - Thí nghiệm"
          break
        case $Enums.ExamType.Project:
          examTypeLabel = "Đồ án"
          break
        case $Enums.ExamType.Other:
          examTypeLabel = "Khác"
          break
      }

      return {
        index: index++,
        blockName: block.trainingBlock.name.toUpperCase(),
        name: subj.name,
        isMandatory: s.type === $Enums.SubjectRequirementType.Mandatory ? "Bắt buộc" : "Tự chọn",
        isCondition: !s.useForFinalScore ? "1" : "",
        type: typeLabel,
        code: subj.code,
        organization: subj.managementOrganization?.sMa || "",
        credit: subj.credit,
        structure: subj.period,
        totalPeriod: subj.period,
        schedulePeriod: subj.schedulePeriod,
        theory: subj.numberOfTheory || 0,
        tutorial: subj.numberOfPractical || 0, // TL, BT
        selfStudy: subj.numberOfSelfStudy || 0, // ThL
        practice: subj.numberOfPractice || 0, // TN, TH
        review: subj.numberOfReview || 0,
        exam: subj.numberOfExam || 0,
        semester: s.semester,
        examType: examTypeLabel,
        isFinalScore: s.useForFinalScore ? "Có" : "Không",
      }
    })
  })

  template.substitute(1, {
    curriculumName: data.name,
    code: data.code,
    trainingMajor: data.curriculum.trainingMajor.name,
    managementOrganization: data.curriculum.managementOrganization.sTen,
    subjects,
  })

  const result = (await template.generate({ type: "arraybuffer" })) as ArrayBuffer

  const fileName = `CTDT-${data.curriculum.trainingMajor.name}-${data.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

const downloadCurriculumImportTemplate = createRoute({
  operationId: "downloadCurriculumImportTemplate",
  tags: ["Chương trình đào tạo"],
  path: "/download-curriculum-template",
  method: "get",
  summary: "Tải mẫu import CTĐT",
  description: `Tải file Excel mẫu import chương trình đào tạo.

**Bảng dữ liệu nguồn:** TrainingBlock, SubjectVersion (sheet mẫu).

**Tham số:** trainingObjectTypeId (query).`,
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
    }),
  },
  responses: {
    200: {
      description: "File mẫu Excel CTĐT",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorDetailResponseSchema,
        },
      },
    },
  },
})

app.openapi(downloadCurriculumImportTemplate, async (c) => {
  const { trainingObjectTypeId } = c.req.valid("query")
  const result = await _generateCurriculumImportTemplate(trainingObjectTypeId)
  const fileName = "MauNhapCTDT.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
