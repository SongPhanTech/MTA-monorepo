import { z } from '@hono/zod-openapi'

export const surveyReportTable = z.object({
    stt: z.number().describe('Số thứ tự'),
    cDoituong: z.string().describe('Tiêu đề khảo sát'),
    cPhatRa: z.string().describe('Phát ra'),
    cThuVao: z.string().describe('Thu vào'),
    cGhiChu: z.string().describe('Ghi chú'),
})
