import { $Enums, Prisma as PrismaNamespace, type PrismaClient } from "@workspace/db"

/**
 * Join khối CTĐT sớm theo subjectId — giữ để query nhanh, không quét hết TBS rồi mới lọc môn.
 */
export const trainingBlockSubjectJoin = PrismaNamespace.sql`
  inner join "ql-dao-tao"."TrainingBlockSubject" TBS
             on TBS."subjectId" = sv.id
  inner join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
             on TBOCV.id = TBS."trainingBlockOnCurriculumVersionId"
            and TBOCV."curriculumVersionId" = CV.id
`

/**
 * Số lần thi thật (số bản ghi StudentSubjectScore), không bị nhân khi join nhiều khối CTĐT.
 * DENSE_RANK trên SSS.id: 1 điểm × N khối vẫn ra attempt_count = 1.
 */
export const attemptCountExpr = PrismaNamespace.sql`
  (
    DENSE_RANK() OVER (
      PARTITION BY SSS."studentId", SSS."subjectVersionId"
      ORDER BY SSS.id ASC
    ) + DENSE_RANK() OVER (
      PARTITION BY SSS."studentId", SSS."subjectVersionId"
      ORDER BY SSS.id DESC
    ) - 1
  )::INTEGER
`

export const firstAttemptExamBannedExpr = PrismaNamespace.sql`
  FIRST_VALUE(SSS."examBanned") OVER (
    PARTITION BY SSS."studentId", SSS."subjectVersionId"
    ORDER BY SSS."createdAt" ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  )
`

/** Lần thi mới nhất: cùng rank cho mọi dòng TBS của cùng 1 bản điểm. */
export const latestAttemptRnExpr = PrismaNamespace.sql`
  DENSE_RANK() OVER (
    PARTITION BY SSS."studentId", SSS."subjectVersionId"
    ORDER BY SSS."createdAt" DESC, SSS.id DESC
  )::INTEGER
`

export const truotMonExpr = PrismaNamespace.sql`
  (TBS."graduation" = true and SSS."finalScore" is not null and SSS."finalScore" < TC."scoreToPassGraduation"::numeric)
  or (TBS."graduation" = false and TBS."useForFinalScore" = true and SSS."finalScore" is not null and SSS."finalScore" < TC."scoreToPass"::numeric)
  or (TBS."graduation" = false and TBS."useForFinalScore" = false and SSS."finalScore" is not null and SSS."finalScore" < TC."scoreToPassConditional"::numeric)
  or (SSS."examScore" is not null and SSS."examScore" < TC."examScoreToPass")
  or SSS."examScore" is null
  or SSS."examBanned" = true
  or SSS.suspended = true
  or (coalesce(sv."onePoint", false) = false and SSS."attendanceScore" is not null and SSS."attendanceScore" < TC."scoreToTakeExam")
  or (coalesce(sv."onePoint", false) = false and SSS."midtermScore" is not null and SSS."midtermScore" < TC."scoreToTakeExam")
  or (coalesce(sv."onePoint", false) = false and (SSS."attendanceScore" is null or SSS."midtermScore" is null))
`

export const reexamEligibleExpr = PrismaNamespace.sql`
  (
    ("isRetakeExam" = true or training_object_type = 'MILITARY')
    and (training_object_type != 'CIVILIAN' or training_object_type is null)
  )
  or is_national_defense = true
`

export const duDieuKienDuThiExpr = PrismaNamespace.sql`
  (
    cam_thi = false
    and dinh_chi = false
    and (
      is_one_point = true
      or (
        thuong_xuyen is not null
        and dinh_ky is not null
        and thuong_xuyen >= score_to_take_exam
        and dinh_ky >= score_to_take_exam
      )
    )
  )
`

export const failedExamOrAbsentExpr = PrismaNamespace.sql`
  (
    hoan_thi = true
    or diem_thi is null
    or diem_thi < exam_score_to_pass
    or (is_graduation = true and diem_cuoi is not null and diem_cuoi < score_to_pass_graduation::numeric)
    or (is_graduation = false and use_for_final_score = true and diem_cuoi is not null and diem_cuoi < score_to_pass::numeric)
    or (is_graduation = false and use_for_final_score = false and diem_cuoi is not null and diem_cuoi < score_to_pass_conditional::numeric)
  )
`

export type DebtExportRow = {
  studentId: string
  studentCode: string | null
  fullname: string | null
  dateOfBirth: Date | null
  fixedClassCode: string | null
  subjectCode: string
  subjectName: string
  subjectCredit: number
  semesterCode: string | null
  finalScore: number | null
  examScore: number | null
  examBanned: boolean
  examBannedReason: string | null
  suspended: boolean
  examPostponed: boolean
  attempt_count: number
  type: "HỌC LẠI" | "THI LẠI"
  totalDebtSubject: number
  totalDebtCredit: number
}

