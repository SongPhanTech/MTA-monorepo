import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '..'
import { $Enums } from '@workspace/db'
import {
    EnrollFixedClassOnSubjectClass,
    FixedClassBySubjectClassSemester,
    OpenSubjectClass,
    StudentClassBySubjectClassSemester,
} from '../dto/subject-class.dto'

const app = new OpenAPIHono({ strict: false })

const teachingAssignment = createRoute({
    operationId: 'lecturerAssignment',
    path: '/teaching-assignment',
    method: 'put',
    description: 'Phân công giảng dạy',
    tags: ['SubjectClass'],
    summary: 'Phân công giảng dạy',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.array(
                        z
                            .object({
                                subjectClassId: z.string(),
                                lecturerId: z.string(),
                                extraLecturerId: z.string().optional(),
                                enterGradeLecturerId: z.string().optional(),
                            })
                            .openapi('teachingAssignmentRequest')
                    ),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(
                        z
                            .object({
                                subjectClassId: z
                                    .string()
                                    .openapi('subjectClassId', {
                                        description: 'ID của lớp môn học',
                                    }),
                                userProfileId: z
                                    .string()
                                    .openapi('userProfileId', {
                                        description: 'ID của giảng viên',
                                    }),
                            })
                            .openapi('teachingAssignmentResponse')
                    ),
                },
            },
            description: 'Danh sách phân công giảng dạy thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const openSubjectClass = createRoute({
    operationId: 'openSubjectClass',
    path: '/open-subject-class',
    method: 'get',
    description: 'Lấy danh sách lớp môn học đã mở',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách lớp môn học đã mở',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            trainingCourseId: z
                .string()
                .openapi('trainingCourseId', {
                    description: 'ID ngành đào tạo',
                })
                .optional(),
            trainingMajorId: z
                .string()
                .openapi('trainingMajorId', {
                    description: 'ID của chuyên ngành đào tạo',
                })
                .optional(),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(OpenSubjectClass),
                },
            },
            description: 'Danh sách phân công giảng dạy thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const fixedClassBySubjectClassSemester = createRoute({
    operationId: 'fixedClassBySubjectClassSemester',
    path: '/fixed-class-by-subject-class-semester',
    method: 'get',
    description: 'Lấy danh sách lớp quản lý theo học kỳ và lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách lớp quản lý theo học kỳ và lớp môn học',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            subjectClassId: z.string().openapi('subjectClassId', {
                description: 'ID của lớp môn học',
            }),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(FixedClassBySubjectClassSemester),
                },
            },
            description: 'Danh sách lớp quản lý theo học kỳ và lớp môn học',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const studentBySubjectClassSemester = createRoute({
    operationId: 'studentBySubjectClassSemester',
    path: '/student-by-subject-class-semester',
    method: 'get',
    description: 'Lấy danh sách học sinh theo học kỳ và lớp môn học',
    tags: ['SubjectClass'],
    summary: 'Lấy danh sách học sinh theo học kỳ và lớp môn học',
    request: {
        query: z.object({
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
            subjectClassId: z.string().openapi('subjectClassId', {
                description: 'ID của lớp môn học',
            }),
            search: z
                .string()
                .openapi('search', {
                    description: 'Từ khóa tìm kiếm',
                })
                .optional(),
            page: z.string().openapi('page', {
                description: 'Số trang',
                default: '1',
            }),
            pageSize: z.string().openapi('pageSize', {
                description: 'Số lượng bản ghi trên mỗi trang',
                default: '10',
            }),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(StudentClassBySubjectClassSemester),
                },
            },
            description: 'Danh sách học sinh theo học kỳ và lớp môn học',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const enrollFixedClassOnSubjectClass = createRoute({
    operationId: 'enrollFixedClassOnSubjectClass',
    path: '/enroll-fixed-class-on-subject-class',
    method: 'post',
    description: 'Đăng ký lớp môn học cho lớp quản lý',
    tags: ['SubjectClass'],
    summary: 'Đăng ký lớp môn học cho lớp quản lý',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        fixedClassIds: z
                            .array(z.string())
                            .openapi('fixedClassIds', {
                                description: 'Danh sách ID lớp quản lý',
                            }),
                        subjectClassId: z.string().openapi('subjectClassId', {
                            description: 'ID của lớp môn học',
                        }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(EnrollFixedClassOnSubjectClass),
                },
            },
            description: 'Đăng ký lớp môn học cho lớp quản lý thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

const enrollStudentOnSubjectClass = createRoute({
    operationId: 'enrollStudentOnSubjectClass',
    path: '/enroll-student-on-subject-class',
    method: 'post',
    description: 'Đăng ký lớp môn học cho học viên',
    tags: ['SubjectClass'],
    summary: 'Đăng ký lớp môn học cho học viên',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        addStudentIds: z
                            .array(z.string())
                            .openapi('studentIds', {
                                description: 'Danh sách ID học viên',
                            }),
                        removeStudentIds: z
                            .array(z.string())
                            .openapi('removeStudentIds', {
                                description: 'Danh sách ID học viên cần xóa',
                            }),
                        subjectClassId: z.string().openapi('subjectClassId', {
                            description: 'ID của lớp môn học',
                        }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(EnrollFixedClassOnSubjectClass),
                },
            },
            description: 'Đăng ký lớp môn học cho lớp quản lý thành công',
        },
        400: {
            description: 'Yêu cầu không hợp lệ',
        },
    },
})

app.openapi(teachingAssignment, async (c) => {
    const data = c.req.valid('json')
    const result = await Promise.allSettled(
        data.map(async ({ subjectClassId, ...lecturers }) =>
            prisma.subjectClass.update({
                where: { id: subjectClassId },
                data: lecturers,
            })
        )
    )

    const resultSuccess = result
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value)

    const resultError = result.filter((item) => item.status === 'rejected')

    return c.json(
        {
            data: resultSuccess,
            success: resultSuccess.length,
            errors: resultError.map((item) => item.reason),
            count: result.length,
        },
        200
    )
})

