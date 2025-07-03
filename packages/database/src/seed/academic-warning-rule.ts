export const academicWarningRules = [
    {
        ruleType: 'GPA_SEMESTER_BELOW',
        threshold: 4.0,
        severity: 1,
        description: 'Điểm trung bình học kỳ dưới 4.0',
    },
    {
        ruleType: 'GPA_CUMULATIVE_BELOW',
        threshold: 4.6,
        yearCondition: 1,
        severity: 1,
        description: 'TBTL dưới 4.6 đối với năm thứ nhất',
    },
    {
        ruleType: 'GPA_CUMULATIVE_BELOW',
        threshold: 5.0,
        yearCondition: 2,
        severity: 1,
        description: 'TBTL dưới 5.0 đối với năm thứ hai',
    },
    {
        ruleType: 'GPA_CUMULATIVE_BELOW',
        threshold: 5.2,
        yearCondition: 3,
        severity: 1,
        description: 'TBTL dưới 5.2 đối với năm thứ ba',
    },
    {
        ruleType: 'GPA_CUMULATIVE_BELOW',
        threshold: 5.4,
        yearCondition: 4,
        severity: 1,
        description: 'TBTL dưới 5.4 đối với năm thứ tư trở đi',
    },
    {
        ruleType: 'FAILED_CREDITS_SEMESTER',
        threshold: 6,
        severity: 1,
        description: 'Tín chỉ không đạt trong học kỳ vượt quá 6',
    },
    {
        ruleType: 'FAILED_CREDITS_TOTAL',
        threshold: 10,
        severity: 1,
        description: 'Tổng số tín chỉ nợ từ đầu khóa vượt quá 10',
    },
    {
        ruleType: 'GPA_ZERO',
        severity: 2,
        description: 'Điểm trung bình học kỳ bằng 0',
    },
    {
        ruleType: 'NO_REGISTRATION',
        severity: 2,
        description: 'Không đăng ký học, tự ý bỏ học không lý do',
    },
] as const
