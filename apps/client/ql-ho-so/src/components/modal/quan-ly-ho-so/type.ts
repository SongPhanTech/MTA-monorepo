import type {
  $Enums,
  AcademicActionType,
  ApplicationStatus,
  CriteriaField,
  CriteriaOperator,
  CurriculumVersion,
  DecisionStatus,
  DM_CapBac,
  DM_ChucDanh,
  DM_ChucVu,
  DM_DanToc,
  DM_DonVi,
  DM_HocHam,
  DM_HocVi,
  DM_QuocGia,
  DM_Tinh,
  DM_TonGiao,
  DM_XaPhuong,
  ExamType,
  FixedClass,
  GraduationSessionStatus,
  Lecturer,
  LecturerType,
  PriorityObject,
  SemesterType,
  Staff,
  StaffPosition,
  StaffType,
  Student,
  SubjectClassSchedule,
  TrainingCourse,
  UserProfile,
} from "@workspace/db"
import type { UploadFile, UploadProps } from "antd"
import type { ColumnsType } from "antd/es/table"

export type SibarItem = {
  key: string
  label: string
}

export const tabs = [
  { key: "1", label: "Thông tin cá nhân" },
  { key: "2", label: "Học hàm, học vị" },
  { key: "3", label: "Trình độ, chứng chỉ" },
  { key: "4", label: "Quá trình công tác" },
  { key: "5", label: "Quá trình đào tạo" },
  { key: "6", label: "Khen thưởng - Kỷ luật" },
  { key: "7", label: "Đối tượng chính sách" },
  { key: "8", label: "Kê khai tài sản" },
  { key: "9", label: "Thân nhân" },
]

export type StudentSiderbarProps = {
  activeKey: string
  setActiveKey: (key: string) => void
  tabs?: SibarItem[]
}

export type TabQuanLyHoSoProps = {
  id?: string | null
  type: $Enums.UserType
  avatar: UploadFile[]
  setAvatar: (avatar: UploadFile[]) => void
} & StudentSiderbarProps

export type TabThongTinCaNhan = {
  id?: string | null
  type: $Enums.UserType
  avatar: UploadFile[]
  setAvatar: (avatar: UploadFile[]) => void
  userSelected?: UserProfileType | undefined
  setUserSelected?: (userSelected: any) => void
}

export type FilterProps = {
  searchText?: string
  trainingObjectTypes?: string[]
  name?: string | ""
  code?: string | ""
  sort?: string
  numberCreditsMajor?: "asc" | "desc"
  numberCreditsRequired?: "asc" | "desc"
  numberCreditsElective?: "asc" | "desc"
  organization?: string[]
  trainingCourses?: string[]
  numberOfSemesters?: "asc" | "desc"
  requiredCredits?: "asc" | "desc"
  electiveCredits?: "asc" | "desc"
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
  trainingCourse?: string[]
  actionTaken?: AcademicActionType[]
  status?: DecisionStatus[]
  admissionQuota?: "asc" | "desc"
  semesterStart?: string
  curriculumVersion?: string[]
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
  floor?: "asc" | "desc"
  roomNumber?: "asc" | "desc"
  trainingObjectId?: string | null
  fixedClassId?: string | null
  schoolYearId?: string | null | undefined
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
  finalGpa?: "asc" | "desc"
  diplomaNumber?: string
  diplomaIssueDate?: Date[]
  email?: string
  phoneNumber?: string
  idCardNumber?: string
  originalPlace?: string
  sDM_DonViId?: string
}
export type ColumnTypeProps = ColumnsType & {
  type?: string
  distinctFilters?: string[]
  options?: any[]
  dataIndex?: string
  slot?: any
}

export type StudentModalProps = {
  preSelectedValues?: {
    trainingObjectTypeId?: string
    trainingCourseId?: string
    fixedClassId?: string
    curriculumVersionId?: string
  }
  id?: string | null
}

export type UserProfileType = UserProfile & {
  nationality: DM_QuocGia
  religion: DM_TonGiao
  ethnicity: DM_DanToc
  provinceHometown: DM_Tinh
  communeHometown: DM_XaPhuong
  rank: DM_CapBac
  academicDegreeType: DM_HocVi
  academicRankType: DM_HocHam
  level: DM_ChucDanh
  positionCPV: DM_ChucVu
  educationAndTraining: StudentType[]
  lecturer: Lecturer
}

export type FixedClassType = FixedClass & {
  trainingCourse: TrainingCourse
  curriculumVersion: CurriculumVersion
}

export type StudentType = Student & {
  priorityObject: PriorityObject[]
  fixedClass: FixedClassType
  userProfile: UserProfileType
}

export type LecturerProfileType = Lecturer & {
  organization: DM_DonVi
  lecturerType: LecturerType
}

export type StaffProfileType = Staff & {
  staffType: StaffType
  organization: DM_DonVi
  staffPosition: StaffPosition
  userProfile: UserProfileType
}

export type PutLecturerProfile = LecturerProfileType &
  UserProfileType & {
    file: UploadProps | null
  }

export type PutStudentProfile = StudentType &
  UserProfileType &
  FixedClassType & {
    file: UploadProps | null
  }

export type PutStaffProfile = StaffProfileType &
  UserProfileType &
  FixedClassType & {
    file: UploadProps | null
  }

export type PutModalType = StudentType &
  LecturerProfileType &
  UserProfileType &
  FixedClassType &
  StaffProfileType & {
    file: UploadProps | null
    userProfileId: string
  }
