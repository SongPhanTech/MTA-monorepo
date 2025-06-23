import type {
    AcademicDegreeType,
    AcademicRankType,
    Commune,
    CurriculumVersion,
    Ethnicity,
    FixedClass,
    Lecturer,
    LecturerType,
    Level,
    Nationality,
    Organization,
    PositionCPV,
    PriorityObject,
    Province,
    Rank,
    Religion,
    Staff,
    StaffPosition,
    StaffType,
    Student,
    TrainingCourse,
    UserProfile,
} from '@workspace/db'
import type { UploadFile } from 'antd'

export type SibarItem = {
    key: string
    label: string
}

export const tabs = [
    { key: '1', label: 'Thông tin cá nhân' },
    { key: '2', label: 'Học hàm, học vị' },
    { key: '3', label: 'Trình độ, chứng chỉ' },
    { key: '4', label: 'Quá trình công tác' },
    { key: '5', label: 'Quá trình đào tạo' },
    { key: '6', label: 'Khen thưởng - Kỷ luật' },
    { key: '7', label: 'Đối tượng chính sách' },
    { key: '8', label: 'Kê khai tài sản' },
    { key: '9', label: 'Thân nhân' },
]

export type StudentSiderbarProps = {
    activeKey: string
    setActiveKey: (key: string) => void
    tabs?: SibarItem[]
}

export type TabQuanLyHoSoProps = {
    id?: string | null
    avatar?: UploadFile[]
    setAvatar: (avatar: UploadFile[]) => void
    fileList: UploadFile[]
    setFileList: (fileList: UploadFile[]) => void
    type: string
} & StudentSiderbarProps

export type TabThongTinCaNhan = {
    id?: string | null
    avatar: UploadFile[]
    setAvatar: (avatar: UploadFile[]) => void
    fileList: UploadFile[]
    setFileList: (fileList: UploadFile[]) => void
    type: string
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
    nationality: Nationality
    religion: Religion
    ethnicity: Ethnicity
    provinceHometown: Province
    communeHometown: Commune
    rank: Rank
    academicDegreeType: AcademicDegreeType
    academicRankType: AcademicRankType
    level: Level
    positionCPV: PositionCPV
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
    organization: Organization
    lecturerType: LecturerType
}

export type StaffProfileType = Staff & {
    staffType: StaffType
    organization: Organization
    staffPosition: StaffPosition
    userProfile: UserProfileType
    fixedClass: FixedClassType[]
}

export type PutLecturerProfile = LecturerProfileType & UserProfileType

export type PutStudentProfile = StudentType & UserProfileType & FixedClassType

export type PutStaffProfile = StaffProfileType &
    UserProfileType &
    FixedClassType

export type PutModalType = StudentType &
    LecturerProfileType &
    UserProfileType &
    FixedClassType &
    StaffProfileType
