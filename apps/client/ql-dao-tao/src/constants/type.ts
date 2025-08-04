import type {
    AcademicActionType,
    ApplicationStatus,
    CriteriaField,
    CriteriaOperator,
    DecisionStatus,
    ExamType,
    GraduationSessionStatus,
    SemesterType,
    SubjectClassSchedule,
    TrainingObjectTypes,
} from '@workspace/db'
import type { ColumnsType } from 'antd/es/table'
export type FilterProps = {
    searchText?: string
    trainingObjectTypes?: string[]
    name?: string | ''
    code?: string | ''
    sort?: string
    numberCreditsMajor?: 'asc' | 'desc'
    numberCreditsRequired?: 'asc' | 'desc'
    numberCreditsElective?: 'asc' | 'desc'
    organization?: string[]
    trainingCourses?: string[]
    numberOfSemesters?: 'asc' | 'desc'
    requiredCredits?: 'asc' | 'desc'
    electiveCredits?: 'asc' | 'desc'
    trainingTime?: string[]
    trainingMajors?: string[]
    credit?: 'asc' | 'desc'
    semester?: 'asc' | 'desc'
    period?: 'asc' | 'desc'
    numberOfTheory?: 'asc' | 'desc'
    numberOfPractical?: 'asc' | 'desc'
    numberOfSelfStudy?: 'asc' | 'desc'
    numberOfPractice?: 'asc' | 'desc'
    numberOfReview?: 'asc' | 'desc'
    numberOfExam?: 'asc' | 'desc'
    examType?: ExamType[]
    fixedClass?: string[]
    trainingCourse?: string[]
    actionTaken?: AcademicActionType[]
    status?: DecisionStatus[]
    admissionQuota?: 'asc' | 'desc'
    semesterStart?: string
    curriculumVersion?: string[]
    managementOrganization?: string[]
    graduated?: boolean
    trainingLevel?: string[]
    startYear?: 'asc' | 'desc'
    gender?: string[]
    trainingField?: string[]
    dateOfBirth?: Date[]
    academicRankType?: string[]
    academicDegreeType?: string[]
    rankId?: string[]
    officerNumber?: string
    lecturerType?: string[]
    staffType?: string[]
    bonusScore?: 'asc' | 'desc'
    finalScore?: 'asc' | 'desc'
    count?: 'asc' | 'desc'
    publishDate?: Date[]
    scholarship?: string[]
    decisionDate?: Date[]
    trainingCourseId?: string | null
    semesterStartId?: string | null
    trainingMajorId?: string | null
    lecturerId?: string[]
    maxStudent?: 'asc' | 'desc'
    subjectClassStudent?: 'asc' | 'desc'
    mainLecturer?: string
    extraLecturer?: string
    enterGradeLecturer?: string
    schedule?: SubjectClassSchedule[]
    room?: string
    applicationDate?: Date[]
    statusApplication?: ApplicationStatus[]
    active?: boolean[]
    numberOfOther?: 'asc' | 'desc'
    managementOrganizationId?: string
    floor?: 'asc' | 'desc'
    roomNumber?: 'asc' | 'desc'
    trainingObjectId?: string | null
    fixedClassId?: string | null
    schoolYearId?: string | null | undefined
    semesterType?: SemesterType[]
    severityLevel?: 'asc' | 'desc'
    sessionDate?: Date[]
    applicationStart?: Date[]
    applicationEnd?: Date[]
    statusGraduationSession?: GraduationSessionStatus[]
    field?: CriteriaField[]
    operator?: CriteriaOperator[]
    semesterId?: string | null
    subjectName?: string
    scoreDeadline?: Date[]
    examScoreDeadline?: Date[]
    startDate?: Date[]
    examDate?: Date[]
    endDate?: Date[]
    englistName?: string | ''
    finalGpa?: 'asc' | 'desc'
    diplomaNumber?: string
    diplomaIssueDate?: Date[]
    type?: TrainingObjectTypes
    baseScore?: 'Base10' | 'Base4'
}
export type ColumnTypeProps = ColumnsType & {
    type?: string
    distinctFilters?: string[]
    options?: any[]
    dataIndex?: string
    slot?: any
}
