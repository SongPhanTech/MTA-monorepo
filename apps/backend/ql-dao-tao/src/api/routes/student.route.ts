import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import * as models from '@workspace/db/zod/models'

const GroupSchema = models.GroupScalarSchema.openapi('Group')

const uploadExcel = createRoute({
    operationId: 'uploadExcel',
    path: '/student/upload-excel',
    method: 'post',
    description: 
        'Tải danh sách học viên từ file Excel \n\n [type] là mã của loại đối tượng cần tạo, lấy trong bảng UserType',
    tags: ['Student'],
    summary: 'Upload Excel file',
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
    uploadExcel,
}