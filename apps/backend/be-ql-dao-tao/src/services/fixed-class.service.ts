import { prisma } from '..'

export interface StudentInfo {
    stt: number | undefined
    id: string | undefined
    name: string | undefined
    code: string | undefined
    DoB: string | undefined
    HomeTown: string | undefined
}

export const listStudentInfo = async (fixedClassId: string) => {
    const fixedClasses = await prisma.fixedClassStudent.findMany({
        include: { userProfile: true },
        where: { fixedClassId: fixedClassId },
    })
    const studentsInfo: StudentInfo[] = fixedClasses.map((userProfile, idx) => {
        return {
            stt: idx + 1,
            id: userProfile.userProfile.id,
            name: `${userProfile.userProfile.lastName} ${userProfile.userProfile.firstName}`,
            code: userProfile.userProfile.code
                ? userProfile.userProfile.code
                : ' ',
            DoB: userProfile.userProfile.dateOfBirth
                ? new Date(
                      userProfile.userProfile.dateOfBirth
                  ).toLocaleDateString('vi-VN')
                : ' ',
            HomeTown: userProfile.userProfile.homeTown
                ? userProfile.userProfile.homeTown
                : ' ',
        }
    })

    return studentsInfo
}
