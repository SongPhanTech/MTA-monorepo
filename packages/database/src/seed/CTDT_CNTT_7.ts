import { PrismaClient } from '../../generated/prisma-client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')
    //#region StudentSubjectScore
    const subjectClasses = await prisma.subjectClass.findMany({
        where: {
            id: {
                endsWith: '_CNTT_K11_V1',
            },
        },
    })
    console.log(`Found ${subjectClasses.length} subject classes.`)

    const students = await prisma.student.findMany({
        where: {
            fixedClassId: 'K57_CNTT',
        },
    })
    console.log(`Found ${students.length} students.`)
    function randomHalfStep(min: number, max: number) {
        const steps = (max - min) * 2 + 1
        const value = Math.floor(Math.random() * steps)
        return min + value * 0.5
    }
    // Tạo điểm cho mỗi học sinh trong mỗi lớp học
    for (const student of students) {
        for (const subjectClass of subjectClasses) {
            let scoreSpace = [5, 10]
            // điểm giỏi
            if (student.id.endsWith('1')) {
                scoreSpace = [8, 10]
            }
            // điểm khá
            if (student.id.endsWith('2')) {
                scoreSpace = [6, 8]
            }
            // điểm trung bình
            if (student.id.endsWith('3')) {
                scoreSpace = [4, 7]
            }
            // điểm yếu
            if (student.id.endsWith('4')) {
                scoreSpace = [2, 4]
            }
            if (
                Array.isArray(scoreSpace) &&
                scoreSpace.length >= 2 &&
                typeof scoreSpace[0] === 'number' &&
                typeof scoreSpace[1] === 'number'
            ) {
                const attendanceScore = randomHalfStep(scoreSpace[0], scoreSpace[1])
                const midtermScore = randomHalfStep(scoreSpace[0], scoreSpace[1])
                const examScore = randomHalfStep(scoreSpace[0], scoreSpace[1])
                const finalScore = attendanceScore * 0.1 + midtermScore * 0.3 + examScore * 0.6
                await prisma.studentSubjectScore.create({
                    data: {
                        studentId: student.id,
                        subjectClassId: subjectClass.id,
                        subjectVersionId: subjectClass.subjectId,
                        attendanceScore: attendanceScore,
                        midtermScore: midtermScore,
                        examScore: examScore,
                        finalScore: finalScore,
                    },
                })
            } else {
                throw new Error('scoreSpace is not defined properly.')
            }
        }
    }
    console.log('All data imported successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Database connection closed.')
    })
    .catch(async (e) => {
        console.error('Error during data import:', e)
        await prisma.$disconnect()
    })
