import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, Prisma, type ScoreConvert } from "@workspace/db"
import { examTypeOptions } from "@workspace/libs/constants"
import { getMinioUrl, getScoreStatistics } from "@workspace/libs/utils"
import dayjs from "dayjs"
import { read, utils } from "xlsx"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { EnrollFixedClassOnSubjectClass, OpenSubjectClass } from "../dto/subject-class.dto"
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { ListOf, PaginationQuerySchema } from "../zod/base"

const app = new OpenAPIHono({ strict: false })

const openSubjectClass = createRoute({
  operationId: "openSubjectClass",
  path: "/open-subject-class",
  method: "get",
  description: "Lấy danh sách môn dự kiến giảng dạy",
  tags: ["SubjectClass"],
  summary: "Lấy danh sách môn dự kiến giảng dạy",
  request: {
    query: z.object({
      semesterId: z.string(),
      trainingCourseId: z.string(),
      trainingMajorId: z.string().optional(),
      search: z.string().optional(),
      trainingObjectTypeId: z.string(),
      nextSemester: z
        .number({
          coerce: true,
        })
        .default(0),
      fixedClassId: z.string().optional(),
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

const openSubjectClassRetake = createRoute({
  operationId: "openSubjectClassRetake",
  path: "/open-subject-class-retake",
  method: "get",
  description: "Lấy danh sách môn học có hssv nợ",
  tags: ["SubjectClass"],
  summary: "Lấy danh sách môn học có hssv nợ",
  request: {
    query: PaginationQuerySchema.extend({
      trainingCourseId: z.string().openapi("trainingCourseId", {
        description: "ID khóa đào tạo",
      }),
      trainingMajorId: z
        .string()
        .openapi("trainingMajorId", {
          description: "ID của chuyên ngành đào tạo",
        })
        .optional(),
      search: z
        .string()
        .openapi("search", {
          description: "Từ khoá tìm kiếm",
        })
        .optional(),
      trainingObjectTypeId: z.string().openapi("trainingObjectTypeId", {
        description: "ID loại đối tượng đào tạo",
      }),
      semesterId: z.string().openapi("semesterId", {
        description: "ID học kỳ",
      }),
      viewAll: z
        .number({
          coerce: true,
        })
        .default(0)
        .openapi("viewAll", {
          description: "Xem tất cả môn học nợ",
        }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(
            z
              .object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                trainingObjectTypeId: z.string().nullable(),
                trainingMajorId: z.string().nullable(),
                trainingCourseId: z.string().nullable(),
                trainingBlockSubjectId: z.string(),
                count: z.number(),
              })
              .openapi("OpenSubjectClassRetakeResponse")
          ),
        },
      },
      description: "Danh sách phân công giảng dạy thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const openSubjectClassRetakeStudents = createRoute({
  operationId: "openSubjectClassRetakeStudents",
  path: "/open-subject-class-retake-students",
  method: "get",
  description: "Lấy danh sách sinh viên nợ môn học",
  tags: ["SubjectClass"],
  summary: "Lấy danh sách sinh viên nợ môn học",
  request: {
    query: z.object({
      subjectVersionId: z.string(),
      trainingCourseId: z.string().optional(),
      fixedClassId: z.string().optional(),
      search: z.string().optional(),
      trainingObjectTypeId: z.string(),
      semesterId: z.string().optional(),
      page: z.number({ coerce: true }).default(1),
      pageSize: z.number({ coerce: true }).default(10),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(
            z
              .object({
                id: z.string(),
                code: z.string(),
                userProfile: z.object({
                  fullname: z.string(),
                }),
                fixedClass: z.object({
                  code: z.string(),
                  trainingCourse: z.object({
                    name: z.string(),
                  }),
                }),
                studentId: z.string(),
                thuong_xuyen: z.number(),
                dinh_ky: z.number(),
                diem_cuoi: z.number().nullable(),
                withdrew: z.boolean(),
                mien_thi: z.boolean(),
                hoan_thi: z.boolean(),
                ly_do_hoan_thi: z.string().nullable(),
                cam_thi: z.boolean(),
                ly_do_cam_thi: z.string().nullable(),
                dinh_chi: z.boolean(),
                ly_do_dinh_chi: z.string().nullable(),
                truot_mon: z.boolean(),
              })
              .openapi("OpenSubjectClassRetakeStudentsResponse")
          ),
        },
      },
      description: "Danh sách phân công giảng dạy thành công",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const openSubjectClassReExam = createRoute({
  operationId: "openSubjectClassReExam",
  path: "/open-subject-class-reexam",
  method: "get",
  description: "Lấy danh sách môn học có hssv cần thi lại",
  tags: ["SubjectClass"],
  summary: "Lấy danh sách môn học có hssv cần thi lại",
  request: {
    query: PaginationQuerySchema.extend({
      trainingCourseId: z.string().openapi("trainingCourseId", {
        description: "ID khóa đào tạo",
      }),
      trainingMajorId: z
        .string()
        .openapi("trainingMajorId", {
          description: "ID của chuyên ngành đào tạo",
        })
        .optional(),
      search: z
        .string()
        .openapi("search", {
          description: "Từ khoá tìm kiếm",
        })
        .optional(),
      trainingObjectTypeId: z.string().openapi("trainingObjectTypeId", {
        description: "ID loại đối tượng đào tạo",
      }),
      semesterId: z.string().openapi("semesterId", {
        description: "ID học kỳ",
      }),
      viewAll: z
        .number({
          coerce: true,
        })
        .default(0)
        .openapi("viewAll", {
          description: "Xem tất cả môn học nợ",
        }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(
            z
              .object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                trainingObjectTypeId: z.string().nullable(),
                trainingMajorId: z.string().nullable(),
                trainingCourseId: z.string().nullable(),
                trainingBlockSubjectId: z.string(),
                count: z.number(),
              })
              .openapi("OpenSubjectClassReExamResponse")
          ),
        },
      },
      description: "Danh sách môn học cần thi lại",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const openSubjectClassReExamStudents = createRoute({
  operationId: "openSubjectClassReExamStudents",
  path: "/open-subject-class-reexam-students",
  method: "get",
  description: "Lấy danh sách sinh viên cần thi lại môn học",
  tags: ["SubjectClass"],
  summary: "Lấy danh sách sinh viên cần thi lại môn học",
  request: {
    query: z.object({
      subjectVersionId: z.string(),
      trainingCourseId: z.string().optional(),
      fixedClassId: z.string().optional(),
      search: z.string().optional(),
      trainingObjectTypeId: z.string(),
      page: z.number({ coerce: true }).default(1),
      pageSize: z.number({ coerce: true }).default(10),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListOf(
            z
              .object({
                id: z.string(),
                code: z.string(),
                userProfile: z.object({
                  fullname: z.string(),
                }),
                fixedClass: z.object({
                  code: z.string(),
                  trainingCourse: z.object({
                    name: z.string(),
                  }),
                }),
                studentId: z.string(),
                diem_cuoi: z.number().nullable(),
                withdrew: z.boolean(),
                mien_thi: z.boolean(),
                hoan_thi: z.boolean(),
                ly_do_hoan_thi: z.string().nullable(),
                truot_mon: z.boolean(),
              })
              .openapi("OpenSubjectClassReExamStudentsResponse")
          ),
        },
      },
      description: "Danh sách sinh viên cần thi lại môn học",
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
  description: "Đăng ký lớp môn học cho lớp quản lý",
  tags: ["SubjectClass"],
  summary: "Đăng ký lớp môn học cho lớp quản lý",
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
  description: "Đặt hạn nhập điểm",
  tags: ["SubjectClass"],
  summary: "Đặt hạn nhập điểm",
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
          schema: z.object({
            message: z.string(),
          }),
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
  description: "Đặt hạn nhập điểm thi",
  tags: ["SubjectClass"],
  summary: "Đặt hạn nhập điểm thi",
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
          schema: z.object({
            message: z.string(),
          }),
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
  description: "Import điểm lớp môn học \n\n [subjectClassId] là id của lớp học",
  tags: ["SubjectClass"],
  summary: "Import file nhập điểm",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            subjectClassId: z.string(), // loại thông tin
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
          schema: z.object({
            message: z.string(),
          }),
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
  tags: ["SubjectClass"],
  summary: "Excel xuất điểm lớp môn học",
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
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy lớp môn học.",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
})

const exportSubjectClassListExcel = createRoute({
  operationId: "exportSubjectClassListExcel",
  path: "/export-subject-class-list-excel",
  method: "get",
  tags: ["SubjectClass"],
  summary: "Xuất Excel danh sách lớp môn học",
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
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    404: {
      description: "Không tìm thấy dữ liệu",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
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

app.openapi(openSubjectClassRetake, async (c) => {
  const {
    search,
    trainingCourseId,
    trainingMajorId,
    trainingObjectTypeId,
    semesterId,
    limit,
    page,
    viewAll = 0,
  } = c.req.valid("query")

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
          subjectClassType: $Enums.SubjectClassType.RETAKE,
        },
      },
    },
  })
  const subjectAlreadyInPlan =
    planTraining?.planTrainingSubjects?.map((e) => e.trainingBlockSubjectId) || []
  const res = await prisma.$queryRaw`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                    as trainingCourseId,
                               SSS."studentId",
                               SSS."finalScore"                                                                         as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted,
                               SSS."examPostponed",
                               SSS."examBanned"                                                                         as cam_thi,
                               SSS."examBannedReason"                                                                   as ly_do_cam_thi,
                               SSS.suspended                                                                            as dinh_chi,
                               SSS."suspendedReason"                                                                    as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                           as truot_mon,
                               TBS.id                         as trainingBlockSubjectId,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc) as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id and TBS.id not in (${viewAll === 0 && subjectAlreadyInPlan.length ? Prisma.join(subjectAlreadyInPlan) : "0"}))
        select id, code, name, trainingBlockSubjectId as "trainingBlockSubjectId", count("studentId") ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true
            or cam_thi = true
            or dinh_chi = true)
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and "examPostponed" = false -- hoãn thi
          and (${trainingObjectTypeId}::TEXT IS NULL
            OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (${trainingMajorId}::TEXT IS NULL
            OR "trainingMajorId" = ${trainingMajorId}
            )
          and (${trainingCourseId}::TEXT IS NULL
            OR trainingCourseId = ${trainingCourseId}
            )
          and (${search}::TEXT IS NULL
            OR code ILIKE ${`%${search}%`}
            OR name ILIKE ${`%${search}%`}
            )
        group by id, code, name, trainingBlockSubjectId
        order by code
        limit ${limit} offset ${limit} * (${page} - 1)
    `

  const countRaw: { count: number }[] = await prisma.$queryRaw`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                    as trainingCourseId,
                               SSS."studentId",
                               SSS."finalScore"                                                                         as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted,
                               SSS."examPostponed",
                               SSS."examBanned"                                                                         as cam_thi,
                               SSS."examBannedReason"                                                                   as ly_do_cam_thi,
                               SSS.suspended                                                                            as dinh_chi,
                               SSS."suspendedReason"                                                                    as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                           as truot_mon,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc) as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id and TBS.id not in (${viewAll === 0 && subjectAlreadyInPlan.length ? Prisma.join(subjectAlreadyInPlan) : "0"}))
        select count(DISTINCT id) ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true
            or cam_thi = true
            or dinh_chi = true)
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and "examPostponed" = false -- hoãn thi
          and (${trainingObjectTypeId}::TEXT IS NULL
            OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (${trainingMajorId}::TEXT IS NULL
            OR "trainingMajorId" = ${trainingMajorId}
            )
          and (${trainingCourseId}::TEXT IS NULL
            OR trainingCourseId = ${trainingCourseId}
            )
          and (${search}::TEXT IS NULL
            OR code ILIKE ${`%${search}%`}
            OR name ILIKE ${`%${search}%`}
            )
    `
  return c.json({ data: res, count: countRaw[0]?.count }, 200)
})

app.openapi(openSubjectClassRetakeStudents, async (c) => {
  const {
    page,
    pageSize,
    search,
    trainingCourseId,
    fixedClassId,
    trainingObjectTypeId,
    subjectVersionId,
  } = c.req.valid("query")

  type Result = {
    studentId: string
    diem_cuoi: number | null
    withdrew: boolean
    exempted: boolean
    hoan_thi: boolean
    ly_do_hoan_thi: string | null
    cam_thi: boolean
    thuong_xuyen: number
    dinh_ky: number
    ly_do_cam_thi: string | null
    dinh_chi: boolean
    ly_do_dinh_chi: string | null
    truot_mon: boolean
  }[]

  const res = await prisma.$queryRaw<Result>`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               "UP"."fullname",
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                             as trainingCourseId,
                               FC.id                                                                                             as fixedClassId,
                               SSS."studentId",
                               SSS."attendanceScore"                                                                              as thuong_xuyen,
                               SSS."midtermScore"                                                                                 as dinh_ky,
                               SSS."finalScore"                                                                                  as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted                                                                                      as mien_thi,
                               SSS."examPostponed"                                                                               as hoan_thi,
                               SSS."examPostponedReason"                                                                         as ly_do_hoan_thi,
                               SSS."examBanned"                                                                                  as cam_thi,
                               SSS."examBannedReason"                                                                            as ly_do_cam_thi,
                               SSS.suspended                                                                                     as dinh_chi,
                               SSS."suspendedReason"                                                                             as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                                    as truot_mon,
                               SC."code"                                                                                         as ma_lop_mon_hoc,
                               Sem."name"                                                                                        as ky_hoc,
                               Sch."name"                                                                                        as nam_hoc,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc)::INTEGER as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."Semester" Sem on SC."semesterId" = Sem.id
                                 inner join "ql-dao-tao"."SchoolYear" Sch on Sem."schoolYearId" = Sch.id
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id and (SSS."attendanceScore" is not null
                                                            or SSS."midtermScore" is not null
                                                            or SSS."examScore" is not null
                                                            or SSS."finalScore" is not null))
        select "studentId",
               thuong_xuyen,
               dinh_ky,
               diem_cuoi,
               withdrew,
               mien_thi,
               hoan_thi,
               ly_do_hoan_thi,
               cam_thi,
               ly_do_cam_thi,
               dinh_chi,
               ly_do_dinh_chi,
               truot_mon,
               ky_hoc,
               nam_hoc
        from mon_no
        where rn = 1
          and (truot_mon = true or cam_thi = true or dinh_chi = true)
          and withdrew = false -- rút khỏi lớp
          and mien_thi = false -- miễn học
          and hoan_thi = false -- hoãn thi
          and (
            ${trainingObjectTypeId}::TEXT IS NULL
                OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (
            ${trainingCourseId}::TEXT IS NULL
                OR trainingCourseId = ${trainingCourseId}
            )
          and (
            ${fixedClassId}::TEXT IS NULL
                OR fixedClassId = ${fixedClassId}
            )
          and (
            ${search}::TEXT IS NULL
                OR code ILIKE ${`%${search}%`}
                OR "fullname" ILIKE ${`%${search}%`}
            )
          and id = ${subjectVersionId}
        limit ${pageSize} offset ${pageSize} * (${page} - 1)
    `

  const students = await prisma.student.findMany({
    where: {
      id: {
        in: res.map((r) => r.studentId),
      },
    },
    select: {
      id: true,
      code: true,
      userProfile: {
        select: {
          fullname: true,
        },
      },
      fixedClass: {
        select: {
          code: true,
          trainingCourse: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return c.json(
    {
      data: students.map((student) => ({
        ...student,
        ...res.find((r) => r.studentId === student.id),
      })),
    },
    200
  )
})

app.openapi(openSubjectClassReExam, async (c) => {
  const {
    search,
    trainingCourseId,
    trainingMajorId,
    trainingObjectTypeId,
    semesterId,
    limit,
    page,
    viewAll = 0,
  } = c.req.valid("query")

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
          subjectClassType: $Enums.SubjectClassType.REEXAM,
        },
      },
    },
  })
  const subjectAlreadyInPlan =
    planTraining?.planTrainingSubjects?.map((e) => e.trainingBlockSubjectId) || []
  const res = await prisma.$queryRaw`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                    as trainingCourseId,
                               SSS."studentId",
                               SSS."finalScore"                                                                         as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted,
                               SSS."examPostponed",
                               SSS."examBanned"                                                                         as cam_thi,
                               SSS."examBannedReason"                                                                   as ly_do_cam_thi,
                               SSS.suspended                                                                            as dinh_chi,
                               SSS."suspendedReason"                                                                    as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                           as truot_mon,
                               TBS.id                         as trainingBlockSubjectId,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc) as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id and TBS.id not in (${viewAll === 0 && subjectAlreadyInPlan.length ? Prisma.join(subjectAlreadyInPlan) : "0"}))
        select id, code, name, trainingBlockSubjectId as "trainingBlockSubjectId", count("studentId") ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true or "examPostponed" = true)
          and cam_thi = false
          and dinh_chi = false
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and (${trainingObjectTypeId}::TEXT IS NULL
            OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (${trainingMajorId}::TEXT IS NULL
            OR "trainingMajorId" = ${trainingMajorId}
            )
          and (${trainingCourseId}::TEXT IS NULL
            OR trainingCourseId = ${trainingCourseId}
            )
          and (${search}::TEXT IS NULL
            OR code ILIKE ${`%${search}%`}
            OR name ILIKE ${`%${search}%`}
            )
        group by id, code, name, trainingBlockSubjectId
        order by code
        limit ${limit} offset ${limit} * (${page} - 1)
    `

  const countRaw: { count: number }[] = await prisma.$queryRaw`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                    as trainingCourseId,
                               SSS."studentId",
                               SSS."finalScore"                                                                         as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted,
                               SSS."examPostponed",
                               SSS."examBanned"                                                                         as cam_thi,
                               SSS."examBannedReason"                                                                   as ly_do_cam_thi,
                               SSS.suspended                                                                            as dinh_chi,
                               SSS."suspendedReason"                                                                    as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                           as truot_mon,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc) as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id and TBS.id not in (${viewAll === 0 && subjectAlreadyInPlan.length ? Prisma.join(subjectAlreadyInPlan) : "0"}))
        select count(DISTINCT id) ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true or "examPostponed" = true)
          and cam_thi = false
          and dinh_chi = false
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and (${trainingObjectTypeId}::TEXT IS NULL
            OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (${trainingMajorId}::TEXT IS NULL
            OR "trainingMajorId" = ${trainingMajorId}
            )
          and (${trainingCourseId}::TEXT IS NULL
            OR trainingCourseId = ${trainingCourseId}
            )
          and (${search}::TEXT IS NULL
            OR code ILIKE ${`%${search}%`}
            OR name ILIKE ${`%${search}%`}
            )
    `
  return c.json({ data: res, count: countRaw[0]?.count }, 200)
})

app.openapi(openSubjectClassReExamStudents, async (c) => {
  const {
    page,
    pageSize,
    search,
    trainingCourseId,
    trainingObjectTypeId,
    fixedClassId,
    subjectVersionId,
  } = c.req.valid("query")

  type Result = {
    studentId: string
    diem_cuoi: number | null
    withdrew: boolean
    exempted: boolean
    hoan_thi: boolean
    ly_do_hoan_thi: string | null
    truot_mon: boolean
  }[]

  const res = await prisma.$queryRaw<Result>`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               "UP"."fullname",
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                             as trainingCourseId,
                               FC.id                                                                                             as fixedClassId,
                               SSS."studentId",
                               SSS."finalScore"                                                                                  as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted                                                                                      as mien_thi,
                               SSS."examPostponed"                                                                               as hoan_thi,
                               SSS."examPostponedReason"                                                                         as ly_do_hoan_thi,
                               SSS."examBanned"                                                                                  as cam_thi,
                               SSS."examBannedReason"                                                                            as ly_do_cam_thi,
                               SSS.suspended                                                                                     as dinh_chi,
                               SSS."suspendedReason"                                                                             as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" <
                                                                  TC."scoreToPassConditional"                                    as truot_mon,
                               SC."code"                                                                                         as ma_lop_mon_hoc,
                               Sem."name"                                                                                        as ky_hoc,
                               Sch."name"                                                                                        as nam_hoc,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc)::INTEGER as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 inner join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 inner join "ql-dao-tao"."Semester" Sem on SC."semesterId" = Sem.id
                                 inner join "ql-dao-tao"."SchoolYear" Sch on Sem."schoolYearId" = Sch.id
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where TBS."subjectId" = sv.id)
        select "studentId",
               diem_cuoi,
               withdrew,
               mien_thi,
               hoan_thi,
               ly_do_hoan_thi,
               cam_thi,
               ly_do_cam_thi,
               dinh_chi,
               ly_do_dinh_chi,
               truot_mon,
               ky_hoc,
               nam_hoc
        from mon_no
        where rn = 1
          and (truot_mon = true or hoan_thi = true) and cam_thi = false and dinh_chi = false
          and withdrew = false -- rút khỏi lớp
          and mien_thi = false -- miễn học
          and (
            ${trainingObjectTypeId}::TEXT IS NULL
                OR "trainingObjectTypeId" = ${trainingObjectTypeId}
            )
          and (
            ${trainingCourseId}::TEXT IS NULL
                OR trainingCourseId = ${trainingCourseId}
            )
          and (
            ${fixedClassId}::TEXT IS NULL
                OR fixedClassId = ${fixedClassId}
            )
          and (
            ${search}::TEXT IS NULL
                OR code ILIKE ${`%${search}%`}
                OR "fullname" ILIKE ${`%${search}%`}
            )
          and id = ${subjectVersionId}
        limit ${pageSize} offset ${pageSize} * (${page} - 1)
    `

  const students = await prisma.student.findMany({
    where: {
      id: {
        in: res.map((r) => r.studentId),
      },
    },
    select: {
      id: true,
      code: true,
      userProfile: {
        select: {
          fullname: true,
        },
      },
      fixedClass: {
        select: {
          code: true,
          trainingCourse: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return c.json(
    {
      data: students.map((student) => ({
        ...student,
        ...res.find((r) => r.studentId === student.id),
      })),
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
      isLockScore: item.isLockScore ? "1" : "", // khóa ĐQT
      lockExamSessions: item.exam?.lockExamSessions ? "1" : "", // khóa DS thi
      lockExamCode: item.exam?.examRooms?.[0]?.examList?.[0]?.lockExamCode ? "1" : "", // khóa phách
      isLockExamScore: item.isLockExamScore ? "1" : "", // p13 đã khóa
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
    THOI_GIAN_IN: dayjs().format("HH:mm:ss DD/MM/YYYY"),
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
