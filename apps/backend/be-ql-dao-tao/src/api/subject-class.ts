import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '..'
import { $Enums } from '@workspace/db'
import { OpenSubjectClass } from '../dto/subject-class.dto'

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
select json_build_object('trainingMajorId', training_major_id, 'trainingCourseId', training_course_id,'subjectVersionId', subject_version_id, 'subjectVersionName', subject_version_name,
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
                                         'fixedClassId', fixed_class_id, 'fixedClassName', fixed_class_name,'fixedClassCount', fixed_class_count
                                 )
                                       )
       ) as data
from FCS
where training_block_subject_semester = fixed_class_semester
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

export default app
