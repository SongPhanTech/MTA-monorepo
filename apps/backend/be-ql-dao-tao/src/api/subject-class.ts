import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, Prisma, type ScoreConvert } from "@workspace/db"
import { examTypeOptions } from "@workspace/libs/constants"
import { getMinioUrl, getScoreStatistics } from "@workspace/libs/utils"
import dayjs from "dayjs"
import { read, utils } from "xlsx"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import {
  thongBaoHanNhapDiemQuaTrinhServer,
  thongBaoHanNhapDiemThiServer,
} from "../lib/thong-bao-giang-vien"
import { EnrollFixedClassOnSubjectClass, OpenSubjectClass } from "../dto/subject-class.dto"
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { ListOf } from "../zod/base"
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema, ExcelBinaryResponseSchema } from "../dto/common-response.dto"

const app = new OpenAPIHono({ strict: false })

const openSubjectClass = createRoute({
  operationId: "openSubjectClass",
  path: "/open-subject-class",
  method: "get",
  summary: "Môn dự kiến mở lớp HP",
  description: `Danh sách học phần có thể mở lớp học phần theo học kỳ / khóa.

**Bảng dữ liệu nguồn:** SubjectVersion, TrainingBlockSubject, FixedClass, Student.

**Tham số:** semesterId, trainingCourseId, trainingMajorId, search, trainingObjectTypeId, nextSemester, fixedClassId.`,
  tags: ["Lớp học phần"],
  request: {
    query: z.object({
      semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
      trainingCourseId: z.string().openapi(fieldDesc("ID khóa học.")),
      trainingMajorId: z.string().optional().openapi(fieldDesc("ID ngành (lọc).")),
      search: z.string().optional().openapi(fieldDesc("Từ khóa mã/tên môn.")),
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
      nextSemester: z
        .number({ coerce: true })
        .default(0)
        .openapi(fieldDesc("0 = HK hiện tại; 1 = HK kế tiếp.", 0)),
      fixedClassId: z.string().optional().openapi(fieldDesc("Lọc theo lớp niên chế.")),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(OpenSubjectClass),
        },
      },
      description: "Danh sách phân công giảng dạy thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const enrollFixedClassOnSubjectClass = createRoute({
  operationId: "enrollFixedClassOnSubjectClass",
  path: "/enroll-fixed-class-on-subject-class",
  method: "post",
  summary: "Gán lớp NC vào lớp HP",
  description: `Đăng ký học viên lớp niên chế vào lớp học phần.

**Bảng dữ liệu nguồn:** SubjectClass, Student, FixedClass.

**Tham số:** fixedClassIds, subjectClassId.`,
  tags: ["Lớp học phần"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            fixedClassIds: z.array(z.string()).openapi("fixedClassIds", {
              description: "Danh sách ID lớp quản lý",
            }),
            subjectClassId: z.string().openapi("subjectClassId", {
              description: "ID của lớp môn học",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(EnrollFixedClassOnSubjectClass),
        },
      },
      description: "Đăng ký lớp môn học cho lớp quản lý thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const setScoreDeadLine = createRoute({
  operationId: "setScoreDeadLine",
  path: "/set-score-dead-line",
  method: "post",
  summary: "Đặt hạn nhập điểm",
  description: `Thiết lập hạn nhập điểm quá trình cho lớp học phần.

**Bảng dữ liệu nguồn:** SubjectClass.

**Tham số:** startPadding, endPadding, startDate, endDate, classIds, trainingObjectTypeId, semesterId, overwrite.`,
  tags: ["Lớp học phần"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            startPadding: z.number().min(0).nullish(),
            endPadding: z.number().min(0).nullish(),
            startDate: z.string().nullish(),
            endDate: z.string().nullish(),
            classIds: z.array(z.string()).nullish(),
            trainingObjectTypeId: z.string().optional(),
            semesterId: z.string().nullish(),
            overwrite: z.boolean().default(false),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "Đặt hạn thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const setExamScoreDeadLine = createRoute({
  operationId: "setExamScoreDeadLine",
  path: "/set-exam-score-dead-line",
  method: "post",
  summary: "Đặt hạn nhập điểm thi",
  description: `Thiết lập hạn nhập điểm thi cho lớp học phần.

**Bảng dữ liệu nguồn:** SubjectClass.

**Tham số:** endPadding, endDate, classIds, trainingObjectTypeId, semesterId, overwrite.`,
  tags: ["Lớp học phần"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            endPadding: z.number().min(0).nullish(),
            endDate: z.string().nullish(),
            classIds: z.array(z.string()).nullish(),
            trainingObjectTypeId: z.string().optional(),
            semesterId: z.string().nullish(),
            overwrite: z.boolean().default(false),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "Đặt hạn thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const uploadExcelImportScore = createRoute({
  operationId: "uploadExcelImportScore",
  path: "/upload-excel-import-score",
  method: "post",
  summary: "Import điểm lớp HP",
  description: `Nhập điểm lớp học phần từ Excel.

**Bảng dữ liệu nguồn:** StudentSubjectScore, SubjectClass.

**Tham số:** file, subjectClassId.`,
  tags: ["Lớp học phần"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            subjectClassId: z.string().openapi(fieldDesc("ID lớp học phần.")),
          }).openapi("uploadExcelImportScore"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.number()),
            count: z.number(),
          }),
        },
      },
      description: "Tải danh sách thành công",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "Invalid file upload",
    },
  },
})

