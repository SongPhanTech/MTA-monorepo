import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, Prisma, type ScoreConvert } from "@workspace/db"
import { examTypeOptions } from "@workspace/libs/constants"
import { formatDateTimeIn, formatDateVn, formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import { fetchMinio, getScoreStatistics, convertScoreWithCourseConfig, courseScoreConfigFrom } from "@workspace/libs/utils"
import { read, utils } from "xlsx"
import XlsxTemplate from "xlsx-template"
import ExcelJS from "exceljs"
import { prisma } from ".."
import {
  thongBaoHanNhapDiemQuaTrinhServer,
  thongBaoHanNhapDiemThiServer,
} from "../lib/thong-bao-giang-vien"
import { EnrollFixedClassOnSubjectClass, OpenSubjectClass } from "../dto/subject-class.dto"
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { DataSuccessResponseSchema, PaginatedDataResponseSchema } from "../zod/base"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import {
  ErrorMessageResponseSchema,
  ExcelBinaryResponseSchema,
  FailureBooleanResponseSchema,
  SuccessMessageResponseSchema,
} from "../dto/common-response.dto"
import { deleteSubjectClassCascade } from "../services/delete-subject-class"

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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: PaginatedDataResponseSchema(OpenSubjectClass),
        },
      },
      description: "Danh sách phân công giảng dạy thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
      content: {
        "application/json": {
          schema: FailureBooleanResponseSchema,
        },
      },
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: DataSuccessResponseSchema(EnrollFixedClassOnSubjectClass),
        },
      },
      description: "Đăng ký lớp môn học cho lớp quản lý thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
      content: {
        "application/json": {
          schema: FailureBooleanResponseSchema,
        },
      },
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
      description: "Đặt hạn thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: SuccessMessageResponseSchema,
        },
      },
      description: "Đặt hạn thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
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