app.openapi(openSubjectClass, async (c) => {
    const {
        semesterId,
        search,
        page,
        pageSize,
        trainingCourseId,
        trainingMajorId,
    } = c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })
    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res: {
        data: OpenSubjectClass
    }[] =
        await prisma.$queryRawUnsafe(`with FCS as (select "ql-dao-tao"."SubjectVersion".id     as subject_version_id,
                    "ql-dao-tao"."SubjectVersion".code   as subject_version_code,
                    "ql-dao-tao"."SubjectVersion".credit as subject_version_credit,
                    CV.id                                as curriculum_version_id,
                    CV.name                              as curriculum_version_name,
                    "ql-dao-tao"."SubjectVersion".name   as subject_version_name,
                    TBS.semester                         as training_block_subject_semester,
                    ((${semesterYear} - FC."startYear") * 2 + ${semesterType})    as fixed_class_semester,
                    SC.id                                as subject_class_id,
                    SC.code                              as subject_class_code,
                    SC.name                              as subject_class_name,
                    FC."startYear"                       as fixed_class_start_year,
                    FC.id                                as fixed_class_id,
                    FC.name                              as fixed_class_name,
                    FC.code                              as fixed_class_code,
                    FC.active                            as active,
                    FC.graduated                         as graduated,
                    FC."trainingCourseId"                as training_course_id,
                    C."trainingMajorId"                  as training_major_id,
                    count(FC.id)                         as fixed_class_count
             from "ql-dao-tao"."SubjectVersion"
                      join "ql-dao-tao"."TrainingBlockSubject" TBS
                           on "ql-dao-tao"."SubjectVersion".id = TBS."subjectId"
                      join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                           on TBS."trainingBlockOnCurriculumVersionId" = TBOCV.id
                      join "ql-dao-tao"."CurriculumVersion" CV on TBOCV."curriculumVersionId" = CV.id
                      join "ql-dao-tao"."Curriculum" C on CV."curriculumId" = C.id
                      join "ql-dao-tao"."FixedClass" FC on CV.id = FC."curriculumVersionId"
                      join "ql-dao-tao"."Student" S on FC.id = S."fixedClassId"
                      left join "ql-dao-tao"."SubjectClass" SC on "SubjectVersion".id = SC."subjectId"
             where FC.active = true
             group by CV.id, CV.name, FC.id, FC."startYear",
                      FC."name", "ql-dao-tao"."SubjectVersion".id, "ql-dao-tao"."SubjectVersion".code,
                      "ql-dao-tao"."SubjectVersion".credit,
                      "ql-dao-tao"."SubjectVersion".name, TBS.semester, training_course_id, training_major_id,SC.id)
select json_build_object('subjectVersionCode', subject_version_code,'trainingMajorId', training_major_id, 'trainingCourseId', training_course_id,'subjectVersionId', subject_version_id, 'subjectVersionName', subject_version_name,
                         'subjectVersionCredit', subject_version_credit,
                           'subjectClass', json_agg(
                                 json_build_object(
                                         'subjectClassId', subject_class_id,
                                         'subjectClassCode', subject_class_code,
                                         'subjectClassName', subject_class_name
                                 )
                                         ),
                         'curriculumVersion', json_agg(
                                 json_build_object(
                                         'curriculumVersionId', curriculum_version_id,
                                         'curriculumVersionName', curriculum_version_name
                                 )
                                              ),
                         'fixedClass', json_agg(
                                 json_build_object(
                                         'fixedClassId', fixed_class_id, 'fixedClassName', fixed_class_name,'fixedClassCount', fixed_class_count,'fixedClassSemester', fixed_class_semester
                                 )
                                       )
       ) as data
from FCS
where training_block_subject_semester = fixed_class_semester and active = true and graduated = false
${trainingCourseId ? `and training_course_id = '${trainingCourseId}'` : ''}
${search ? `and subject_version_name ilike '%${search}%'` : ''}
${search ? `and subject_version_code ilike '%${search}%'` : ''}
${search ? `and fixed_class_name ilike '%${search}%'` : ''}
${search ? `and fixed_class_code ilike '%${search}%'` : ''}
${trainingMajorId ? `and training_major_id = '${trainingMajorId}'` : ''}
group by subject_version_id, subject_version_code,
         subject_version_credit, subject_version_name, training_major_id, training_course_id
         limit ${pageSize} offset (${page} - 1) * ${pageSize}
`)

    return c.json(
        {
            data: res
                .map((e) => e.data)
                .map((item) => ({
                    ...item,
                    fixedClass: item.fixedClass.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) => t.fixedClassId === value.fixedClassId
                                ) && !!value.fixedClassId
                    ),
                    curriculumVersion: item.curriculumVersion.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) =>
                                        t.curriculumVersionId ===
                                        value.curriculumVersionId
                                ) && !!value.curriculumVersionId
                    ),
                    subjectClass: item.subjectClass.filter(
                        (value, index, self) =>
                            index ===
                                self.findIndex(
                                    (t) =>
                                        t.subjectClassId ===
                                        value.subjectClassId
                                ) && !!value.subjectClassId
                    ),
                    countStudent: item.fixedClass.reduce(
                        (acc, curr) => acc + curr.fixedClassCount,
                        0
                    ),
                })),
            success: true,
        },
        200
    )
})

