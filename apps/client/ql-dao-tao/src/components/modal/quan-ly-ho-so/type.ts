import type {
  $Enums,
  CurriculumVersion,
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
  FixedClass,
  Lecturer,
  LecturerType,
  PriorityObject,
  Staff,
  StaffPosition,
  StaffType,
  Student,
  TrainingCourse,
  UserProfile,
} from "@workspace/db/client"
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
  }