**Tham số:** id (lớp HP), examId, type, role, userId (query).`,
  request: {
    query: z.object({
      id: z.string().optional().openapi("id", { description: "ID của lớp môn học" }),
      examId: z.string().optional().openapi("examId", { description: "ID của kỳ thi" }),
      type: z.string().default(""),
      role: z.string().optional(),
      userId: z
        .string()
        .uuid()
        .optional()
        .openapi("userId", { description: "ID UserProfile người in (từ client)" }),
    }),
  },
  responses: {
    ...standardErrorResponses(),
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
    ...standardErrorResponses(),
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
                            (
                                SELECT COUNT(sss.id)
                                FROM "ql-dao-tao"."StudentSubjectScore" sss
                                JOIN "ql-dao-tao"."SubjectClass" sc ON sss."subjectClassId" = sc.id
                                JOIN "ql-dao-tao"."Student" st ON st.id = sss."studentId"
                                WHERE sc."subjectId" = sv.id 
                                  AND sc."semesterId" = ${semesterId}
                                  AND st."fixedClassId" = fc.id
                                  AND sc."deletedAt" IS NULL
                                  AND sc.active = TRUE
                                  AND sss."deletedAt" IS NULL
                                  AND sss.active = TRUE
                                  AND st.active = TRUE
                                  AND st."deletedAt" IS NULL
                            )::INTEGER                     as fixed_class_count
                     FROM "ql-dao-tao"."SubjectVersion" sv
                              JOIN "ql-dao-tao"."TrainingBlockSubject" tbs ON sv.id = tbs."subjectId"
                              JOIN "ql-dao-tao"."TrainingBlockOnCurriculumVersion" tbocv
                                   ON tbs."trainingBlockOnCurriculumVersionId" = tbocv.id
                              JOIN "ql-dao-tao"."CurriculumVersion" cv ON tbocv."curriculumVersionId" = cv.id
                              JOIN "ql-dao-tao"."Curriculum" c ON cv."curriculumId" = c.id
                              JOIN "ql-dao-tao"."FixedClass" fc ON cv.id = fc."curriculumVersionId"
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
  await thongBaoHanNhapDiemThiServer(
    prisma,
    lopDaCapNhat.map((item) => item.id)
  )

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
      userProfile: { code: { in: studentCodes } },
    },
    select: {
      id: true,
      userProfile: { select: { code: true } },
    },
  })

  // Update the student scores (assuming the score field exists in studentSubjectScore)
  const updateResults = []
  for (const { studentCode, scoreCC, scoreTX, scoreThi } of scoreUpdates) {
    const student = students.find((s) => s.userProfile.code === studentCode)
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
    const res = await fetchMinio(`/mta/template/${templateFileName}`)
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
      deadLineStart: item.scoreDeadLineStart ? formatDateVn(item.scoreDeadLineStart) : "", // ngày NĐQT
      deadLine: item.scoreDeadline ? formatDateVn(item.scoreDeadline) : "", // hạn NĐQT
      examDate: item.examDate ? formatDateVn(item.examDate) : "",
      examScoreDeadline: item.examScoreDeadline ? formatDateVn(item.examScoreDeadline) : "", // hạn nhập điểm thi
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
  const { id, type, examId, role, userId } = c.req.valid("query")

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
        where: {
          deletedAt: null,
          student: { deletedAt: null },
          // Phiếu DS thi trên màn nhập điểm (cổng đào tạo và cổng giảng viên) không truyền
          // examId: in toàn bộ sinh viên của lớp. "Lên danh sách thi" chỉ tạo ExamList,
          // ExamPaper chỉ có sau "Lấy điểm SV" — lọc bài thi khi không có examId sẽ ra bảng trống.
          // Chỉ lọc theo bài thi khi caller truyền đúng kỳ thi.
          ...(type === "DANH-SACH-THI" && examId
            ? {
                examPaper: {
                  is: {
                    deletedAt: null,
                    examList: {
                      is: {
                        deletedAt: null,
                        examRoom: {
                          is: {
                            deletedAt: null,
                            examId,
                            exam: {
                              deletedAt: null,
                              subjectClass: { some: { id: id ?? "" } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              }
            : {}),
        },
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

  if (examId && type !== "DANH-SACH-THI") {
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
              where: {
                deletedAt: null,
                student: { deletedAt: null },
              },
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

  const res = await fetchMinio(`/mta/template/PHIEU-DIEM${type ? `-${type}` : ""}.xlsx`)
  const buffer = await res.arrayBuffer()
  const nodeBuffer = Buffer.from(buffer)
  const template = new XlsxTemplate(nodeBuffer)

  const scoreConvert = (
    finalScore: number,
    scoreRanges: ScoreConvert[] = [],
    scores?: {
      attendanceScore?: number | null
      midtermScore?: number | null
      examScore?: number | null
    },
    course?: {
      scoreToTakeExam?: number | null
      examScoreToPass?: number | null
      scoreToPass?: number | null
      scoreToPassGraduation?: number | null
      scoreToPassConditional?: number | null
    } | null
  ) => convertScoreWithCourseConfig(finalScore, scoreRanges, courseScoreConfigFrom(course, scores))

  const statistics = getScoreStatistics(subjectClass.subjectClassStudent || [])
  const printedAt = nowVn()
  const currentUser = c.get("user")
  const printerProfile = userId
    ? await prisma.userProfile.findUnique({
        where: { id: userId },
        select: { fullname: true, code: true, firstName: true, lastName: true },
      })
    : null
  const NGUOI_IN =
    printerProfile?.fullname ||
    `${printerProfile?.lastName || ""} ${printerProfile?.firstName || ""}`.trim() ||
    printerProfile?.code ||
    currentUser?.fullName ||
    currentUser?.userName ||
    ""
  const THOI_GIAN_IN = formatDateTimeIn(printedAt)
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
    NGAY_THI: subjectClass.examDate ? formatDateVn(subjectClass.examDate) : "",
    QUAN_SO: subjectClass.subjectClassStudent.length,
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
    d: formatNgayIn(printedAt.date()),
    m: formatThangIn(printedAt.month() + 1),
    y: printedAt.year(),
    CHUC_DANH_KY: role === "P13" ? "BAN KHẢO THÍ & ĐBCL GD-ĐT" : "CHỦ NHIỆM BỘ MÔN",
    NGUOI_IN,
    THOI_GIAN_IN,
    data: subjectClass.subjectClassStudent.map((scs, index) => {
      const statusTexts = []
      if (scs.examPostponed) statusTexts.push("Hoãn thi")
      if (scs.exempted) statusTexts.push("Miễn học")
      if (scs.withdrew) statusTexts.push("Rút khỏi")
      if (scs.examBanned) statusTexts.push("Cấm thi")
      if (scs.suspended) statusTexts.push("Đình chỉ")

      const trainingCourse = scs.student.fixedClass?.trainingCourse
      const scoreConverted = scs?.finalScore
        ? scoreConvert(
            scs?.finalScore?.toNumber(),
            trainingCourse?.scoreConverts || [],
            scs,
            trainingCourse
          )
        : null
      return {
        TT: index + 1,
        MA_SV: scs.student.userProfile?.code ?? "",
        HO_TEN: scs.student.userProfile?.fullname || "",
        NGAY_SINH: scs.student.userProfile?.dateOfBirth
          ? formatDateVn(scs.student.userProfile.dateOfBirth)
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
  const templateResult = await template.generate({ type: "nodebuffer" })

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateResult as any)
  const worksheet = workbook.getWorksheet(1)

  if (worksheet) {
    // Một dòng cuối trang: người in bên trái, giờ in bên phải. Không gán evenFooter
    // kẻo OnlyOffice vẽ cả hai lên cùng một trang.
    worksheet.headerFooter = {
      ...worksheet.headerFooter,
      differentOddEven: false,
      evenFooter: "",
      firstFooter: "",
      oddFooter: `&LNgười in: ${NGUOI_IN}&C&P/&N&R${THOI_GIAN_IN}`,
    }
    // Mẫu còn ${NGUOI_IN}/${THOI_GIAN_IN} trong thân sheet. Footer đã là dòng duy nhất.
    clearEmbeddedPrintFooter(worksheet, NGUOI_IN, THOI_GIAN_IN)
    // Lề dưới phải lớn hơn lề footer, nếu không dòng người in/giờ in đè lên bảng.
    reservePrintFooterLine(worksheet)
    const headerRange = findTableHeaderRange(worksheet)
    if (headerRange) {
      const sttColumn = findSttColumn(worksheet, headerRange)
      const firstDataRow = headerRange.end + 1
      const lastStudentRow = findLastDataRow(worksheet, firstDataRow, sttColumn)
      const hasStudents = lastStudentRow >= firstDataRow

      if (hasStudents) {
        // Native Excel/OnlyOffice repeat — reliable vs manual header row copies.
        worksheet.pageSetup = {
          ...worksheet.pageSetup,
          printTitlesRow: `${headerRange.start}:${headerRange.end}`,
        }
        addStudentPageBreaks(worksheet, headerRange, firstDataRow, lastStudentRow)
      } else {
        worksheet.pageSetup.printTitlesRow = undefined
      }

      const lastUsedRow = findLastUsedRow(worksheet)
      if (lastUsedRow > 0) {
        worksheet.pageSetup.printArea = `A1:${toColumnLetter(worksheet.columnCount)}${lastUsedRow}`
      }
    }
  }

  const result = await workbook.xlsx.writeBuffer()
  const fileName = `Phieu_diem_${subjectClass.name}.xlsx`
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result as any, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

function excelCellText(cell: ExcelJS.Cell): string {
  const value = cell.value
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim()
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim()
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim()
    }
    if ("result" in value && value.result !== undefined && value.result !== null) {
      return String(value.result).trim()
    }
  }
  return ""
}

function normalizeHeaderText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/\u00a0/g, " ")
    .replace(/[.:]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function getWorksheetMerges(worksheet: ExcelJS.Worksheet): string[] {
  return (worksheet.model as { merges?: string[] } | undefined)?.merges ?? []
}

function parseMerge(
  merge: string
): { tlCol: string; brCol: string; top: number; bottom: number } | null {
  const [topLeft, bottomRight] = merge.split(":")
  const topMatch = topLeft?.match(/^([A-Z]+)(\d+)$/)
  const bottomMatch = bottomRight?.match(/^([A-Z]+)(\d+)$/)
  if (!topMatch?.[1] || !topMatch[2] || !bottomMatch?.[1] || !bottomMatch[2]) return null
  return {
    tlCol: topMatch[1],
    brCol: bottomMatch[1],
    top: Number(topMatch[2]),
    bottom: Number(bottomMatch[2]),
  }
}

function findTableHeaderRange(
  worksheet: ExcelJS.Worksheet
): { start: number; end: number } | undefined {
  const maxScan = Math.min(worksheet.rowCount, 60)
  for (let rowNumber = 1; rowNumber <= maxScan; rowNumber++) {
    const texts: string[] = []
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      const text = normalizeHeaderText(excelCellText(cell))
      if (text) texts.push(text)
    })
    const hasTt = texts.some((text) => text === "tt" || text === "stt" || text === "so tt")
    const hasNameOrCode = texts.some(
      (text) =>
        text.includes("ma sv") ||
        text.includes("ma sinh vien") ||
        text.includes("ma hoc vien") ||
        text.includes("ho ten") ||
        text.includes("ho va ten")
    )
    const hasOtherTableColumn = texts.some(
      (text) =>
        text.includes("ngay sinh") ||
        text === "lop" ||
        text.includes("diem") ||
        text.includes("ghi chu")
    )
    if (!hasTt || texts.length < 2 || (!hasNameOrCode && !hasOtherTableColumn)) continue

    let endRow = rowNumber
    for (const merge of getWorksheetMerges(worksheet)) {
      const parsed = parseMerge(merge)
      if (parsed && parsed.top === rowNumber && parsed.bottom > endRow) endRow = parsed.bottom
    }

    // Sub-header row (C.cần / T.xuyên...). Mẫu in phách để TT ở cột B, không phải cột A.
    if (endRow === rowNumber) {
      const nextRow = worksheet.getRow(endRow + 1)
      const sttColumn = findSttColumn(worksheet, { start: rowNumber, end: rowNumber })
      const nextIndex = excelCellText(nextRow.getCell(sttColumn))
      if (!/^\d+$/.test(nextIndex) && rowHasUniqueSubheaderText(nextRow, texts)) {
        endRow += 1
      }
    }

    return { start: rowNumber, end: endRow }
  }

  const firstDataRow = findFirstStudentDataRow(worksheet)
  if (!firstDataRow) return undefined

  const end = firstDataRow - 1
  const previous = worksheet.getRow(end)
  if (!rowHasTableContent(previous)) return undefined

  return { start: end, end }
}

function findFirstStudentDataRow(worksheet: ExcelJS.Worksheet): number | undefined {
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    let populatedCells = 0
    let hasIndex = false
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      populatedCells += 1
      if (colNumber <= 8 && /^\d+$/.test(excelCellText(cell))) hasIndex = true
    })
    if (hasIndex && populatedCells >= 3) return rowNumber
  }
  return undefined
}

function rowHasTableContent(row: ExcelJS.Row): boolean {
  let populatedCells = 0
  row.eachCell({ includeEmpty: false }, () => {
    populatedCells += 1
  })
  return populatedCells >= 3
}

function isMergedSlaveCell(cell: ExcelJS.Cell): boolean {
  if (!cell.isMerged) return false
  const master = cell.master
  if (!master) return false
  return master.address !== cell.address
}

/** True when next row has sub-labels (C.cần, T.xuyên...) rather than a duplicate of the main header. */
function rowHasUniqueSubheaderText(row: ExcelJS.Row, headerTexts: string[]): boolean {
  const nextTexts: string[] = []
  row.eachCell({ includeEmpty: false }, (cell) => {
    if (isMergedSlaveCell(cell)) return
    const text = normalizeHeaderText(excelCellText(cell))
    if (text) nextTexts.push(text)
  })
  if (!nextTexts.length) return false
  const headerSet = new Set(headerTexts)
  return nextTexts.some((text) => !headerSet.has(text))
}

/** Bỏ giờ in nằm trong thân sheet. Footer in thật nằm ở headerFooter. */
function clearEmbeddedPrintFooter(
  worksheet: ExcelJS.Worksheet,
  nguoiIn: string,
  thoiGianIn: string
) {
  if (!thoiGianIn) return
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    let hasTime = false
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (excelCellText(cell) === thoiGianIn) hasTime = true
    })
    if (!hasTime) return
    row.eachCell({ includeEmpty: false }, (cell) => {
      const text = excelCellText(cell)
      // Cùng hàng có thể còn tên người in và "1/1" của mẫu danh sách thi.
      if (text === thoiGianIn || (nguoiIn && text === nguoiIn) || text === "1/1") {
        cell.value = null
      }
    })
  })
}

function isSttHeader(text: string): boolean {
  return text === "tt" || text === "stt" || text === "so tt"
}

function findSttColumn(
  worksheet: ExcelJS.Worksheet,
  headerRange: { start: number; end: number }
): number {
  let labelColumn: number | undefined
  let labelRow = headerRange.start
  for (let rowNumber = headerRange.start; rowNumber <= headerRange.end; rowNumber++) {
    let found: number | undefined
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (found || isMergedSlaveCell(cell)) return
      if (isSttHeader(normalizeHeaderText(excelCellText(cell)))) found = colNumber
    })
    if (found) {
      labelColumn = found
      labelRow = rowNumber
      break
    }
  }
  if (!labelColumn) return 1

  // Nhãn TT có thể merge lệch so với ô số: header A:B, dữ liệu lại đổ vào B:C.
  let left = labelColumn
  let right = labelColumn
  for (const merge of getWorksheetMerges(worksheet)) {
    const parsed = parseMerge(merge)
    if (!parsed || labelRow < parsed.top || labelRow > parsed.bottom) continue
    const mergeLeft = columnLettersToIndex(parsed.tlCol)
    const mergeRight = columnLettersToIndex(parsed.brCol)
    if (labelColumn < mergeLeft || labelColumn > mergeRight) continue
    left = mergeLeft
    right = mergeRight
    break
  }

  const dataRow = worksheet.getRow(headerRange.end + 1)
  for (let column = left; column <= right + 2; column++) {
    if (/^\d+$/.test(excelCellText(dataRow.getCell(column)))) return column
  }
  return labelColumn
}

function findLastDataRow(
  worksheet: ExcelJS.Worksheet,
  firstDataRow: number,
  sttColumn = 1
): number {
  let last = firstDataRow - 1
  for (let rowNumber = firstDataRow; rowNumber <= worksheet.rowCount; rowNumber++) {
    if (!/^\d+$/.test(excelCellText(worksheet.getRow(rowNumber).getCell(sttColumn)))) break
    last = rowNumber
  }
  return last
}

function findLastUsedRow(worksheet: ExcelJS.Worksheet): number {
  for (let rowNumber = worksheet.rowCount; rowNumber >= 1; rowNumber--) {
    let hasValue = false
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      if (excelCellText(cell)) hasValue = true
    })
    if (hasValue) return rowNumber
  }
  return 0
}

function columnLettersToIndex(letters: string): number {
  let index = 0
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64)
  return index
}

/** Chừa một dòng footer (người in + giờ in) dưới nội dung, không đè lên bảng. */
function reservePrintFooterLine(worksheet: ExcelJS.Worksheet) {
  const margins = { ...(worksheet.pageSetup?.margins ?? {}) }
  const footer = 0.28
  const bottom = Math.max(margins.bottom ?? 0, footer + 0.42)
  worksheet.pageSetup = {
    ...worksheet.pageSetup,
    margins: {
      left: margins.left ?? 0.5,
      right: margins.right ?? 0.5,
      top: margins.top ?? 0.5,
      header: margins.header ?? 0.25,
      ...margins,
      footer,
      bottom,
    },
  }
}

function toColumnLetter(columnNumber: number): string {
  let result = ""
  let current = Math.max(1, columnNumber)
  while (current > 0) {
    const remainder = (current - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    current = Math.floor((current - 1) / 26)
  }
  return result
}

const STUDENTS_PER_PRINT_PAGE = 25

/** Ngắt trang sau mỗi 25 sinh viên; phần còn lại sang trang sau (header bảng lặp theo printTitlesRow). */
function addStudentPageBreaks(
  worksheet: ExcelJS.Worksheet,
  _headerRange: { start: number; end: number },
  firstDataRow: number,
  lastDataRow: number
) {
  const studentCount = lastDataRow - firstDataRow + 1
  if (studentCount <= STUDENTS_PER_PRINT_PAGE) return

  for (
    let studentsOnPage = STUDENTS_PER_PRINT_PAGE;
    studentsOnPage < studentCount;
    studentsOnPage += STUDENTS_PER_PRINT_PAGE
  ) {
    worksheet.getRow(firstDataRow + studentsOnPage - 1).addPageBreak()
  }
}

const deleteSubjectClassCascadeRoute = createRoute({
  operationId: "deleteSubjectClassCascade",
  path: "/{id}/cascade",
  method: "delete",
  summary: "Xóa lớp môn học và toàn bộ dữ liệu liên quan",
  description: `Xóa cứng SubjectClass kèm: StudentSubjectScore, ClassSchedule, SubjectClassTime,
SubjectClassHistory, ExamBank, SubjectClassAttendance, Survey, ClassRegisterLogs, ScoreLinkSubjectVersion.`,
  tags: ["Lớp học phần"],
  request: {
    params: z.object({
      id: z.string().openapi(fieldDesc("ID lớp môn học.")),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Đã xóa thành công",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z
              .object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
              })
              .optional(),
          }),
        },
      },
    },
    404: {
      description: "Không tìm thấy lớp môn học",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
    500: {
      description: "Lỗi khi xóa",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(deleteSubjectClassCascadeRoute, async (c) => {
  const { id } = c.req.valid("param")
  try {
    const data = await deleteSubjectClassCascade(id)
    return c.json(
      {
        success: true,
        message: `Đã xóa lớp môn học ${data.code} và toàn bộ dữ liệu liên quan`,
        data,
      },
      200
    )
  } catch (error: any) {
    const message = error?.message || "Xóa lớp môn học thất bại"
    if (String(message).includes("không tồn tại")) {
      return c.json({ message }, 404)
    }
    console.error("[subject-class] cascade delete failed", message, error)
    return c.json({ message: String(message) }, 500)
  }
})

export default app
