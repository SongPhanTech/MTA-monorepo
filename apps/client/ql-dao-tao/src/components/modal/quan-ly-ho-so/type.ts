import type {
    AcademicDegreeType,
    AcademicRankType,
    Commune,
    Ethnicity,
    FixedClass,
    Level,
    Nationality,
    PositionCPV,
    PriorityObject,
    Province,
    Rank,
    Religion,
    Student,
    TrainingCourse,
    UserProfile,
} from '@workspace/db'

export type SibarItem = {
    key: string
    label: string
}

export type StudentSiderbarProps = {
    activeKey: string
    setActiveKey: (key: string) => void
    tabs?: SibarItem[]
}

export type TabQuanLyHoSoProps = {
    id?: string | null
} & StudentSiderbarProps

export type TabThongTinCaNhan = {
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
}

export type FixedClassType = FixedClass & {
    trainingCourse: TrainingCourse
}

export type StudentType = Student & {
    priorityObject: PriorityObject[]
    fixedClass: FixedClassType
}

export type PutStudentProfile = StudentType & UserProfileType