app.openapi(fixedClassBySubjectClassSemester, async (c) => {
    const { semesterId, search, page, pageSize, subjectClassId } =
        c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res: Array<{
        fixedClassId: string
    }> = await prisma.$queryRawUnsafe(`
            with FCS as (select SC.id                             as subject_class_id,
                    FC.id                             as fixed_class_id,
                    FC.name                           as fixed_class_name,
                    FC.code                           as fixed_class_code,
                    FC.active                         as active,
                    FC.graduated                      as graduated,
                    TBS.semester                      as training_block_subject_semester,
                    ((${semesterYear} - FC."startYear") * 2 + ${semesterType})    as fixed_class_semester
             from "ql-dao-tao"."SubjectVersion"
                      join "ql-dao-tao"."TrainingBlockSubject" TBS
                           on "ql-dao-tao"."SubjectVersion".id = TBS."subjectId"
                      join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                           on TBS."trainingBlockOnCurriculumVersionId" = TBOCV.id
                      join "ql-dao-tao"."CurriculumVersion" CV on TBOCV."curriculumVersionId" = CV.id
                      join "ql-dao-tao"."Curriculum" C on CV."curriculumId" = C.id
                      join "ql-dao-tao"."FixedClass" FC on CV.id = FC."curriculumVersionId"
                      left join "ql-dao-tao"."SubjectClass" SC on "SubjectVersion".id = SC."subjectId"
             where FC.active = true
             group by CV.id, CV.name, FC.id, FC."startYear", SC.id,
                      FC."name", "ql-dao-tao"."SubjectVersion".id, "ql-dao-tao"."SubjectVersion".code,
                      "ql-dao-tao"."SubjectVersion".credit,
                      "ql-dao-tao"."SubjectVersion".name, TBS.semester)
select fixed_class_id as "fixedClassId"
from FCS
where training_block_subject_semester = fixed_class_semester and subject_class_id = '${subjectClassId}' and active = true and graduated = false
${search ? `and fixed_class_name ilike '%${search}%'` : ''}
${search ? `and fixed_class_code ilike '%${search}%'` : ''}
group by fixed_class_id
         limit ${pageSize} offset (${page} - 1) * ${pageSize}
`)

    const fixedClasses = await prisma.fixedClass.findMany({
        where: {
            id: {
                in: res.map((e) => e.fixedClassId),
            },
        },
        include: {
            trainingCourse: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            curriculumVersion: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    curriculum: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            trainingMajor: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    },
                },
            },
            subjectClasses: {
                select: { id: true },
            },
            _count: {
                select: {
                    students: true,
                },
            },
        },
    })

    return c.json(
        {
            data: fixedClasses.map((e) => ({
                ...e,
                checked: !!e.subjectClasses.find(
                    (sc) => sc.id === subjectClassId
                ),
            })),
            success: true,
        },
        200
    )
})

