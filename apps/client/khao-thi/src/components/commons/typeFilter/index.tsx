import type {
    AcademicActionType,
    ApplicationStatus,
    CriteriaField,
    CriteriaOperator,
    DecisionStatus,
    Difficult,
    ExamType,
    GraduationSessionStatus,
    QuestionType,
    SemesterType,
    SubjectClassSchedule,
    SurveyQuestionType,
} from '@workspace/db'
import type { GetSurveyObjectsIsStudent } from '@workspace/libs/api/schemas'
import type { ColumnsType } from 'antd/es/table'

export type FilterProps = {
    information?: string | ''
    issuer?: string | ''
    searchText?: string
    trainingObjectTypes?: string[]
    studentCode?: string | ''
    lecturerCode?: string | ''
    fullname?: string | ''
    name?: string | ''
    code?: string | ''
    sort?: string
    evidenceName?: string
    idCardNumber?: string
    phoneNumber?: string
    numberCreditsMajor?: 'asc' | 'desc'
    numberCreditsRequired?: 'asc' | 'desc'
    numberCreditsElective?: 'asc' | 'desc'
    organization?: string[]
    organizationId?: string
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
    englishName?: string | ''
    subjectVersionId?: string[]
    content?: string | ''
    questionType?: QuestionType[]
    explanation?: string | ''
    point?: 'asc' | 'desc'
    level?: 'asc' | 'desc'
    difficultyId?: string | null
    knowledgeBlockId?: string | null
    title?: string | ''
    startTime?: string
    duration?: 'asc' | 'desc'
    passScore?: 'asc' | 'desc'
    questionBankId?: string | null
    questionPoint?: 'asc' | 'desc'
    surveyQuestionType?: SurveyQuestionType[]
    surveyId?: string
    surveyObjectTypeId?: string[]
    surveyTopicId?: string[]
    subjectClass?: string[]
    order?: 'asc' | 'desc'
    scoreScalesId?: string[]
    hasExam?: boolean
    examCode?: string
    score?: 'asc' | 'desc'
    surveyQuestionGroupId?: string[]
    isPublic?: boolean[]
    anonymous?: boolean[]
    statusSurvey?: boolean[]
    taken?: boolean[]
    trainingCourseIds?: string[]
    fixedClassIds?: string[]
    isStudent?: GetSurveyObjectsIsStudent
    subjectClassName?: string
    semesterIds?: string[]
    difficult?: Difficult[]
    subjectVersionIdString?: string
    organizationName?: string
    lecturerName?: string
}

export type ColumnTypeProps = ColumnsType & {
    type?: string
    distinctFilters?: string[]
    options?: any[]
    dataIndex?: string
    slot?: any
}
