import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.dM_NhanVien.create({
    data: {
        sTen: 'Nguyễn Văn A',
        sDM_DonViId: '550e8400-1234-41d4-a716-446655440000',
    },
})

// import { academicWarningRules } from './seed/academic-warning-rule'
// const trainingCourses = await prisma.trainingCourse.findMany()

// await Promise.all(
//     trainingCourses.map((trainingCourse) =>
//         prisma.academicWarningRule.createMany({
//             data: academicWarningRules.map((rule) => ({
//                 trainingCourseId: trainingCourse.id,
//                 ...rule,
//             })),
//         })
//     )
// )
