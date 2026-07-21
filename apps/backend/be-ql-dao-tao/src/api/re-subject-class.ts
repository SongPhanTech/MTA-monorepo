import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, Prisma, Prisma as PrismaNamespace } from "@workspace/db"
import { prisma } from ".."
import {
  DataListResponseSchema,
  PaginatedDataResponseSchema,
  PaginationQuerySchema,
} from "../zod/base"
import {
  OpenSubjectClassRetakeItemSchema,
  ReExamStudentItemSchema,
  RetakeStudentItemSchema,
} from "../dto/re-subject-class.dto"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const openSubjectClassRetake = createRoute({
  operationId: "openSubjectClassRetake",
  path: "/open-subject-class-retake",
  method: "get",
  summary: "Môn học lại (học viên nợ)",
  description: `Danh sách học phần có học viên cần học lại.

**Bảng dữ liệu nguồn:** SubjectVersion, StudentSubjectScore, TrainingBlockSubject.

**Tham số:** phân trang + trainingCourseId, trainingMajorId, search, trainingObjectTypeId, semesterId, viewAll.`,
  tags: ["Lớp học phần"],
  request: {
    query: PaginationQuerySchema.extend({
      trainingCourseId: z.string().openapi("trainingCourseId", {
        description: "ID khoá đào tạo",
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: PaginatedDataResponseSchema(OpenSubjectClassRetakeItemSchema),
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
  summary: "Học viên nợ môn (học lại)",
  description: `Chi tiết học viên nợ từng học phần (học lại).

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore, SubjectVersion.

**Tham số:** subjectVersionId, trainingCourseId, fixedClassId, search, trainingObjectTypeId, semesterId, page, pageSize.`,
  tags: ["Lớp học phần"],
  request: {
    query: z.object({
      subjectVersionId: z.string().openapi(fieldDesc("ID phiên bản môn.")),
      trainingCourseId: z.string().optional().openapi(fieldDesc("ID khóa học.")),
      fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp niên chế.")),
      search: z.string().optional().openapi(fieldDesc("Từ khóa mã/tên HV.")),
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
      semesterId: z.string().optional().openapi(fieldDesc("ID học kỳ.")),
      page: z.number({ coerce: true }).default(1).openapi(fieldDesc("Trang.", 1)),
      pageSize: z.number({ coerce: true }).default(10).openapi(fieldDesc("Số bản ghi/trang.", 10)),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: DataListResponseSchema(RetakeStudentItemSchema),
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
  summary: "Môn cần thi lại",
  description: `Danh sách học phần có học viên cần thi lại.

**Bảng dữ liệu nguồn:** SubjectVersion, StudentSubjectScore.

**Tham số:** giống API học lại (phân trang + bộ lọc).`,
  tags: ["Lớp học phần"],
  request: {
    query: PaginationQuerySchema.extend({
      trainingCourseId: z.string().openapi("trainingCourseId", {
        description: "ID khoá đào tạo",
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
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: PaginatedDataResponseSchema(
            OpenSubjectClassRetakeItemSchema.openapi("OpenSubjectClassReExamResponse")
          ),
        },
      },
      description: "Danh sách môn học cần thi lại",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "Yêu cầu không hợp lệ",
    },
  },
})

const openSubjectClassReExamStudents = createRoute({
  operationId: "openSubjectClassReExamStudents",
  path: "/open-subject-class-reexam-students",
  method: "get",
  summary: "Học viên thi lại môn",
  description: `Chi tiết học viên cần thi lại từng học phần.

**Bảng dữ liệu nguồn:** Student, StudentSubjectScore.

**Tham số:** subjectVersionId, trainingCourseId, fixedClassId, search, trainingObjectTypeId, page, pageSize.`,
  tags: ["Lớp học phần"],
  request: {
    query: z.object({
      subjectVersionId: z.string().openapi(fieldDesc("ID phiên bản môn.")),
      trainingCourseId: z.string().optional().openapi(fieldDesc("ID khóa.")),
      fixedClassId: z.string().optional().openapi(fieldDesc("ID lớp NC.")),
      search: z.string().optional().openapi(fieldDesc("Từ khóa.")),
      trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ ĐT.")),
      page: z.number({ coerce: true }).default(1).openapi(fieldDesc("Trang.", 1)),
      pageSize: z.number({ coerce: true }).default(10).openapi(fieldDesc("Page size.", 10)),
    }),
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: DataListResponseSchema(ReExamStudentItemSchema),
        },
      },
      description: "Danh sách sinh viên cần thi lại môn học",
    },
    400: {
      description: "Yêu cầu không hợp lệ",
    },
  },
})

/**
 * openSubjectClassRetake — Danh sách môn HỌC LẠI (học lại toàn bộ môn)
 *
 * Business rules:
 * - A student is a Retake (học lại) candidate if their most recent attempt (rn=1) satisfies:
 *     truot_mon = true  OR  cam_thi = true  OR  dinh_chi = true
 *   and they have NOT withdrawn, are NOT exempted, and have NOT postponed the exam.
 *
 * Relationship with isRetakeExam / ReExam (thi lại):
 * - TrainingCourse.isRetakeExam = true means the course allows students to retake only the
 *   final exam (thi lại) instead of repeating the full course (học lại).
 * - A student on their FIRST attempt who merely failed (truot_mon=true, not banned, not
 *   suspended) is eligible for ReExam → they are EXCLUDED from this Retake list.
 * - However, if the student already did a ReExam and STILL failed (attempt_count >= 2),
 *   they have exhausted their ReExam chance and must now repeat the full course → they ARE
 *   included in this Retake list.
 * - If isRetakeExam = false, all failing students go straight to Retake regardless.
 *
 * Key SQL columns used for the above logic:
 *   first_attempt_exam_banned — FIRST_VALUE(examBanned ORDER BY createdAt ASC): whether the
 *     student was exam-banned on their very first registration of the subject.
 *   attempt_count — COUNT(*) OVER PARTITION: total number of StudentSubjectScore records for
 *     that student+subject combination (1 = only original attempt, 2+ = had a ReExam).
 *
 * viewAll=0 (default): hides subjects already added to the plan (subjectAlreadyInPlan).
 * viewAll=1: shows all subjects regardless of plan status.
 */
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
  const conditions = [
    PrismaNamespace.sql`TBS."subjectId" = sv.id`,
  ]
  if (trainingObjectTypeId) {
    conditions.push(PrismaNamespace.sql`sv."trainingObjectTypeId" = ${trainingObjectTypeId}`)
  }
  if (trainingCourseId) {
    conditions.push(PrismaNamespace.sql`TC.id = ${trainingCourseId}`)
  }
  if (typeof viewAll !== 'undefined' && viewAll === 0 && subjectAlreadyInPlan.length) {
    conditions.push(PrismaNamespace.sql`TBS.id not in (${PrismaNamespace.join(subjectAlreadyInPlan)})`)
  }
  if (trainingMajorId) {
    conditions.push(PrismaNamespace.sql`C."trainingMajorId" = ${trainingMajorId}`)
  }
  if (search) {
    conditions.push(PrismaNamespace.sql`(sv.code ILIKE ${`%${search}%`} OR sv.name ILIKE ${`%${search}%`})`)
  }
  const whereClause = PrismaNamespace.join(conditions, " and ")
  const res = await prisma.$queryRaw`\n        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id as trainingCourseId,
                               SSS."studentId",
                               SSS."finalScore" as diem_cuoi,
                               SSS.withdrew,
                               SSS.exempted,
                               SSS."examPostponed",
                               SSS."examBanned" as cam_thi,
                               SSS."examBannedReason" as ly_do_cam_thi,
                               SSS.suspended as dinh_chi,
                               SSS."suspendedReason" as ly_do_dinh_chi,
                               TBS."graduation" = true and SSS."finalScore" < TC."scoreToPassGraduation" or
                               TBS."useForFinalScore" = true and SSS."finalScore" < TC."scoreToPass" or
                               TBS."useForFinalScore" = false and SSS."finalScore" < TC."scoreToPassConditional"
                                    as truot_mon,
                               TBS.id                         as trainingBlockSubjectId,
                               TC."isRetakeExam",
                               FIRST_VALUE(SSS."examBanned") OVER (
                                 PARTITION BY SSS."studentId", SSS."subjectVersionId"
                                 ORDER BY SSS."createdAt" ASC
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                               )                              as first_attempt_exam_banned,
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                     as attempt_count,
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
                        where ${whereClause})
        select id, code, name, trainingBlockSubjectId as "trainingBlockSubjectId", count("studentId") ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true
            or cam_thi = true
            or dinh_chi = true)
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and "examPostponed" = false -- hoãn thi
          -- exclude students eligible for ReExam (thi lại)
          -- only exclude on first attempt: if they already did a ReExam but still fail → belongs in Retake
          and not ("isRetakeExam" = true and attempt_count = 1 and first_attempt_exam_banned = false
                   and truot_mon = true and cam_thi = false and dinh_chi = false)
          
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
                               TC."isRetakeExam",
                               FIRST_VALUE(SSS."examBanned") OVER (
                                 PARTITION BY SSS."studentId", SSS."subjectVersionId"
                                 ORDER BY SSS."createdAt" ASC
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                               )                                                                                         as first_attempt_exam_banned,
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                                                                                as attempt_count,
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
                        where ${whereClause})
        select count(DISTINCT id) ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true
            or cam_thi = true
            or dinh_chi = true)
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          and "examPostponed" = false -- hoãn thi
          -- exclude students eligible for ReExam (thi lại)
          -- only exclude on first attempt: if they already did a ReExam but still fail → belongs in Retake
          and not ("isRetakeExam" = true and attempt_count = 1 and first_attempt_exam_banned = false
                   and truot_mon = true and cam_thi = false and dinh_chi = false)
          
    `
  return c.json({ data: res, count: countRaw[0]?.count }, 200)
})

/**
 * openSubjectClassRetakeStudents — Danh sách sinh viên HỌC LẠI của một môn cụ thể
 *
 * Same business rules as openSubjectClassRetake (see above), scoped to a single subjectVersionId.
 * Returns individual student rows with score details (thuong_xuyen, dinh_ky, diem_cuoi, etc.).
 *
 * Exclusion logic mirrors the subject list:
 *   - First attempt only (attempt_count = 1) + isRetakeExam course + not banned → excluded
 *     (student belongs in ReExam list instead)
 *   - 2+ attempts → student already used their ReExam chance → included in Retake
 */
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
    reason: string | null
    attempt_count: number
  }[]

  const conditions = [
    PrismaNamespace.sql`TBS."subjectId" = sv.id`,
  ]
  if (trainingObjectTypeId) {
    conditions.push(PrismaNamespace.sql`sv."trainingObjectTypeId" = ${trainingObjectTypeId}`)
  }
  if (trainingCourseId) {
    conditions.push(PrismaNamespace.sql`TC.id = ${trainingCourseId}`)
  }
  if (fixedClassId) {
    conditions.push(PrismaNamespace.sql`FC.id = ${fixedClassId}`)
  }
  if (search) {
    conditions.push(PrismaNamespace.sql`(S.code ILIKE ${`%${search}%`} OR "UP"."fullname" ILIKE ${`%${search}%`})`)
  }
  if (subjectVersionId) {
    conditions.push(PrismaNamespace.sql`sv.id = ${subjectVersionId}`)
  }
  const whereClause = PrismaNamespace.join(conditions, " and ")
  const res = await prisma.$queryRaw<Result>`
        with mon_no as (select sv.id,
                               S.code,
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
                               TC."isRetakeExam",
                               FIRST_VALUE(SSS."examBanned") OVER (
                                 PARTITION BY SSS."studentId", SSS."subjectVersionId"
                                 ORDER BY SSS."createdAt" ASC
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                               )                                                                                                  as first_attempt_exam_banned,
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                                                                                         as attempt_count,
                               SC."code"                                                                                         as ma_lop_mon_hoc,
                               Sem."name"                                                                                        as ky_hoc,
                               Sch."name"                                                                                        as nam_hoc,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc)::INTEGER as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 left join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 left join "ql-dao-tao"."Semester" Sem on SC."semesterId" = Sem.id
                                 left join "ql-dao-tao"."SchoolYear" Sch on Sem."schoolYearId" = Sch.id
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where ${whereClause})
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
               nam_hoc,
               attempt_count
        from mon_no
        where rn = 1
          and (truot_mon = true or cam_thi = true or dinh_chi = true)
          and withdrew = false -- rút khỏi lớp
          and mien_thi = false -- miễn học
          and hoan_thi = false -- hoãn thi
          -- exclude students eligible for ReExam (thi lại)
          -- only exclude on first attempt: if they already did a ReExam but still fail → belongs in Retake
          and not ("isRetakeExam" = true and attempt_count = 1 and first_attempt_exam_banned = false
                   and truot_mon = true and cam_thi = false and dinh_chi = false)
          
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
      data: students.map((student) => {
        const record = res.find((r) => r.studentId === student.id)
        let reason = ""

        if (record) {
          const reasons: string[] = []
          if (record.cam_thi)
            reasons.push(record.ly_do_cam_thi ? `Cấm thi: ${record.ly_do_cam_thi}` : "Cấm thi")
          if (record.dinh_chi)
            reasons.push(record.ly_do_dinh_chi ? `Đình chỉ: ${record.ly_do_dinh_chi}` : "Đình chỉ")
          if (record.withdrew) reasons.push("Rút khỏi lớp")

          if (reasons.length > 0) {
            reason = reasons.join(", ")
          } else if (record.attempt_count >= 2 && record.truot_mon) {
            reason = "Trượt thi lại"
          } else if (record.truot_mon) {
            reason = "Trượt môn"
          }
        }

        return {
          ...student,
          ...record,
          reason,
        }
      }),
    },
    200
  )
})

/**
 * openSubjectClassReExam — Danh sách môn THI LẠI (chỉ thi lại phần thi cuối)
 *
 * Business rules:
 * - Only available for TrainingCourse where isRetakeExam = true.
 *   If isRetakeExam = false, the API returns 400 immediately.
 * - A student is a ReExam (thi lại) candidate if their most recent attempt (rn=1) satisfies:
 *     (truot_mon = true OR examPostponed = true)
 *     AND cam_thi = false   -- not exam-banned
 *     AND dinh_chi = false  -- not suspended
 *     AND withdrew = false
 *     AND exempted = false
 * - ReExam is the student's ONE extra chance before they must do a full Retake (học lại).
 *   After failing a ReExam (attempt_count >= 2), they fall out of this list and appear in
 *   openSubjectClassRetake instead.
 *
 * viewAll=0 (default): hides subjects already added to the ReExam plan.
 * viewAll=1: shows all qualifying subjects.
 */
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

  const trainingCourse = await prisma.trainingCourse.findUniqueOrThrow({
    where: { id: trainingCourseId },
    select: { name: true, isRetakeExam: true },
  })

  if (!trainingCourse.isRetakeExam) {
    return c.json({ message: `${trainingCourse.name} không được thi lại` }, 400)
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
          subjectClassType: $Enums.SubjectClassType.REEXAM,
        },
      },
    },
  })
  const subjectAlreadyInPlan =
    planTraining?.planTrainingSubjects?.map((e) => e.trainingBlockSubjectId) || []
  const conditions = [
    PrismaNamespace.sql`TBS."subjectId" = sv.id`,
  ]
  if (trainingObjectTypeId) {
    conditions.push(PrismaNamespace.sql`sv."trainingObjectTypeId" = ${trainingObjectTypeId}`)
  }
  if (trainingCourseId) {
    conditions.push(PrismaNamespace.sql`TC.id = ${trainingCourseId}`)
  }
  if (typeof viewAll !== 'undefined' && viewAll === 0 && subjectAlreadyInPlan.length) {
    conditions.push(PrismaNamespace.sql`TBS.id not in (${PrismaNamespace.join(subjectAlreadyInPlan)})`)
  }
  if (trainingMajorId) {
    conditions.push(PrismaNamespace.sql`C."trainingMajorId" = ${trainingMajorId}`)
  }
  if (search) {
    conditions.push(PrismaNamespace.sql`(sv.code ILIKE ${`%${search}%`} OR sv.name ILIKE ${`%${search}%`})`)
  }
  const whereClause = PrismaNamespace.join(conditions, " and ")
  const res = await prisma.$queryRaw`
        with mon_no as (select sv.id,
                               sv.code,
                               sv.name,
                               sv."trainingObjectTypeId",
                               C."trainingMajorId",
                               TC.id                                                                                    as trainingCourseId,
                               SSS."studentId",
                               SSS."attendanceScore"                                                                    as thuong_xuyen,
                               SSS."midtermScore"                                                                       as dinh_ky,
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
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                     as attempt_count,
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
                        where ${whereClause})
        select id, code, name, trainingBlockSubjectId as "trainingBlockSubjectId", count("studentId") ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true or "examPostponed" = true)
          and cam_thi = false
          and dinh_chi = false
          and attempt_count = 1      -- only first attempt: if they failed ReExam, they belong in Retake
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          
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
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                                                                                as attempt_count,
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
                        where ${whereClause})
        select count(DISTINCT id) ::INTEGER as count
        from mon_no
        where rn = 1
          and (truot_mon = true or "examPostponed" = true)
          and cam_thi = false
          and dinh_chi = false
          and attempt_count = 1      -- only first attempt: if they failed ReExam, they belong in Retake
          and withdrew = false        -- rút khỏi lớp
          and exempted = false        -- miễn học
          
    `
  return c.json({ data: res || [], count: countRaw[0]?.count || 0 }, 200)
})

/**
 * openSubjectClassReExamStudents — Danh sách sinh viên THI LẠI của một môn cụ thể
 *
 * Same business rules as openSubjectClassReExam (see above), scoped to a single subjectVersionId.
 * Returns individual student rows with score and postponement details.
 */
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

  const conditions = [
    PrismaNamespace.sql`TBS."subjectId" = sv.id`,
  ]
  if (trainingObjectTypeId) {
    conditions.push(PrismaNamespace.sql`sv."trainingObjectTypeId" = ${trainingObjectTypeId}`)
  }
  if (trainingCourseId) {
    conditions.push(PrismaNamespace.sql`TC.id = ${trainingCourseId}`)
  }
  if (fixedClassId) {
    conditions.push(PrismaNamespace.sql`FC.id = ${fixedClassId}`)
  }
  if (search) {
    conditions.push(PrismaNamespace.sql`(S.code ILIKE ${`%${search}%`} OR "UP"."fullname" ILIKE ${`%${search}%`})`)
  }
  if (subjectVersionId) {
    conditions.push(PrismaNamespace.sql`sv.id = ${subjectVersionId}`)
  }
  const whereClause = PrismaNamespace.join(conditions, " and ")
  const res = await prisma.$queryRaw<Result>`
        with mon_no as (select sv.id,
                               S.code,
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
                               (SELECT COUNT(*) FROM "ql-dao-tao"."StudentSubjectScore" s2
                                WHERE s2."studentId" = SSS."studentId"
                                  AND s2."subjectVersionId" = SSS."subjectVersionId"
                               )::INTEGER                                                                                         as attempt_count,
                               row_number()
                               over (partition by SSS."studentId",SSS."subjectVersionId" order by SSS."createdAt" desc)::INTEGER as rn
                        from "ql-dao-tao"."SubjectVersion" as sv
                                 inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
                                 inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
                                 left join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
                                 inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
                                 left join "ql-dao-tao"."Semester" Sem on SC."semesterId" = Sem.id
                                 left join "ql-dao-tao"."SchoolYear" Sch on Sem."schoolYearId" = Sch.id
                                 inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
                                 inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
                                 inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                                            on CV.id = TBOCV."curriculumVersionId"
                                 inner join "ql-dao-tao"."TrainingBlockSubject" TBS
                                            on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
                                 inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
                                 inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
                        where ${whereClause})
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
          and attempt_count = 1      -- only first attempt: if they failed ReExam, they belong in Retake
          and withdrew = false -- rút khỏi lớp
          and mien_thi = false -- miễn học
          
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

export default app
