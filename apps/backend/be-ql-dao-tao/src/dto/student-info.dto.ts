import { z } from '@hono/zod-openapi'

export const StudentInfo = z
    .object({
        id: z.string().describe('id của HV/SV'),
        stt: z.number().describe('STT'),
        name: z.string().describe('Họ tên'),
        code: z.string().describe('Mã sinh viên'),
        birth: z.string().describe('Ngày sinh'),
        hometown: z.string().describe('Quê quán'),
    })
    .openapi('StudentInfo')

export const StudentTemplateData = z.object({
    date: z.string().describe('Ngày'),
    month: z.string().describe('Tháng'),
    year: z.number().describe('Năm'),
    className: z.string().describe('Tên lớp'),
    student: z.array(StudentInfo).describe('Danh sách sinh viên'),
})

export type StudentInfo = z.infer<typeof StudentInfo>
export type StudentTemplateData = z.infer<typeof StudentTemplateData>
