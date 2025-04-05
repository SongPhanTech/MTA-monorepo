import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const uploadExcelCreateUserProfile = createRoute({
    operationId: 'uploadExcelCreateUserProfile',
    path: '/UserProfile/upload-excel-create-user-profile',
    method: 'post',
    description: 
        'Thêm mới danh sách học viên/sinh viên \n\n [type] là mã của loại đối tượng cần tạo, lấy trong bảng UserType',
    tags: ['UserProfile'],
    summary: 'Upload Excel Create UserProfile',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any(), // file upload
                        type: z.string() // loại thông tin
                    }).openapi('ExcelUpload'),
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

const uploadExcelUpdateUserProfile = createRoute({
    operationId: 'uploadExcelUpdateUserProfile',
    path: '/UserProfile/upload-excel-update-user-profile',
    method: 'post',
    description: 
        'Cập nhật thông tin học viên/sinh viên\n\n [type] là mã của loại đối tượng cần tạo, lấy trong bảng UserType',
    tags: ['UserProfile'],
    summary: 'Upload Excel Update UserProfile',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any(), // file upload
                        type: z.string() // loại thông tin
                    }).openapi('ExcelUpload'),
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

export default {
    uploadExcelCreateUserProfile,
    uploadExcelUpdateUserProfile
}