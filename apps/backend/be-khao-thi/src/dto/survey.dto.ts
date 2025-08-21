import { z } from '@hono/zod-openapi'

export const surveyReportTable = z.object({
    stt: z.number().describe('Số thứ tự'),
    cDoituong: z.string().describe('Tiêu đề khảo sát'),
    cPhatRa: z.string().describe('Phát ra'),
    cThuVao: z.string().describe('Thu vào'),
    cGhiChu: z.string().describe('Ghi chú'),
})

export const ParticipationByTypeResponseSchema = z
    .object({
        surveyId: z.string().openapi({
            description: 'ID của cuộc khảo sát được thống kê.',
            example: 'svy-abc-123',
        }),
        totalParticipants: z.number().int().openapi({
            description: 'Tổng số sinh viên đã tham gia.',
            example: 520,
        }),
        statistics: z
            .array(
                z.object({
                    studentType: z.string().openapi({
                        description: 'Tên loại hình sinh viên.',
                        example: 'Sinh viên chính quy',
                    }),
                    participantCount: z.number().int().openapi({
                        description: 'Số lượng sinh viên thuộc loại hình này đã tham gia.',
                        example: 350,
                    }),
                })
            )
            .openapi('ParticipationStatistics'),
    })
    .openapi('ParticipationByTypeResponse')

export const SurveyStatisticsBySemesterResponseSchema = z
    .object({
        semesterId: z.string().openapi({
            description: 'ID của học kỳ được thống kê.',
            example: 'HK1-2425',
        }),
        semesterName: z.string().openapi({
            description: 'Tên đầy đủ của học kỳ.',
            example: 'Học kỳ 1 năm học 2024-2025',
        }),
        totalSurveyCount: z.number().int().openapi({
            description: 'Tổng số cuộc khảo sát trong học kỳ này.',
            example: 22,
        }),
        details: z
            .array(
                z.object({
                    surveyType: z.string().openapi({
                        description: 'Tên của loại khảo sát.',
                        example: 'Khảo sát chất lượng môn học',
                    }),
                    count: z.number().int().openapi({
                        description: 'Số lượng khảo sát thuộc loại này.',
                        example: 15,
                    }),
                })
            )
            .openapi('SurveyTypeDetails'),
    })
    .openapi('SurveyStatisticsBySemesterResponse')

const DepartmentSchema = z.object({
    id: z.string().openapi({ example: 'BM_CNPM' }),
    departmentName: z.string().openapi({ example: 'Bộ môn Công nghệ phần mềm' }),
    lecturerCount: z.number().int().openapi({ example: 15 }),
})

const FacultySchema = z.object({
    id: z.string().openapi({ example: 'K_CNTT' }),
    facultyName: z.string().openapi({ example: 'Khoa Công nghệ thông tin' }),
    totalLecturersInFaculty: z.number().int().openapi({ example: 40 }),
    departments: z.array(DepartmentSchema),
})

export const FacultyStatisticsResponseSchema = z
    .object({
        surveyId: z.string().openapi({
            description: 'ID của cuộc khảo sát được thống kê.',
            example: 'svy-lecturer-fall-2024',
        }),
        parentUnitInfo: z
            .object({
                id: z.string().openapi({ example: 'D_CNTT' }),
                name: z.string().openapi({ example: 'Hoc vien ky thuat quan su' }),
            })
            .openapi('ParentUnitInfo'),
        totalSurveyedLecturersInUnit: z.number().int().openapi({
            description: 'Tổng số giảng viên được khảo sát trong đơn vị cha.',
            example: 75,
        }),
        statisticsByFaculty: z
            .array(FacultySchema) // Top-level bây giờ là một mảng các Khoa
            .openapi('StatisticsByFaculty'),
    })
    .openapi('FacultyStatisticsResponse')
