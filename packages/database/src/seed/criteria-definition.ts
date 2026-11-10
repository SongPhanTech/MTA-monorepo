import type { $Enums, PrismaClient } from "../../generated/prisma-client"

/**
 * 27 tiêu chí hệ thống trong danh mục CriteriaDefinition.
 * id/code/name khớp với migration 20261109120000_criteria_definition (id = "crit_sys_" + lower(field)).
 */
const systemCriteriaNames: Record<$Enums.CriteriaField, string> = {
  SEMESTER_GPA: "Điểm trung bình học kỳ",
  YEARLY_GPA: "Điểm trung bình năm học",
  CUMULATIVE_GPA: "Điểm trung bình tích lũy",
  ENTRY_SCORE: "Điểm thi đầu vào (xét cho tân sinh viên)",
  COURSE_GRADE_LOWEST: "Điểm học phần thấp nhất",
  GRADUATION_COURSE_GRADE_LOWEST: "Điểm học phần tốt nghiệp thấp nhất",
  SEMESTER_REGISTERED_CREDITS: "Tín chỉ đã đăng ký trong học kỳ",
  SEMESTER_PASSED_CREDITS: "Tín chỉ đã đạt trong học kỳ",
  SEMESTER_FAILED_CREDITS: "Tín chỉ không đạt trong học kỳ",
  YEAR_FAILED_CREDITS: "Tín chỉ không đạt trong năm học",
  FAILED_CREDITS_PERCENT: "Tỷ lệ % tín chỉ không đạt trong kỳ",
  CUMULATIVE_PASSED_CREDITS: "Tín chỉ tích lũy",
  CUMULATIVE_DEBT_CREDITS: "Tín chỉ còn nợ tích lũy",
  CUMULATIVE_PROGRESS_PERCENT: "Tỷ lệ % tiến độ tích lũy",
  CUMULATIVE_RETAKE_PERCENT: "Tỷ lệ % tín chỉ học lại, thi lại",
  ACADEMIC_WARNING_LEVEL: "Mức cảnh báo học tập",
  DISCIPLINARY_WARNING_LEVEL: "Mức cảnh cáo học đường",
  REPEAT_YEAR_COUNT: "Số lần lưu ban",
  SUSPENSION_COUNT: "Số lần bị đình chỉ",
  CONDUCT_SCORE: "Điểm rèn luyện (0-10)",
  HAS_PASSED_FOREIGN_LANGUAGE: "Đã đạt chuẩn ngoại ngữ",
  HAS_REGISTERED_FOR_SEMESTER: "Đã đăng ký học kỳ hiện tại",
  IS_PRIORITY_STUDENT: "Đối tượng ưu tiên",
  IS_CLASS_MONITOR_OR_LEADER: "Cán bộ lớp/đoàn",
  IS_STUDY_DURATION_EXCEEDED: "Vượt quá thời gian đào tạo",
  IS_DEBT_SUBJECT_CONSECUTIVE: "Nợ môn 2 kỳ liên tiếp",
  HAS_IMPROVEMENT_REGISTRATION: "Đăng ký học cải thiện",
}

export const systemCriteriaId = (field: $Enums.CriteriaField) => `crit_sys_${field.toLowerCase()}`

export async function seedSystemCriteriaDefinitions(prisma: PrismaClient) {
  await prisma.criteriaDefinition.createMany({
    skipDuplicates: true,
    data: (Object.entries(systemCriteriaNames) as Array<[$Enums.CriteriaField, string]>).map(
      ([field, name]) => ({
        id: systemCriteriaId(field),
        code: field,
        name,
        source: "SYSTEM" as const,
        systemField: field,
      })
    ),
  })
}