/** Cùng điều kiện với màn thống kê học lại / thi lại (giữ join TBS). */
export async function queryDebtExportRows(
  db: PrismaClient,
  params: {
    trainingObjectTypeId: string
    trainingCourseId?: string | null
    trainingMajorId?: string | null
  }
): Promise<DebtExportRow[]> {
  const conditions = [
    PrismaNamespace.sql`S."status"::text = ${$Enums.StudentStatus.ENROLLED}`,
    PrismaNamespace.sql`sv."trainingObjectTypeId" = ${params.trainingObjectTypeId}`,
  ]
  if (params.trainingCourseId) {
    conditions.push(PrismaNamespace.sql`TC.id = ${params.trainingCourseId}`)
  }
  if (params.trainingMajorId) {
    conditions.push(PrismaNamespace.sql`C."trainingMajorId" = ${params.trainingMajorId}`)
  }
  const whereClause = PrismaNamespace.join(conditions, " and ")

  return db.$queryRaw<DebtExportRow[]>`
    with mon_no as (
      select
        S.id as "studentId",
        "UP"."code" as "studentCode",
        "UP"."fullname",
        "UP"."dateOfBirth",
        FC.code as "fixedClassCode",
        sv.id as "subjectVersionId",
        sv.code as "subjectCode",
        sv.name as "subjectName",
        sv.credit as "subjectCredit",
        Sem.code as "semesterCode",
        SSS."attendanceScore" as thuong_xuyen,
        SSS."midtermScore" as dinh_ky,
        SSS."examScore" as diem_thi,
        SSS."finalScore" as diem_cuoi,
        SSS."finalScore" as "finalScore",
        SSS."examScore" as "examScore",
        SSS."examBanned" as "examBanned",
        SSS."examBanned" as cam_thi,
        SSS."examBannedReason" as "examBannedReason",
        SSS."examBannedReason" as ly_do_cam_thi,
        SSS.suspended,
        SSS.suspended as dinh_chi,
        SSS."suspendedReason" as ly_do_dinh_chi,
        SSS."examPostponed" as "examPostponed",
        SSS."examPostponed" as hoan_thi,
        SSS."examPostponedReason" as ly_do_hoan_thi,
        SSS.withdrew,
        SSS.exempted,
        SSS.exempted as mien_thi,
        coalesce(sv."onePoint", false) as is_one_point,
        TBS."graduation" as is_graduation,
        TBS."useForFinalScore" as use_for_final_score,
        TC."scoreToTakeExam" as score_to_take_exam,
        TC."examScoreToPass" as exam_score_to_pass,
        TC."scoreToPass" as score_to_pass,
        TC."scoreToPassGraduation" as score_to_pass_graduation,
        TC."scoreToPassConditional" as score_to_pass_conditional,
        TC."isRetakeExam" as "isRetakeExam",
        TOT.type as training_object_type,
        TB."isNationalDefense" as is_national_defense,
        ${truotMonExpr} as truot_mon,
        ${attemptCountExpr} as attempt_count,
        ${firstAttemptExamBannedExpr} as first_attempt_exam_banned,
        ${latestAttemptRnExpr} as rn
      from "ql-dao-tao"."SubjectVersion" as sv
      inner join "ql-dao-tao"."StudentSubjectScore" SSS on sv.id = SSS."subjectVersionId"
      inner join "ql-dao-tao"."Student" S on S.id = SSS."studentId"
      left join "ql-nguoi-dung"."UserProfile" "UP" on "UP".id = S."userProfileId"
      inner join "ql-dao-tao"."FixedClass" FC on FC.id = S."fixedClassId"
      inner join "ql-dao-tao"."TrainingCourse" TC on TC.id = FC."trainingCourseId"
      left join "ql-dao-tao"."TrainingObjectType" TOT on TOT.id = TC."trainingObjectTypeId"
      inner join "ql-dao-tao"."SubjectClass" SC on SC.id = SSS."subjectClassId"
      left join "ql-dao-tao"."Semester" Sem on SC."semesterId" = Sem.id
      inner join "ql-dao-tao"."CurriculumVersion" CV on CV.id = S."curriculumVersionId"
      inner join "ql-dao-tao"."Curriculum" C on C.id = CV."curriculumId"
      ${trainingBlockSubjectJoin}
      inner join "ql-dao-tao"."TrainingBlock" TB on TB.id = TBOCV."trainingBlockId"
      where ${whereClause}
    ),
    classified as (
      select DISTINCT ON ("studentId", "subjectVersionId")
        "studentId",
        "studentCode",
        fullname,
        "dateOfBirth",
        "fixedClassCode",
        "subjectCode",
        "subjectName",
        "subjectCredit",
        "semesterCode",
        "finalScore",
        "examScore",
        "examBanned",
        "examBannedReason",
        suspended,
        "examPostponed",
        attempt_count,
        case
          when withdrew = false and mien_thi = false
               and attempt_count = 1
               and (${reexamEligibleExpr})
               and (${duDieuKienDuThiExpr})
               and (${failedExamOrAbsentExpr})
            then 'THI LẠI'
          when withdrew = false and mien_thi = false
               and (truot_mon = true or cam_thi = true or dinh_chi = true)
               and not (
                 attempt_count = 1
                 and (${reexamEligibleExpr})
                 and (${duDieuKienDuThiExpr})
                 and (${failedExamOrAbsentExpr})
               )
            then 'HỌC LẠI'
          else null
        end as type
      from mon_no
      where rn = 1
      order by "studentId", "subjectVersionId", truot_mon DESC NULLS LAST, "examBanned" DESC, suspended DESC
    )
    select
      "studentId",
      "studentCode",
      fullname,
      "dateOfBirth",
      "fixedClassCode",
      "subjectCode",
      "subjectName",
      "subjectCredit",
      "semesterCode",
      "finalScore",
      "examScore",
      "examBanned",
      "examBannedReason",
      suspended,
      "examPostponed",
      attempt_count,
      type,
      count(*) OVER (PARTITION BY "studentId")::INTEGER as "totalDebtSubject",
      coalesce(sum("subjectCredit") OVER (PARTITION BY "studentId"), 0)::INTEGER as "totalDebtCredit"
    from classified
    where type is not null
    order by "studentCode", "subjectCode"
  `
}