app.openapi(studentBySubjectClassSemester, async (c) => {
    const { semesterId, search, page, pageSize, subjectClassId } =
        c.req.valid('query')

    const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        include: {
            schoolYear: true,
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    if (!semester) {
        return c.json(
            {
                success: false,
                message: 'Học kỳ không tồn tại',
            },
            400
        )
    }
    const semesterYear = semester?.schoolYear.startDate.getFullYear()

    const semesterType =
        semester?.semesterType === $Enums.SemesterType.FIRST ? 1 : 2

    const res: Array<{
        fixedClassId: string
    }> = await prisma.$queryRawUnsafe(`
            with FCS as (select SC.id                             as subject_class_id,
                    FC.id                             as fixed_class_id,
                    FC.name                           as fixed_class_name,
                    FC.code                           as fixed_class_code,
                    FC.active                         as active,
                    FC.graduated                      as graduated,
                    TBS.semester                      as training_block_subject_semester,
                    ((${semesterYear} - FC."startYear") * 2 + ${semesterType})    as fixed_class_semester
             from "ql-dao-tao"."SubjectVersion"
                      join "ql-dao-tao"."TrainingBlockSubject" TBS
                           on "ql-dao-tao"."SubjectVersion".id = TBS."subjectId"
                      join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                           on TBS."trainingBlockOnCurriculumVersionId" = TBOCV.id
                      join "ql-dao-tao"."CurriculumVersion" CV on TBOCV."curriculumVersionId" = CV.id
                      join "ql-dao-tao"."Curriculum" C on CV."curriculumId" = C.id
                      join "ql-dao-tao"."FixedClass" FC on CV.id = FC."curriculumVersionId"
                      left join "ql-dao-tao"."SubjectClass" SC on "SubjectVersion".id = SC."subjectId"
             where FC.active = true
             group by CV.id, CV.name, FC.id, FC."startYear", SC.id,
                      FC."name", "ql-dao-tao"."SubjectVersion".id, "ql-dao-tao"."SubjectVersion".code,
                      "ql-dao-tao"."SubjectVersion".credit,
                      "ql-dao-tao"."SubjectVersion".name, TBS.semester)
select fixed_class_id as "fixedClassId"
from FCS
where training_block_subject_semester = fixed_class_semester and subject_class_id = '${subjectClassId}' and active = true and graduated = false
${search ? `and fixed_class_name ilike '%${search}%'` : ''}
${search ? `and fixed_class_code ilike '%${search}%'` : ''}
group by fixed_class_id
         limit ${pageSize} offset (${page} - 1) * ${pageSize}
`)

    const students = await prisma.student.findMany({
        where: {
            fixedClassId: {
                in: res.map((e) => e.fixedClassId),
            },
            active: true,
        },
        include: {
            userProfile: {
                select: {
                    id: true,
                    code: true,
                    lastName: true,
                    firstName: true,
                    familyName: true,
                    gender: true,
                    dateOfBirth: true,
                },
            },
            subjectClassStudent: {
                select: {
                    subjectClassId: true,
                },
            },
            fixedClass: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    trainingCourse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    curriculumVersion: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            curriculum: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    trainingMajor: {
                                        select: {
                                            id: true,
                                            name: true,
                                            code: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return c.json(
        {
            data: students.map((e) => ({
                ...e,
                checked: !!e.subjectClassStudent.find(
                    (sCs) => sCs.subjectClassId === subjectClassId
                ),
            })),
            success: true,
        },
        200
    )
})

app.openapi(enrollFixedClassOnSubjectClass, async (c) => {
    const { subjectClassId, fixedClassIds } = c.req.valid('json')
    const fixedClasses = await prisma.fixedClass.findMany({
        where: {
            id: {
                in: fixedClassIds,
            },
            active: true,
            graduated: false,
        },
        include: {
            students: {
                select: {
                    id: true,
                },
            },
        },
    })

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    const res = await prisma.$transaction(async (tx) => {
        await tx.subjectClass.update({
            where: {
                id: subjectClassId,
            },
            data: {
                fixedClasses: {
                    set: fixedClassIds.map((id) => ({ id })),
                },
            },
        })
        await tx.studentSubjectScore.deleteMany({
            where: {
                subjectClassId,
                subjectVersionId: subjectClass.subjectId,
                status: $Enums.SubjectClassStudentStatus.Registered,
            },
        })
        return await tx.studentSubjectScore.createManyAndReturn({
            data: fixedClasses
                .flatMap((fixedClass) => fixedClass.students)
                .map((student) => ({
                    studentId: student.id,
                    subjectClassId,
                    subjectVersionId: subjectClass.subjectId,
                    status: $Enums.SubjectClassStudentStatus.Registered,
                })),
            skipDuplicates: true,
        })
    })

    return c.json(
        {
            data: res,
            success: true,
        },
        200
    )
})
app.openapi(enrollStudentOnSubjectClass, async (c) => {
    const { subjectClassId, addStudentIds, removeStudentIds } =
        c.req.valid('json')

    const subjectClass = await prisma.subjectClass.findUnique({
        where: { id: subjectClassId },
    })

    if (!subjectClass) {
        return c.json(
            {
                success: false,
                message: 'Lớp môn học không tồn tại',
            },
            400
        )
    }

    const res = await prisma.$transaction(async (tx) => {
        for (const studentId of removeStudentIds) {
            await tx.studentSubjectScore.deleteMany({
                where: {
                    studentId,
                },
            })
        }
        return await tx.studentSubjectScore.createManyAndReturn({
            data: addStudentIds.map((studentId) => ({
                studentId: studentId,
                subjectClassId,
                subjectVersionId: subjectClass.subjectId,
                status: $Enums.SubjectClassStudentStatus.Registered,
            })),
            skipDuplicates: true,
        })
    })

    return c.json(
        {
            data: res,
            success: true,
        },
        200
    )
})
export default app
