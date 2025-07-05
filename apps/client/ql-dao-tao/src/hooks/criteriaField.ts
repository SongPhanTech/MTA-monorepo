import { CriteriaField } from '@workspace/db'

export type CriteriaFieldOption = {
    value: CriteriaField
    label: string
}

export const useCriteriaFieldOptions = () => {
    const options: CriteriaFieldOption[] = [
        { value: CriteriaField.TOTAL_CREDITS, label: 'Tổng số tín chỉ học tập' },
        { value: CriteriaField.REGISTERED_CREDITS, label: 'Số tín chỉ đăng ký' },
        {
            value: CriteriaField.ACCUMULATED_CREDITS_PERCENT,
            label: '% tín chỉ tích lũy so với kế hoạch',
        },
        { value: CriteriaField.COURSE_GRADE_MIN, label: 'Điểm học phần tối thiểu' },
        { value: CriteriaField.GRADUATION_GRADE_MIN, label: 'Điểm học phần tốt nghiệp tối thiểu' },
        { value: CriteriaField.SEMESTER_GPA, label: 'Điểm trung bình học kỳ' },
        { value: CriteriaField.ENTRY_SCORE, label: 'Điểm thi đầu vào' },
        { value: CriteriaField.CONDUCT, label: 'Mức rèn luyện' },
        { value: CriteriaField.FOREIGN_LANGUAGE, label: 'Chuẩn đầu ra ngoại ngữ' },
        { value: CriteriaField.ACADEMIC_WARNING_LEVEL, label: 'Cảnh cáo học tập' },
        { value: CriteriaField.DISCIPLINARY_WARNING_LEVEL, label: 'Cảnh cáo học đường' },
    ]

    const getCriteriaFieldLabel = (value: CriteriaField | null | undefined): string => {
        return options.find((opt) => opt.value === value)?.label || ''
    }

    return {
        options,
        getCriteriaFieldLabel,
    }
}
