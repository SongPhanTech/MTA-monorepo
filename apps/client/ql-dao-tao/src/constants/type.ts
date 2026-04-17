import type { ArchivedCertificateStatus, ScoreCorrectionStatus } from "@workspace/db"
import type {
  AcademicActionType,
  ApplicationStatus,
  ClassRegisterStatus,
  CouncilRole,
  CriteriaField,
  CriteriaOperator,
  DecisionStatus,
  DiplomaVerificationStatus,
  ExamType,
  GraduationSessionStatus,
  PaymentStatus,
  ScoreConvertStatus,
  SemesterType,
  StudentStatus,
  SubjectClassSchedule,
  ThesisProjectStatus,
  TrainingObjectTypes,
} from "@workspace/db/client"
import type { ColumnsType } from "antd/es/table"
export type FilterProps = {
  searchText?: string
  trainingObjectTypes?: string[]
  pcgd?: boolean[]
  approved?: boolean[]
  name?: string | ""
  code?: string | ""
  sort?: string
  numberCreditsMajor?: "asc" | "desc"
  numberCreditsRequired?: "asc" | "desc"
  numberCreditsElective?: "asc" | "desc"
  organization?: string[]
  trainingCourses?: string[]
  numberOfSemesters?: { lte?: number | null; gte?: number | null }
  requiredCredits?: { lte?: number | null; gte?: number | null }
  electiveCredits?: { lte?: number | null; gte?: number | null }
  semesterCmp?: { lte?: number | null; gte?: number | null }
  trainingTime?: string[]
  trainingMajors?: string[]
  credit?: "asc" | "desc"
  semester?: "asc" | "desc"
  period?: "asc" | "desc"
  numberOfTheory?: "asc" | "desc"
  numberOfPractical?: "asc" | "desc"
  numberOfSelfStudy?: "asc" | "desc"
  numberOfPractice?: "asc" | "desc"
  numberOfReview?: "asc" | "desc"
  numberOfExam?: "asc" | "desc"
  examType?: ExamType[]
  fixedClass?: string[]
  fixedClassName?: string
  fixedClassCode?: string
  trainingCourse?: string[]
  actionTaken?: AcademicActionType[]
  status?: DecisionStatus[]
  statusStudent?: StudentStatus[]
  admissionQuota?: "asc" | "desc"
  semesterStart?: string
  curriculumVersion?: string[]
  curriculumVersionParallel?: string[]
  managementOrganization?: string[]
  graduated?: boolean
  trainingLevel?: string[]
  startYear?: "asc" | "desc"
  gender?: string[]
  trainingField?: string[]
  dateOfBirth?: Date[]
  academicRankType?: string[]
  academicDegreeType?: string[]
  rankId?: string[]
  officerNumber?: string
  lecturerType?: string[]
  staffType?: string[]
  bonusScore?: "asc" | "desc"
  finalScore?: "asc" | "desc"
  count?: "asc" | "desc"
  publishDate?: Date[]
  scholarship?: string[]
  decisionDate?: Date[]
  trainingCourseId?: string | null
  semesterStartId?: string | null
  trainingMajorId?: string | null
  lecturerId?: string[]
  maxStudent?: "asc" | "desc"
  subjectClassStudent?: "asc" | "desc"
  mainLecturer?: string
  extraLecturer?: string
  enterGradeLecturer?: string
  schedule?: SubjectClassSchedule[]
  room?: string
  applicationDate?: Date[]
  statusApplication?: ApplicationStatus[]
  active?: boolean[]
  numberOfOther?: "asc" | "desc"
  managementOrganizationId?: string
  managementOrganizationIds?: string[]
  floor?: "asc" | "desc"
  roomNumber?: "asc" | "desc"
  trainingObjectId?: string | null
  fixedClassId?: string | null
  schoolYearId?: string | null | undefined
  schoolYearIds?: string[]
  semesterType?: SemesterType[]
  severityLevel?: "asc" | "desc"
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
  englishName?: string | ""
  classification?: string
  creditCmp?: { lte?: number | null; gte?: number | null }
  periodCmp?: { lte?: number | null; gte?: number | null }
  numberOfTheoryCmp?: { lte?: number | null; gte?: number | null }
  numberOfPracticalCmp?: { lte?: number | null; gte?: number | null }
  numberOfSelfStudyCmp?: { lte?: number | null; gte?: number | null }
  numberOfPracticeCmp?: { lte?: number | null; gte?: number | null }
  numberOfReviewCmp?: { lte?: number | null; gte?: number | null }
  numberOfExamCmp?: { lte?: number | null; gte?: number | null }
  attendanceScoreCmp?: { lte?: number | null; gte?: number | null }
  midtermScoreCmp?: { lte?: number | null; gte?: number | null }
  examScoreCmp?: { lte?: number | null; gte?: number | null }
  finalScoreCmp?: { lte?: number | null; gte?: number | null }
  gpaCmp?: { lte?: number | null; gte?: number | null }
  reason?: string
  graduation?: boolean[]
  finalGpa?: "asc" | "desc"
  diplomaNumber?: string
  diplomaIssueDate?: Date[]
  type?: TrainingObjectTypes[]
  baseScore?: "Base10" | "Base4"
  trainingFieldId?: string
  title?: string
  titleEN?: string
  supervisor?: string
  currentStudents?: "asc" | "desc"
  maxStudents?: "asc" | "desc"
  statusThesisProject?: ThesisProjectStatus[]
  summary?: string
  specialization?: string
  workplace?: string
  phone?: string
  rank?: string
  email?: string
  originalDiplomaNumber?: string
  idCardNumber?: string
  diplomaVerificationStatus?: DiplomaVerificationStatus[]
  academicRank?: string
  academicDegree?: string
  diplomaTypeId?: string[]
  transactionCode?: string
  paymentStatus?: PaymentStatus[]
  paymentDate?: Date[]
  role?: CouncilRole[]
  order?: "asc" | "desc"
  subjectClassId?: string
  decisionNo?: string
  classRegisterStatus?: ClassRegisterStatus[]
  isTeaching?: boolean[]
  subjectClassIds?: string[]
  trainingObjectTypeId?: string
  trainingFormId?: string[]
  trainingLevelId?: string[]
  formStatus?: ScoreConvertStatus
  subjects?: string
  certificateId?: string
  awardName?: string
  archivedAwardStatus?: ArchivedCertificateStatus[]
  bonusScoreStatus?: ArchivedCertificateStatus[]
  proposal?: string /// tờ trình
  scoreCorrectionStatus?: ScoreCorrectionStatus[]
  capacityOrder?: "asc" | "desc"
  examCapacityOrder?: "asc" | "desc"
  trainingLocation?: string
  location?: string
  classDate?: Date[]
  notes?: string
  examDateFrom?: string
  examDateTo?: string
}
export type ColumnTypeProps = ColumnsType & {
  type?: string
  distinctFilters?: string[]
  options?: any[]
  dataIndex?: string
  slot?: any
}
