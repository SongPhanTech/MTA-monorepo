import { prisma } from '..'
import type { StudentInfo } from '../dto/student-info.dto'

export const listStudentInfo = async (fixedClassId: string) => {
    const fixedClasses = await prisma.fixedClass.findUnique({
        include: {
            students: {
                include: {
                    userProfile: true,
                },
            },
        },
        where: { id: fixedClassId },
    })
    if (!fixedClasses) {
        throw new Error('Lớp học không tồn tại')
    }
    const studentsInfo: StudentInfo[] = fixedClasses.students.map(({ userProfile }, idx) => {
        return {
            stt: idx + 1,
            id: userProfile?.id ?? '',
            name: `${userProfile?.lastName} ${userProfile?.firstName}`,
            code: userProfile?.code || '',
            birth: userProfile?.dateOfBirth
                ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                : '',
            hometown: userProfile?.homeTown || '',
        }
    })

    return studentsInfo
}
