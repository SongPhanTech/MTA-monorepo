// import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
// import { getBufferFromUrl } from '../services/template.service'

// const uploadExcelCreateFixedClass = createRoute({
//     operationId: 'uploadExcelCreateFixedClass',
//     path: '/FixedClass/upload-excel-create-fixed-class',
//     method: 'post',
//     description:
//         'Thêm mới danh sách lớp quản lý \n\n [trainingCourseId] là mã của khoá học, lấy trong bảng TrainingCourse',
//     tags: ['FixedClass'],
//     summary: 'Upload Excel Create FixedClass',
//     request: {
//         body: {
//             content: {
//                 'multipart/form-data': {
//                     schema: z
//                         .object({
//                             file: z.instanceof(File).openapi({
//                                 type: 'string',
//                                 format: 'binary',
//                             }),
//                             trainingCourseId: z.string(), // loại thông tin
//                         })
//                         .openapi('uploadExcelCreateFixedClass'),
//                 },
//             },
//         },
//     },
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: z.array(z.any()),
//                 },
//             },
//             description: 'Tải danh sách thành công',
//         },
//         400: {
//             description: 'Invalid file upload',
//         },
//     },
// })

// const app = new OpenAPIHono({ strict: false })
// app.openapi(uploadExcelCreateFixedClass, async (c) => {
//     const data = await getBufferFromUrl(c)
//     return data
// })

// export default app
