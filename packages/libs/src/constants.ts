import { $Enums, CriteriaField, CriteriaOperator, QuestionType } from '@workspace/db'
import type { Prisma } from '@workspace/db/client'

export const subjectVersionTypes: Record<string, $Enums.SubjectVersionType> = {
    Thường: $Enums.SubjectVersionType.Normal,
    'Thí nghiệm/Thực hành': $Enums.SubjectVersionType.Practice,
    'Thực tập': $Enums.SubjectVersionType.Internship,
    'Chuyên đề nghiên cứu': $Enums.SubjectVersionType.Research,
    'Đồ án/Đề án': $Enums.SubjectVersionType.Project,
    'Thi tốt nghiệp': $Enums.SubjectVersionType.Graduation,
}

export const subjectVersionTypeOptions = Object.entries(subjectVersionTypes).map(
    ([label, value]) => ({ label, value })
)

export const examTypes: Record<string, $Enums.ExamType> = {
    'Thi viết': $Enums.ExamType.OfflineWritten,
    'Trực tuyến': $Enums.ExamType.OnlineWritten,
    'Vấn đáp': $Enums.ExamType.Oral,
    'Thực hành - Thí nghiệm': $Enums.ExamType.Practice,
    'Đồ án': $Enums.ExamType.Project,
    Khác: $Enums.ExamType.Other,
}

export const examTypeOptions = Object.entries(examTypes).map(([label, value]) => ({
    label,
    value,
}))

export const criteriaOperatorLabels: Record<CriteriaOperator, string> = {
    [CriteriaOperator.GT]: '> (Lớn hơn)',
    [CriteriaOperator.GTE]: '>= (Lớn hơn hoặc bằng)',
    [CriteriaOperator.LT]: '< (Nhỏ hơn)',
    [CriteriaOperator.LTE]: '<= (Nhỏ hơn hoặc bằng)',
    [CriteriaOperator.EQ]: '= (Bằng)',
    [CriteriaOperator.IN]: 'IN (Thuộc danh sách)',
}

export const criteriaOperatorOptions = Object.entries(criteriaOperatorLabels).map(
    ([value, label]) => ({
        value: value as CriteriaOperator,
        label,
    })
)

export type CriteriaFieldOption = {
    value: CriteriaField
    label: string
}

export const criteriaFieldLabels: Record<CriteriaField, string> = {
    // --- Nhóm 1: Điểm số & GPA ---
    [CriteriaField.SEMESTER_GPA]: 'Điểm trung bình học kỳ',
    [CriteriaField.YEARLY_GPA]: 'Điểm trung bình năm học',
    [CriteriaField.CUMULATIVE_GPA]: 'Điểm trung bình tích lũy',
    [CriteriaField.ENTRY_SCORE]: 'Điểm thi đầu vào (xét cho tân sinh viên)',
    [CriteriaField.COURSE_GRADE_LOWEST]: 'Điểm học phần thấp nhất',
    [CriteriaField.GRADUATION_COURSE_GRADE_LOWEST]: 'Điểm học phần tốt nghiệp thấp nhất',

    // --- Nhóm 2: Tín chỉ ---
    [CriteriaField.SEMESTER_REGISTERED_CREDITS]: 'Tín chỉ đã đăng ký trong học kỳ',
    [CriteriaField.SEMESTER_PASSED_CREDITS]: 'Tín chỉ đã đạt trong học kỳ',
    [CriteriaField.SEMESTER_FAILED_CREDITS]: 'Tín chỉ không đạt trong học kỳ',
    [CriteriaField.FAILED_CREDITS_PERCENT]: 'Tỷ lệ % tín chỉ không đạt trong kỳ',
    [CriteriaField.YEAR_FAILED_CREDITS]: 'Tín chỉ không đạt trong năm học',
    [CriteriaField.CUMULATIVE_PASSED_CREDITS]: 'Tín chỉ tích lũy',
    [CriteriaField.CUMULATIVE_DEBT_CREDITS]: 'Tín chỉ còn nợ tích lũy',
    [CriteriaField.CUMULATIVE_PROGRESS_PERCENT]: 'Tỷ lệ % tiến độ tích lũy',
    [CriteriaField.CUMULATIVE_RETAKE_PERCENT]: 'Tỷ lệ % tín chỉ học lại, thi lại',

    // --- Nhóm 3: Cảnh báo & Trạng thái Học vụ ---
    [CriteriaField.ACADEMIC_WARNING_LEVEL]: 'Mức cảnh báo học tập',
    [CriteriaField.DISCIPLINARY_WARNING_LEVEL]: 'Mức cảnh cáo học đường',
    [CriteriaField.REPEAT_YEAR_COUNT]: 'Số lần lưu ban',
    [CriteriaField.SUSPENSION_COUNT]: 'Số lần bị đình chỉ',

    // --- Nhóm 4: Rèn luyện & Điều kiện khác ---
    [CriteriaField.CONDUCT_SCORE]: 'Điểm rèn luyện',
    [CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE]: 'Đã đạt chuẩn ngoại ngữ',
    [CriteriaField.HAS_REGISTERED_FOR_SEMESTER]: 'Đã đăng ký học kỳ hiện tại',
    [CriteriaField.IS_PRIORITY_STUDENT]: 'Đối tượng ưu tiên',
    [CriteriaField.IS_CLASS_MONITOR_OR_LEADER]: 'Cán bộ lớp/đoàn',
    [CriteriaField.IS_STUDY_DURATION_EXCEEDED]: 'Vượt quá thời gian đào tạo',
    [CriteriaField.IS_DEBT_SUBJECT_CONSECUTIVE]: 'Nợ môn 2 kỳ liên tiếp',
    [CriteriaField.HAS_IMPROVEMENT_REGISTRATION]: 'Đăng ký học cải thiện',
}
export const criteriaFieldOptions: CriteriaFieldOption[] = Object.entries(criteriaFieldLabels).map(
    ([value, label]) => ({
        value: value as CriteriaField,
        label,
    })
)

export type QuestionTypeOption = {
    value: QuestionType
    label: string
}

export const questionTypeLabels: Record<QuestionType, string> = {
    [QuestionType.ESSAY]: 'Tự luận',
    [QuestionType.ORAL]: 'Vấn đáp',
    [QuestionType.SINGLE_CHOICE]: 'Một lựa chọn',
    [QuestionType.MULTIPLE_CHOICE]: 'Nhiều lựa chọn',
    [QuestionType.FILL_IN_BLANK]: 'Điền trống',
    [QuestionType.ORDERING]: 'Sắp xếp',
}

export const questionTypeOptions: QuestionTypeOption[] = Object.entries(questionTypeLabels).map(
    ([value, label]) => ({
        value: value as QuestionType,
        label,
    })
)
export const whereOrganization: Prisma.DM_DonViWhereInput = {
    OR: [
        { iLoaiDonVi: 0 }, // TODO: fix
        { iLoaiDonVi: 2 }, // Trung tâm
        { iLoaiDonVi: 5 }, // Khoa
        { iLoaiDonVi: 6 }, // Viện
        { iLoaiDonVi: 7 }, // Bộ môn
        { sParentId: null },
        { lecturers: { some: { active: true } } },
    ],
    bActive: true,
}
