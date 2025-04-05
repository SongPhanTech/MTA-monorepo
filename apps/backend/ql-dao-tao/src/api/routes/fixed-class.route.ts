import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'


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
    tags: ['UserProfile'],
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

export default 
{
    uploadExcelCreateFixedClass,
    classDivision
}