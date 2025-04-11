import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import fixedClassService from '../services/fixed-class.service';

const uploadExcelCreateFixedClass = createRoute({
    operationId: 'uploadExcelCreateFixedClass',
    path: '/FixedClass/upload-excel-create-fixed-class',
    method: 'post',
    description:
        'Thêm mới danh sách lớp biên chế \n\n [trainingCourseId] là mã của khóa học, lấy trong bảng TrainingCourse',
    tags: ['FixedClass'],
    summary: 'Upload Excel Create FixedClass',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any(), // file upload
                        trainingCourseId: z.string() // loại thông tin
                    }).openapi('uploadExcelCreateFixedClass'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
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
    path: '/fixClass/upload-excel-update-user-profile',
    method: 'post',
    description:
        'Phân chia học viên vào các lớp',
    tags: ['FixedClass'],
    summary: 'Class Division',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any(), // file uploadƯ
                    }).openapi('classDivision'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            description: 'Invalid file upload',
        },
    },
})

const getFixedClassList = createRoute({
    operationId: 'getFixedClassList',
    path: '/fixedClass/list',
    method: 'get',
    description: 'Lấy danh sách lớp biên chế kèm theo học viên',
    tags: ['FixedClass'],
    summary: 'Get FixedClass With Students',
    request: {
        query: z.object({
            trainingCourseId: z.string().optional(),
        }),
    },
    responses: {
        200: {
            description: 'Danh sách lớp biên chế kèm học viên',
            content: {
                'application/json': {
                    schema: z.array(z.any()), // Bạn có thể thay bằng schema chi tiết nếu muốn strict hơn
                },
            },
        },
        400: {
            description: 'Bad request',
        },
    },
    handler: async ({ query, res }: any) => {
        try {
            const fixedClasses = await fixedClassService.getFixedClassWithStudents(query.trainingCourseId);
            return res.status(200).json(fixedClasses);
        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: 'Không thể lấy danh sách lớp biên chế' });
        }
    },
});

export default
    {
        uploadExcelCreateFixedClass,
        classDivision,
        getFixedClassList
    }