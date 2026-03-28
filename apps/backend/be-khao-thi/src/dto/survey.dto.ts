import { z } from "@hono/zod-openapi"

export const surveyReportTable = z.object({
  stt: z.number().describe("Số thứ tự"),
  cDoituong: z.string().describe("Tiêu đề khảo sát"),
  cPhatRa: z.string().describe("Phát ra"),
  cThuVao: z.string().describe("Thu vào"),
  cGhiChu: z.string().describe("Ghi chú"),
})

export const ParticipationByTypeResponseSchema = z
  .object({
    surveyId: z.string().openapi({
      description: "ID của cuộc khảo sát được thống kê.",
      example: "svy-abc-123",
    }),
    totalParticipants: z.number().int().openapi({
      description: "Tổng số sinh viên đã tham gia.",
      example: 520,
    }),
    statistics: z
      .array(
        z.object({
          studentType: z.string().openapi({
            description: "Tên loại hình sinh viên.",
            example: "Sinh viên chính quy",
          }),
          participantCount: z.number().int().openapi({
            description: "Số lượng sinh viên thuộc loại hình này đã tham gia.",
            example: 350,
          }),
        })
      )
      .openapi("ParticipationStatistics"),
  })
  .openapi("ParticipationByTypeResponse")

export const SurveyStatisticsBySemesterResponseSchema = z
  .object({
    semesterId: z.string().openapi({
      description: "ID của học kỳ được thống kê.",
      example: "HK1-2425",
    }),
    semesterName: z.string().openapi({
      description: "Tên đầy đủ của học kỳ.",
      example: "Học kỳ 1 năm học 2024-2025",
    }),
    totalSurveyCount: z.number().int().openapi({
      description: "Tổng số cuộc khảo sát trong học kỳ này.",
      example: 22,
    }),
    details: z
      .array(
        z.object({
          surveyType: z.string().openapi({
            description: "Tên của loại khảo sát.",
            example: "Khảo sát chất lượng môn học",
          }),
          count: z.number().int().openapi({
            description: "Số lượng khảo sát thuộc loại này.",
            example: 15,
          }),
        })
      )
      .openapi("SurveyTypeDetails"),
  })
  .openapi("SurveyStatisticsBySemesterResponse")

const DepartmentSchema = z.object({
  id: z.string().openapi({ example: "BM_CNPM" }),
  organizationName: z.string().openapi({ example: "Bộ môn Công nghệ phần mềm" }),
  lecturerSurveyCount: z.number().int().openapi({ example: 15 }),
})

const FacultySchema = z.object({
  id: z.string().openapi({ example: "K_CNTT" }),
  organizationName: z.string().openapi({ example: "Khoa Công nghệ thông tin" }),
  lecturerSurveyCount: z.number().int().openapi({ example: 40 }),
  departments: z.array(DepartmentSchema),
})

export const FacultyStatisticsResponseSchema = z
  .object({
    surveyId: z.string().openapi({
      description: "ID của cuộc khảo sát được thống kê.",
      example: "svy-lecturer-fall-2024",
    }),
    parentUnitInfo: z
      .object({
        id: z.string().openapi({ example: "MTA" }),
        name: z.string().openapi({ example: "Hoc vien ky thuat quan su" }),
      })
      .openapi("ParentUnitInfo"),
    lecturerSurveyCount: z.number().int().openapi({
      description: "Tổng số giảng viên được khảo sát trong đơn vị cha.",
      example: 75,
    }),
    statisticsByFaculty: z.array(FacultySchema).openapi("StatisticsByFaculty"),
  })
  .openapi("FacultyStatisticsResponse")

export const AnswerStatisticSchema = z.object({
  level: z.number().int().openapi({
    description: "Mã số của mức độ (0-4).",
    example: 1,
  }),
  levelName: z.string().openapi({
    description: "Tên đầy đủ của mức độ.",
    example: "Rất hài lòng",
  }),
  count: z.number().int().openapi({
    description: "Số lượng người chọn mức độ này.",
    example: 150,
  }),
  percentage: z.number().openapi({
    description: "Tỷ lệ phần trăm trên tổng số câu trả lời.",
    example: 53.57,
  }),
})

export const AnswerStatisticsResponseSchema = z
  .object({
    surveyId: z.string().openapi({
      description: "ID của cuộc khảo sát.",
      example: "svy-course-quality-fall24",
    }),
    totalAnswers: z.number().int().openapi({
      description: "Tổng số câu trả lời hợp lệ cho câu hỏi này.",
      example: 280,
    }),
    statistics: z.array(AnswerStatisticSchema).openapi("AnswerStatistics"),
  })
  .openapi("AnswerStatisticsResponse")

const SimplifiedStatisticsSchema = z.record(z.string(), z.number().int()).openapi({
  description: "Đối tượng với key là tên Khoa và value là số lượng.",
  example: {
    "Khoa Công nghệ thông tin": 2,
    "Khoa Kinh tế": 2,
    "Khoa Ngoại ngữ": 1,
  },
})

export const SimplifiedResponseSchema = z
  .object({
    surveyId: z.string().openapi({ example: "svy-annual-review-2025" }),
    universityName: z.string().openapi({ example: "Học viện Kỹ thuật Quân sự" }),
    statistics: SimplifiedStatisticsSchema,
  })
  .openapi("SimplifiedFacultyDissatisfiedResponse")

export const HourlyAggregateDataPointSchema = z.object({
  hour: z.number().int().min(0).max(23).openapi({
    description: "Khung giờ trong ngày (từ 0 đến 23).",
    example: 21,
  }),
  totalCompletionCount: z.number().int().openapi({
    description: "Tổng số lượt hoàn thành trong khung giờ này trên tất cả các ngày.",
    example: 155,
  }),
  averageCompletionCount: z.number().openapi({
    description: "Số lượt hoàn thành trung bình cho khung giờ này mỗi ngày.",
    example: 38.75,
  }),
})

export const HourlyAggregateResponseSchema = z
  .object({
    surveyId: z.string().openapi({
      description: "ID của cuộc khảo sát.",
      example: "svy-engagement-q4-2024",
    }),
    totalCompletions: z.number().int().openapi({
      description: "Tổng số lượt hoàn thành trong toàn bộ khảo sát.",
      example: 850,
    }),
    surveyDurationInDays: z.number().int().openapi({
      description: "Tổng số ngày khảo sát đã diễn ra (dựa trên dữ liệu).",
      example: 4,
    }),
    hourlyAggregates: z.array(HourlyAggregateDataPointSchema).openapi("HourlyAggregates"),
  })
  .openapi("HourlyAggregateResponse")
