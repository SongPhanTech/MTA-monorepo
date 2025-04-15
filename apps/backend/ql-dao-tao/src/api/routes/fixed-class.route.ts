import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import fixedClassService from '../services/fixed-class.service';

const uploadExcelCreateFixedClass = createRoute({
    operationId: 'uploadExcelCreateFixedClass',
    path: '/FixedClass/upload-excel-create-fixed-class',
    method: 'post',
    description:
        'Thêm mới danh sách lớp biên chế \n\n [trainingCourseId] là id của khóa học, lấy trong bảng TrainingCourse',
    tags: ['FixedClass'],
    summary: 'Upload Excel Create FixedClass',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z
                        .object({
                            file: z.any(), // file upload
                            trainingCourseId: z.string(), // loại thông tin
                        })
                        .openapi('uploadExcelCreateFixedClass'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.any()),
                },
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            description: 'Invalid file upload',
        },
    },
})

const classDivision = createRoute({
    operationId: 'classDivision',
    path: '/FixedClass/upload-excel-update-user-profile',
    method: 'post',
    description: 'Phân chia học viên vào các lớp',
    tags: ['FixedClass'],
    summary: 'Class Division',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z
                        .object({
                            file: z.any(), // file uploadƯ
                        })
                        .openapi('classDivision'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.any()),
                },
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            description: 'Invalid file upload',
        },
    },
})

const exportDocxListStudentFixedClass = createRoute({
    operationId: 'exportStudentFixedClassDocx',
    path: '/FixedClass/export-docx-list-student-fixed-class',
    description: 'Xuất file docx danh sách sinh viên trong lớp biên chế',
    tags: ['FixedClass'],
    summary: 'Export list of student FixedClass as .docx',
    method: 'get',
    request: {
        query: z.object({
            fixedClassId: z
                .string()
                .optional()
                .openapi({ param: { style: 'form' } }),
            // includeGroups: z
            //     .string()
            //     .optional()
            //     .openapi({ param: { style: 'form' } }),
        }),
    },
    responses: {
        200: {
            description: 'Export list of  student FixedClass as .docx',
            content: {
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    {
                        schema: z
                            .string()
                            .openapi('ExportedRolesDOCX (base64)'),
                    },
            },
        },
    },
})

export default {
    uploadExcelCreateFixedClass,
    classDivision,
    exportDocxListStudentFixedClass,
}
