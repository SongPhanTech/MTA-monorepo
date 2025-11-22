import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import type { ScoreConvert } from '@workspace/db'
import { prisma } from '..'
import { StudentScoreRequest, StudentScoreResponse } from '../dto/student-score'
import _ from 'lodash'

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

function scoreConverter(scoreRanges: ScoreConvert[] = []) {
    const sortedRanges = [...scoreRanges].sort((a, b) => b.base10Min - a.base10Min)
    const convertScore = (finalScore: number) => {
        const matched = sortedRanges.find(
            (range) => finalScore >= range.base10Min && finalScore <= range.base10Max
        )
        if (!matched) {
            return {
                base4: null,
                letter: null,
                classification: null,
                pass: false,
                improvementRegister: false,
            }
        }

        return {
            base4: matched.base4,
            letter: matched.letter,
            classification: matched.classification,
            pass: matched.pass,
            improvementRegister: matched.improvementRegister,
        }
    }

    return { convertScore }
}

const getStudentScore = createRoute({
    operationId: 'get-student-score',
    tags: ['Score'],
    path: 'get-student-score',
    summary: '2.18. Lấy điểm sinh viên',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: StudentScoreRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: StudentScoreResponse,
                },
            },
        },
    },
})

app.openapi(getStudentScore, async (c) => {
    const { student_code } = c.req.valid('json')

    const student = await prisma.student.findUnique({
        where: {
            code: student_code,
        },
        include: {
            userProfile: true,
            curriculumVersion: {
                include: {
                    trainingLevel: true,
                    curriculum: {
                        include: {
                            trainingMajor: {
                                include: {
                                    trainingField: true,
                                },
                            },
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: {
                        include: {
                            scoreConverts: true,
                        },
                    },
                },
            },
            trainingObjectType: true,
        },
    })

    const studentId = student?.id ?? ''

    const data = await prisma.semester.findMany({
        where: {
            subjectClasses: {
                some: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                where: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
                include: {
                    subjectClassStudent: {
                        where: {
                            studentId,
                        },
                        include: {
                            subjectVersion: true,
                            certificates: {
                                include: {
                                    archivedCertificate: {
                                        include: {
                                            certificate: true,
                                        },
                                    },
                                },
                            },
                            awards: {
                                include: {
                                    archivedAward: true,
                                },
                            },
                        },
                    },
                },
            },
            trainingCoursesStart: {
                where: {
                    id: student?.fixedClass?.trainingCourseId ?? undefined,
                },
                include: {
                    scoreConverts: true,
                },
            },
            schoolYear: true,
        },
        orderBy: {
            startDate: 'desc',
        },
    })

    const { convertScore } = scoreConverter(data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts)

    return c.json(
        {
            result_code: '000',
            result_desc: 'success',
            semesters: data.map((item) => ({
                semester_name: item.name,
                semester_code: item.code,
                subject_classes: item.subjectClasses
                    .map((subjectClass) => {
                        const subjectStudent = subjectClass.subjectClassStudent[0]
                        if (!subjectStudent) {
                            return null
                        }
                        const arrCer: { finalScore: number }[] = subjectStudent?.certificates.map(
                            (i) => {
                                return {
                                    ...i,
                                    finalScore: Number(i?.archivedCertificate?.finalScore) || 0,
                                }
                            }
                        )
                        const finalScore = _.maxBy(arrCer, 'finalScore')?.finalScore || 0
                        const { improvementRegister, ...rest } = convertScore(finalScore)
                        return {
                            subject_code: subjectStudent.subjectVersion.code,
                            subject_name: subjectStudent.subjectVersion.name,
                            credit: subjectStudent.subjectVersion.credit,
                            class_id: subjectClass.id,
                            final_score: finalScore,
                            ...rest,
                            improvement_register: improvementRegister,
                        }
                    })
                    .filter(Boolean),
            })),
        },
        200
    )
})

export default app