const exportSubjectClassScore = createRoute({
  operationId: "export-subject-class-score",
  path: "/export-subject-class-score",
  method: "get",
  tags: ["Lớp học phần"],
  summary: "Xuất điểm lớp HP",
  description: `Xuất Excel bảng điểm lớp học phần hoặc theo kỳ thi.

**Bảng dữ liệu nguồn:** SubjectClass, StudentSubjectScore, Exam.

**Tham số:** id (lớp HP), examId, type (query).`,
  request: {
    query: z.object({
      id: z.string().optional().openapi("id", { description: "ID của lớp môn học" }),
      examId: z.string().optional().openapi("examId", { description: "ID của kỳ thi" }),
      type: z.string().default(""),
    }),
  },
  responses: {
    200: {
      description: "Export thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy lớp môn học.",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

const exportSubjectClassListExcel = createRoute({
  operationId: "exportSubjectClassListExcel",
  path: "/export-subject-class-list-excel",
  method: "get",
  tags: ["Lớp học phần"],
  summary: "Xuất danh sách lớp HP",
  description: `Xuất Excel danh sách lớp học phần.

**Bảng dữ liệu nguồn:** SubjectClass, Semester, FixedClass.

**Tham số:** trainingObjectTypeId, semesterId, fixedClassId, searchText.`,
  request: {
    query: z.object({
      trainingObjectTypeId: z.string().openapi("trainingObjectTypeId", {
        description: "ID loại đối tượng đào tạo",
      }),
      semesterId: z.string().openapi("semesterId", { description: "ID học kỳ" }),
      fixedClassId: z
        .string()
        .optional()
        .openapi("fixedClassId", { description: "ID lớp quản lý" }),
      searchText: z.string().optional().openapi("searchText", { description: "Từ khoá tìm kiếm" }),
    }),
  },
  responses: {
    200: {
      description: "Xuất danh sách lớp môn học thành công",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: ExcelBinaryResponseSchema,
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(openSubjectClass, async (c) => {
  const {
    semesterId,
    search,
    trainingCourseId,
    trainingMajorId,
    trainingObjectTypeId,
    nextSemester,
    fixedClassId,
  } = c.req.valid("query")

  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { schoolYear: true },
  })
  if (!semester) {
    return c.json({ success: false, message: "Học kỳ không tồn tại" }, 400)
  }

  let semesterType =
    semester?.semesterType === $Enums.SemesterType.FIRST
      ? 1
      : semester?.semesterType === $Enums.SemesterType.SECOND
        ? 2
        : 0
  let semesterYear = semester?.schoolYear.startDate.getFullYear()
  if (nextSemester) {
    if (semesterType === 1) {
      semesterType = 2
    } else if (semesterType === 2) {
      semesterType = 1
      semesterYear = semesterYear + 1
    }
  }
  const planTraining = await prisma.planTraining.upsert({
    where: {
      trainingObjectTypeId_semesterId_trainingCourseId: {
        trainingObjectTypeId,
        semesterId,
        trainingCourseId,
      },
    },
    update: {},
    create: {
      trainingObjectTypeId,
      semesterId,
      trainingCourseId,
    },
    select: {
      id: true,
      planTrainingSubjects: {
        select: {
          trainingBlockSubjectId: true,
        },
        where: {
          subjectClassType: $Enums.SubjectClassType.NORMAL,
        },
      },
    },
  })

  const subjectAlreadyInPlan =
    planTraining?.planTrainingSubjects?.map((e) => e.trainingBlockSubjectId) || []

  const res = await prisma.$queryRaw<
    {
      data: OpenSubjectClass
    }[]
  >`
        WITH FCS AS (SELECT sv.id                          as subject_version_id,
                            sv.code                        as subject_version_code,
                            sv.credit                      as subject_version_credit,
                            cv.id                          as curriculum_version_id,
                            cv.name                        as curriculum_version_name,
                            cv.code                        as curriculum_version_code,
                            sv.name                        as subject_version_name,
                            tbs.semester                   as training_block_subject_semester,
                            ((${semesterYear} - DATE_PART('year', schy."startDate")) * 2 +
                             ${semesterType})              as fixed_class_semester,
                            fc."startYear"                 as fixed_class_start_year,
                            fc.id                          as fixed_class_id,
                            fc.name                        as fixed_class_name,
                            fc.code                        as fixed_class_code,
                            fc.active                      as active,
                            fc.graduated                   as graduated,
                            fc."trainingCourseId"          as training_course_id,
                            c."trainingMajorId"            as training_major_id,
                            sub."managementOrganizationId" as management_organization_id,
                            dv."sTen"                      as management_organization_name,
                            dv."sMa"                       as management_organization_code,
                            tc."trainingObjectTypeId"      as training_object_type_id,
                            tbs.id                         as training_block_subject_id,
                            COUNT(fc.id)                   as fixed_class_count
                     FROM "ql-dao-tao"."SubjectVersion" sv
                              JOIN "ql-dao-tao"."TrainingBlockSubject" tbs ON sv.id = tbs."subjectId"
                              JOIN "ql-dao-tao"."TrainingBlockOnCurriculumVersion" tbocv
                                   ON tbs."trainingBlockOnCurriculumVersionId" = tbocv.id
                              JOIN "ql-dao-tao"."CurriculumVersion" cv ON tbocv."curriculumVersionId" = cv.id
                              JOIN "ql-dao-tao"."Curriculum" c ON cv."curriculumId" = c.id
                              JOIN "ql-dao-tao"."FixedClass" fc ON cv.id = fc."curriculumVersionId"
                              JOIN "ql-dao-tao"."Student" s ON fc.id = s."fixedClassId"
                              JOIN "ql-dao-tao"."TrainingCourse" tc ON fc."trainingCourseId" = tc."id"
                              JOIN "ql-dao-tao"."Semester" sem on tc."semesterStartId" = sem.id
                              JOIN "ql-dao-tao"."SchoolYear" schy on sem."schoolYearId" = schy.id
                              JOIN "ql-dao-tao"."Subject" sub on sv."subjectId" = sub.id
                              LEFT JOIN "mta"."DM_DonVi" dv ON sub."managementOrganizationId" = dv."Id"
                     WHERE fc.active = TRUE
                       AND tbs."deletedAt" IS NULL
                       AND tbs."active" = TRUE
                       AND tbocv."deletedAt" IS NULL
                       AND tbocv."active" = TRUE
                       AND cv."deletedAt" IS NULL
                       AND cv."active" = TRUE
                       AND fc."deletedAt" IS NULL
                       AND fc."active" = TRUE
                       AND sv."deletedAt" IS NULL
                       AND sv."active" = TRUE
                       AND tbs.id not in (${subjectAlreadyInPlan.length ? Prisma.join(subjectAlreadyInPlan) : "0"})
                     GROUP BY sv.code,
                              tbs.semester,
                              fc."startYear",
                              fc.id,
                              cv.id,
                              cv.code,
                              cv.name,
                              sv.id,
                              c."trainingMajorId",
                              sub."managementOrganizationId",
                              tc."trainingObjectTypeId",
                              dv."sTen",
                              dv."sMa",
                              schy."startDate",tbs.id)
        SELECT json_build_object(
                       'subjectVersionCode',
                       subject_version_code,
                       'managementOrganizationId',
                       management_organization_id,
                       'managementOrganizationName',
                       management_organization_name,
                       'managementOrganizationCode',
                       management_organization_code,
                       'subjectVersionId',
                       subject_version_id,
                       'subjectVersionName',
                       subject_version_name,
                       'subjectVersionCredit',
                       subject_version_credit,
                       'fixedClass',
                       json_agg(
                               json_build_object(
                                       'trainingBlockSubjectId',
                                        training_block_subject_id,
                                       'fixedClassId',
                                       fixed_class_id,
                                       'fixedClassCode',
                                       fixed_class_code,
                                       'fixedClassName',
                                       fixed_class_name,
                                       'fixedClassCount',
                                       fixed_class_count,
                                       'fixedClassSemester',
                                       fixed_class_semester,
                                       'curriculumVersionId',
                                       curriculum_version_id,
                                       'curriculumVersionName',
                                       curriculum_version_name,
                                       'curriculumVersionCode',
                                       curriculum_version_code,
                                       'trainingCourseId',
                                       training_course_id
                               )
                       )
               ) as data
        FROM FCS
        WHERE training_block_subject_semester = fixed_class_semester
          AND active = TRUE
          AND graduated = FALSE
          AND training_object_type_id = ${trainingObjectTypeId}
          AND (
            (
                ${trainingCourseId ?? null}::TEXT IS NULL
                    OR training_course_id = ${trainingCourseId}
                )
                AND (
                ${trainingMajorId ?? null}::TEXT IS NULL
                    OR training_major_id = ${trainingMajorId}
                )
                AND (
                ${search ?? null}::TEXT IS NULL
                    OR subject_version_name ILIKE ${`%${search}%`}
                    OR subject_version_code ILIKE ${`%${search}%`}
                    OR fixed_class_name ILIKE ${`%${search}%`}
                    OR fixed_class_code ILIKE ${`%${search}%`}
                )
            )
        GROUP BY subject_version_id,
                 subject_version_code,
                 subject_version_credit,
                 subject_version_name,
                 management_organization_id,
                 management_organization_code,
                 management_organization_name
    `
  const data = res
    .map((e) => e.data)
    .map((item) => ({
      ...item,
      fixedClass: item.fixedClass.filter((fc) =>
        fixedClassId ? fc.fixedClassId === fixedClassId : true
      ),
      countStudent: item.fixedClass
        .filter((fc) => (fixedClassId ? fc.fixedClassId === fixedClassId : true))
        .reduce((acc, curr) => acc + curr.fixedClassCount, 0),
    }))

  return c.json(
    {
      data,
      count: data.length,
    },
    200
  )
})

app.openapi(enrollFixedClassOnSubjectClass, async (c) => {
  const { subjectClassId, fixedClassIds } = c.req.valid("json")
  const fixedClasses = await prisma.fixedClass.findMany({
    where: {
      id: {
        in: fixedClassIds,
      },
      active: true,
      graduated: false,
      deletedAt: null,
    },
    include: {
      students: {
        select: {
          id: true,
        },
      },
    },
  })

  const subjectClass = await prisma.subjectClass.findUnique({
    where: { id: subjectClassId, deletedAt: null, active: true },
  })

  if (!subjectClass) {
    return c.json(
      {
        success: false,
        message: "Lớp môn học không tồn tại",
      },
      400
    )
  }

  const res = await prisma.$transaction(async (tx) => {
    await tx.subjectClass.update({
      where: {
        id: subjectClassId,
        deletedAt: null,
        active: true,
      },
      data: {
        fixedClasses: {
          set: fixedClassIds.map((id) => ({ id })),
        },
      },
    })
    await tx.studentSubjectScore.deleteMany({
      where: {
        subjectClassId,
        subjectVersionId: subjectClass.subjectId,
      },
    })
    return await tx.studentSubjectScore.createManyAndReturn({
      data: fixedClasses
        .flatMap((fixedClass) => fixedClass.students)
        .map((student) => ({
          studentId: student.id,
          subjectClassId,
          subjectVersionId: subjectClass.subjectId,
        })),
      skipDuplicates: true,
    })
  })

  return c.json({ data: res, success: true }, 200)
})

app.openapi(setScoreDeadLine, async (c) => {
  const {
    classIds,
    startPadding = 0,
    endPadding = 0,
    startDate,
    endDate,
    trainingObjectTypeId,
    semesterId,
    overwrite,
  } = c.req.valid("json")

  const user = c.get("user")
  const updatedById = user?.id

  // Build WHERE clause dynamically
  const whereClauses: string[] = []
  whereClauses.push(`"trainingObjectTypeId" = '${trainingObjectTypeId}'`)
  if (semesterId) {
    whereClauses.push(`"semesterId" = '${semesterId}'`)
  }
  if (classIds?.length) {
    whereClauses.push(`"id" = ANY(ARRAY[${classIds.map((id) => `'${id}'`).join(",")}])`)
  }
  if (!overwrite) {
    whereClauses.push(`("scoreDeadLineStart" IS NULL OR "scoreDeadline" IS NULL)`)
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const placeholder = new Date().toISOString()

  await prisma.$transaction(async (tx) => {
    if (updatedById) {
      await tx.$executeRawUnsafe(`
                SELECT set_config('app.updated_by_id', '${updatedById}', true);
                `)
    } else {
      await tx.$executeRawUnsafe(`
                SELECT set_config('app.updated_by_id', NULL, true);
                `)
    }

    await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."SubjectClass"
            SET "scoreDeadLineStart" = CASE
                                           WHEN "examDate" IS NOT NULL AND ${startPadding ? "TRUE" : "FALSE"}
                                               THEN "examDate" - (${startPadding} * INTERVAL '1 day')
                                           WHEN ${startDate ? "TRUE" : "FALSE"} THEN DATE '${startDate || placeholder}'
                                           ELSE NULL
                END,
                "scoreDeadline"      = CASE
                                           WHEN "examDate" IS NOT NULL AND ${endPadding ? "TRUE" : "FALSE"}
                                               THEN "examDate" - (${endPadding} * INTERVAL '1 day')
                                           WHEN ${endDate ? "TRUE" : "FALSE"} THEN DATE '${endDate || placeholder}'
                                           ELSE NULL
                    END
                ${whereSQL};
        `)
  })

  const lopDaCapNhat = await prisma.subjectClass.findMany({
    where: {
      trainingObjectTypeId,
      ...(semesterId ? { semesterId } : {}),
      ...(classIds?.length ? { id: { in: classIds } } : {}),
      scoreDeadline: { not: null },
    },
    select: { id: true },
  })
  await thongBaoHanNhapDiemQuaTrinhServer(
    prisma,
    lopDaCapNhat.map((item) => item.id)
  )

  return c.json({ message: "Success" })
})

app.openapi(setExamScoreDeadLine, async (c) => {
  const {
    classIds,
    endPadding = 0,
    endDate,
    trainingObjectTypeId,
    semesterId,
    overwrite,
  } = c.req.valid("json")

  const whereClauses: string[] = []
  whereClauses.push(`"trainingObjectTypeId" = '${trainingObjectTypeId}'`)
  if (semesterId) {
    whereClauses.push(`"semesterId" = '${semesterId}'`)
  }
  if (classIds?.length) {
    whereClauses.push(`"id" = ANY(ARRAY[${classIds.map((id) => `'${id}'`).join(",")}])`)
  }
  if (!overwrite) {
    whereClauses.push(`("examScoreDeadline" IS NULL)`)
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const placeholder = new Date().toISOString()

  await prisma.$executeRawUnsafe(`
        UPDATE "ql-dao-tao"."SubjectClass"
        SET "examScoreDeadline" = CASE
                                      WHEN "examDate" IS NOT NULL AND ${endPadding ? "TRUE" : "FALSE"}
                                          THEN "examDate" + (${endPadding} * INTERVAL '1 day')
                                      WHEN ${endDate ? "TRUE" : "FALSE"} THEN DATE '${endDate || placeholder}'
                                      ELSE NULL
            END
            ${whereSQL};
    `)

  const lopDaCapNhat = await prisma.subjectClass.findMany({
    where: {
      trainingObjectTypeId,
      ...(semesterId ? { semesterId } : {}),
      ...(classIds?.length ? { id: { in: classIds } } : {}),
      examScoreDeadline: { not: null },
    },
    select: { id: true },
  })
  await thongBaoHanNhapDiemThiServer(prisma, lopDaCapNhat.map((item) => item.id))

  return c.json({ message: "Success" })
})

app.openapi(uploadExcelImportScore, async (c) => {
  const { file, subjectClassId } = c.req.valid("form")

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

  const subjectClass = await prisma.subjectClass.findFirst({
    where: { id: subjectClassId },
  })

  if (!subjectClass?.code) {
    return c.json({ message: "Không tìm thấy khoá học" }, 400)
  }
  if (subjectClass?.code !== cellValue) {
    return c.json({ message: "Mã lớp không trùng khớp" }, 400)
  }

  const scoreUpdates = rowData
    .slice(11)
    .map((row) => ({
      studentCode: row[1],
      scoreCC: Number(row[5]),
      scoreTX: Number(row[6]),
      scoreThi: Number(row[7]),
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

  // Update the student scores (assuming the score field exists in studentSubjectScore)
  const updateResults = []
  for (const { studentCode, scoreCC, scoreTX, scoreThi } of scoreUpdates) {
    const student = students.find((s) => s.code === studentCode)
    if (student) {
      const res = await prisma.studentSubjectScore.updateMany({
        where: {
          studentId: student.id,
          subjectClassId,
          active: true,
        },
        data: {
          attendanceScore: scoreCC,
          midtermScore: scoreTX,
          examScore: scoreThi,
        },
      })
      updateResults.push(res.count)
    }
  }
  const totalUpdated = updateResults.reduce((sum, count) => sum + count, 0)
  console.log(`Total records updated: ${totalUpdated}`)

  return c.json({ data: updateResults, count: totalUpdated }, 200)
})

app.openapi(exportSubjectClassListExcel, async (c) => {
  const { trainingObjectTypeId, semesterId, fixedClassId, searchText } = c.req.valid("query")

  try {
    const subjectClasses = await prisma.subjectClass.findMany({
      where: {
        trainingObjectTypeId,
        semesterId,
        ...(searchText
          ? {
              OR: [
                {
                  name: {
                    contains: searchText,
                    mode: "insensitive",
                  },
                },
                {
                  code: {
                    contains: searchText,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(fixedClassId
          ? {
              fixedClasses: {
                some: {
                  id: fixedClassId,
                },
              },
            }
          : {}),
        deletedAt: null,
        cancelled: false,
        active: true,
        status: "OFFICIAL",
      },
      include: {
        subject: {
          include: {
            managementOrganization: true,
          },
        },
        exam: {
          select: {
            id: true,
            lockExamSessions: true,
            examRooms: {
              select: {
                id: true,
                room: {
                  select: {
                    name: true,
                  },
                },
                examList: {
                  select: {
                    id: true,
                    lockExamCode: true,
                  },
                },
              },
            },
          },
        },
        mainLecturer: {
          include: {
            userProfile: true,
          },
        },
        extraLecturer: {
          include: {
            userProfile: true,
          },
        },
        enterGradeLecturer: {
          include: {
            userProfile: true,
          },
        },
        fixedClasses: {
          select: {
            code: true,
          },
        },
        _count: {
          select: {
            subjectClassStudent: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    })

    if (!subjectClasses.length) {
      throw new Error("Không có dữ liệu lớp môn học để xuất")
    }

    const templateFileName = "DS_LOP_MON_HOC.xlsx"
    const res = await fetch(getMinioUrl(`/mta/template/${templateFileName}`))
    if (!res.ok) {
      throw new Error("Không lấy được file mẫu xuất Excel")
    }

    const templateBuffer = await res.arrayBuffer()
    const template = new XlsxTemplate(Buffer.from(templateBuffer))

    const data = subjectClasses.map((item, idx) => ({
      no: idx + 1,
      code: item.code || "",
      name: item.subject?.name || "",
      examType: examTypeOptions.find((et) => et.value === item.examType)?.label || "", // hình thức thi
      status: item.enteredExamScore
        ? "Đã nhập điểm thi"
        : item.enteredScore
          ? "Đã nhập điểm TX,ĐK"
          : "Chưa nhập điểm", // trạng thái nhập điểm
      onePoint: item.subject?.onePoint ? "1" : "", // môn 1 đầu điểm
      deadLineStart: item.scoreDeadLineStart
        ? dayjs(item.scoreDeadLineStart).format("DD/MM/YYYY")
        : "", // ngày NĐQT
      deadLine: item.scoreDeadline ? dayjs(item.scoreDeadline).format("DD/MM/YYYY") : "", // hạn NĐQT
      examDate: item.examDate ? dayjs(item.examDate).format("DD/MM/YYYY") : "",
      examScoreDeadline: item.examScoreDeadline
        ? dayjs(item.examScoreDeadline).format("DD/MM/YYYY")
        : "", // hạn nhập điểm thi
      mainLecturer: item.mainLecturer?.userProfile?.fullname || "",
      secondLecturer: item.extraLecturer?.userProfile?.fullname || "",
      enterGradeLecturer: item.enterGradeLecturer?.userProfile?.fullname || "",
      managementOrganization: item.subject?.managementOrganization?.sMa || "", // đơn vị quản lý
      isLockScore: item.isLockScore ? "1" : "", // khoá ĐQT
      lockExamSessions: item.exam?.lockExamSessions ? "1" : "", // khoá DS thi
      lockExamCode: item.exam?.examRooms?.[0]?.examList?.[0]?.lockExamCode ? "1" : "", // khoá phách
      isLockExamScore: item.isLockExamScore ? "1" : "", // p13 đã khoá
      scoreSubmitted: item.scoreSubmitted ? "1" : "", // p13 đã nhận phiếu điểm
      scoreChecked: item.scoreChecked ? "1" : "", // p2/p7 đã kiểm tra
    }))

    template.substitute(1, { data })

    const result = await template.generate({ type: "arraybuffer" })
    const fileName = "Danh_sach_lop_mon_hoc.xlsx"
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

    return c.body(result, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  } catch (error: any) {
    return c.json({ message: error?.message || "Đã xảy ra lỗi khi xuất Excel" }, 404)
  }
})

app.openapi(exportSubjectClassScore, async (c) => {
  const { id, type, examId } = c.req.valid("query")

  let subjectClass = await prisma.subjectClass.findUnique({
    where: { id: id ?? "" },
    include: {
      subject: {
        include: {
          managementOrganization: true,
        },
      },
      semester: {
        include: {
          schoolYear: true,
        },
      },
      mainLecturer: {
        include: {
          userProfile: true,
        },
      },
      extraLecturer: {
        include: {
          userProfile: true,
        },
      },
      trainingObjectType: true,
      subjectClassStudent: {
        include: {
          student: {
            include: {
              fixedClass: {
                include: {
                  trainingCourse: {
                    include: {
                      scoreConverts: true,
                    },
                  },
                },
              },
              userProfile: true,
            },
          },
          examPaper: {
            select: {
              examCode: true,
            },
          },
        },
        orderBy: [
          {
            student: {
              userProfile: {
                firstName: "asc",
              },
            },
          },
          {
            student: {
              userProfile: {
                lastName: "asc",
              },
            },
          },
        ],
      },
    },
  })

  if (examId) {
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        subjectClass: {
          include: {
            subject: {
              include: {
                managementOrganization: true,
              },
            },
            semester: {
              include: {
                schoolYear: true,
              },
            },
            mainLecturer: {
              include: {
                userProfile: true,
              },
            },
            extraLecturer: {
              include: {
                userProfile: true,
              },
            },
            trainingObjectType: true,
            subjectClassStudent: {
              include: {
                student: {
                  include: {
                    fixedClass: {
                      include: {
                        trainingCourse: {
                          include: {
                            scoreConverts: true,
                          },
                        },
                      },
                    },
                    userProfile: true,
                  },
                },
                examPaper: {
                  select: {
                    examCode: true,
                  },
                },
              },
              orderBy: [
                {
                  student: {
                    userProfile: {
                      firstName: "asc",
                    },
                  },
                },
                {
                  student: {
                    userProfile: {
                      lastName: "asc",
                    },
                  },
                },
              ],
            },
          },
        },
      },
    })
    if (exam) {
      if (exam?.subjectClass?.[0]) subjectClass = exam?.subjectClass?.[0]
      if (subjectClass) {
        subjectClass = {
          ...subjectClass,
          subjectClassStudent: exam?.subjectClass.flatMap((sc) => sc.subjectClassStudent),
        }
      }
    }
  }

  if (!subjectClass) {
    return c.json({ message: "Không tìm thấy lớp học" }, 404)
  }
  const res = await fetch(getMinioUrl(`/mta/template/PHIEU-DIEM${type ? `-${type}` : ""}.xlsx`))
  const buffer = await res.arrayBuffer()
  const nodeBuffer = Buffer.from(buffer)
  const template = new XlsxTemplate(nodeBuffer)

  const scoreConvert = (finalScore: number, scoreRanges: ScoreConvert[] = []) => {
    const sortedRanges = [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)

    const matched = sortedRanges.find(
      (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
    )

    if (!matched) {
      return {
        base4: null,
        letter: "-",
        classification: "Không xác định",
        pass: false,
        improvementRegister: false,
      }
    }

    return {
      base4: matched.base4,
      letter: matched.letter,
      classification: matched.classification,
      pass: matched.pass,
      improvementRegister: matched.improvementRegister,
    }
  }
  const statistics = getScoreStatistics(subjectClass.subjectClassStudent || [])
  const data = {
    HOC_KY: subjectClass.semester?.name || "",
    MA_LMH: subjectClass.code,
    DOI_TUONG_DAO_TAO: subjectClass.trainingObjectType?.name || "",
    KHOA_HOC: [
      ...new Set(
        subjectClass.subjectClassStudent
          ?.map((scs) => scs.student?.fixedClass?.trainingCourse?.name)
          .filter(Boolean)
      ),
    ].join(", "),
    NGAY_THI: subjectClass.examDate ? dayjs(subjectClass.examDate).format("DD/MM/YYYY") : "",
    QUAN_SO: subjectClass.subjectClassStudent.length,
    // VANG: subjectClass.subjectClassStudent.filter(
    //     (scs) => scs.attendanceScore === null || scs.attendanceScore === undefined
    // ).length,
    VANG: "",
    TEN_MON_HOC: subjectClass.subject?.name || "",
    STC: subjectClass.subject?.credit || "",
    GIANG_VIEN: subjectClass.mainLecturer
      ? subjectClass.mainLecturer.userProfile?.fullname
      : `${
          subjectClass.extraLecturer
            ? `, ${subjectClass.extraLecturer.userProfile?.fullname || ""}`
            : ""
        }`,
    KHOA: subjectClass.subject?.managementOrganization?.sCode || "",
    HINH_THUC_THI: examTypeOptions.find((et) => et.value === subjectClass.examType)?.label || "",
    d: dayjs().date(),
    m: dayjs().month() + 1,
    y: dayjs().year(),
    NGUOI_IN: c.get("user")?.fullName || "",
    THOI_GIAN_IN: dayjs().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY"),
    data: subjectClass.subjectClassStudent.map((scs, index) => {
      const statusTexts = []
      if (scs.examPostponed) statusTexts.push("Hoãn thi")
      if (scs.exempted) statusTexts.push("Miễn học")
      if (scs.withdrew) statusTexts.push("Rút khỏi")
      if (scs.examBanned) statusTexts.push("Cấm thi")
      if (scs.suspended) statusTexts.push("Đình chỉ")

      const scoreConverted = scs?.finalScore
        ? scoreConvert(
            scs?.finalScore?.toNumber(),
            scs.student.fixedClass?.trainingCourse?.scoreConverts || []
          )
        : null
      return {
        TT: index + 1,
        MA_SV: scs.student.code,
        HO_TEN: scs.student.userProfile?.fullname || "",
        NGAY_SINH: scs.student.userProfile?.dateOfBirth
          ? dayjs(scs.student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        LOP: scs.student.fixedClass?.code || "",
        CC:
          scs.attendanceScore !== null && scs.attendanceScore !== undefined
            ? scs.attendanceScore
            : "",
        TX: scs.midtermScore !== null && scs.midtermScore !== undefined ? scs.midtermScore : "",
        DT: scs.examScore !== null && scs.examScore !== undefined ? scs.examScore : "",
        SO:
          scs.finalScore !== null && scs.finalScore !== undefined
            ? scs.finalScore?.toNumber()?.toString?.().replace(",", ".")
            : "",
        TC: scoreConverted?.base4 ?? "",
        BANG_CHU: scoreConverted?.letter ?? "",
        PHACH: scs.examPaper?.examCode ?? "",
        GHI_CHU: statusTexts.length > 0 ? statusTexts.join(", ") : "",
      }
    }),
    TONG_HOP: Object.entries(statistics)
      .map(([type, { count, percentage }]) => `${type}: ${count}= ${percentage.toFixed(0)}%`)
      .join(" "),
  }

  template.substitute(1, data)
  const result = await template.generate({ type: "arraybuffer" })
  const fileName = `Phieu_diem_${subjectClass.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
