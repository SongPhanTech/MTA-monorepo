import type { CriteriaField, CriteriaOperator } from '@workspace/db'

export interface StudentDataContext extends Record<CriteriaField, number | boolean> {
    SEMESTER_GPA: number
    YEARLY_GPA: number
    CUMULATIVE_GPA: number
    ENTRY_SCORE: number
    COURSE_GRADE_LOWEST: number
    GRADUATION_COURSE_GRADE_LOWEST: number

    SEMESTER_REGISTERED_CREDITS: number
    SEMESTER_PASSED_CREDITS: number
    SEMESTER_FAILED_CREDITS: number
    FAILED_CREDITS_PERCENT: number
    YEAR_FAILED_CREDITS: number
    CUMULATIVE_PASSED_CREDITS: number
    CUMULATIVE_DEBT_CREDITS: number
    CUMULATIVE_PROGRESS_PERCENT: number

    ACADEMIC_WARNING_LEVEL: number
    DISCIPLINARY_WARNING_LEVEL: number
    REPEAT_YEAR_COUNT: number
    SUSPENSION_COUNT: number

    CONDUCT_SCORE: number
    HAS_PASSED_FOREIGN_LANGUAGE: boolean
    HAS_REGISTERED_FOR_SEMESTER: boolean
    IS_PRIORITY_STUDENT: boolean
    IS_CLASS_MONITOR_OR_LEADER: boolean
    IS_STUDY_DURATION_EXCEEDED: boolean
    IS_DEBT_SUBJECT_CONSECUTIVE: boolean
    HAS_IMPROVEMENT_REGISTRATION: boolean
}

export type StudentCondition = {
    field: CriteriaField
    operator: CriteriaOperator
    value: number
    invert?: boolean | null
    tuple?: string[]
}
