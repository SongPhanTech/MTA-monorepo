import { CriteriaField } from '@workspace/db'

export type CriteriaFieldOption = {
    value: CriteriaField
    label: string
}

export const useCriteriaFieldOptions = () => {
    const options: CriteriaFieldOption[] = [
        // --- Nhóm 1: Điểm số & GPA ---
        { value: CriteriaField.SEMESTER_GPA, label: 'Điểm trung bình học kỳ' },
        { value: CriteriaField.YEARLY_GPA, label: 'Điểm trung bình năm học' },
        { value: CriteriaField.CUMULATIVE_GPA, label: 'Điểm trung bình tích lũy' },
        { value: CriteriaField.ENTRY_SCORE, label: 'Điểm thi đầu vào (xét cho tân sinh viên)' },
        { value: CriteriaField.COURSE_GRADE_LOWEST, label: 'Điểm học phần thấp nhất' },
        {
            value: CriteriaField.GRADUATION_COURSE_GRADE_LOWEST,
            label: 'Điểm học phần tốt nghiệp thấp nhất',
        },

        // --- Nhóm 2: Tín chỉ ---
        {
            value: CriteriaField.SEMESTER_REGISTERED_CREDITS,
            label: 'Tín chỉ đã đăng ký trong học kỳ',
        },
        { value: CriteriaField.SEMESTER_PASSED_CREDITS, label: 'Tín chỉ đã đạt trong học kỳ' },
        { value: CriteriaField.SEMESTER_FAILED_CREDITS, label: 'Tín chỉ không đạt trong học kỳ' },
        {
            value: CriteriaField.SEMESTER_FAILED_CREDITS_PERCENT,
            label: 'Tỷ lệ % tín chỉ không đạt trong kỳ',
        },
        { value: CriteriaField.YEAR_FAILED_CREDITS, label: 'Tín chỉ không đạt trong năm học' },
        { value: CriteriaField.CUMULATIVE_PASSED_CREDITS, label: 'Tín chỉ tích lũy' },
        { value: CriteriaField.CUMULATIVE_DEBT_CREDITS, label: 'Tín chỉ còn nợ tích lũy' },
        { value: CriteriaField.CUMULATIVE_PROGRESS_PERCENT, label: 'Tỷ lệ % tiến độ tích lũy' },

        // --- Nhóm 3: Cảnh báo & Trạng thái Học vụ ---
        { value: CriteriaField.ACADEMIC_WARNING_LEVEL, label: 'Mức cảnh báo học tập' },
        { value: CriteriaField.DISCIPLINARY_WARNING_LEVEL, label: 'Mức cảnh cáo học đường' },
        { value: CriteriaField.REPEAT_YEAR_COUNT, label: 'Số lần lưu ban' },
        { value: CriteriaField.SUSPENSION_COUNT, label: 'Số lần bị đình chỉ' },

        // --- Nhóm 4: Rèn luyện & Điều kiện khác ---
        { value: CriteriaField.CONDUCT_SCORE, label: 'Điểm rèn luyện' },
        { value: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE, label: 'Đã đạt chuẩn ngoại ngữ' },
        { value: CriteriaField.HAS_REGISTERED_FOR_SEMESTER, label: 'Đã đăng ký học kỳ hiện tại' },
        { value: CriteriaField.IS_PRIORITY_STUDENT, label: 'Đối tượng ưu tiên' },
        { value: CriteriaField.IS_CLASS_MONITOR_OR_LEADER, label: 'Cán bộ lớp/đoàn' },
        { value: CriteriaField.IS_STUDY_DURATION_EXCEEDED, label: 'Vượt quá thời gian đào tạo' },
        { value: CriteriaField.IS_DEBT_SUBJECT_CONSECUTIVE, label: 'Nợ môn 2 kỳ liên tiếp' },
        { value: CriteriaField.HAS_IMPROVEMENT_REGISTRATION, label: 'Đăng ký học cải thiện' },
    ]

    const getCriteriaFieldLabel = (value: CriteriaField | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getCriteriaFieldLabel,
    }
}
