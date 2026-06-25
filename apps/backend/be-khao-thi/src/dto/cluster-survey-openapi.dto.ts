import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const ClusterSurveyDepartmentInfoSchema = z
  .object({
    surveyCount: z.number().openapi(fieldDesc("Số đợt khảo sát trong cụm (theo đơn vị).")),
    completedSurveyCount: z
      .number()
      .openapi(fieldDesc("Số khảo sát đã có ít nhất một phiên hoàn thành.")),
    listStudentCount: z.number().openapi(fieldDesc("Tổng số học viên trong các lớp HP liên quan.")),
    studentCompletedSurveyCount: z
      .number()
      .openapi(fieldDesc("Số phiên khảo sát học viên đã hoàn thành.")),
  })
  .openapi("ClusterSurveyDepartmentInfo")

export const ClusterSurveyDepartmentInfoResponseSchema = z
  .object({
    data: ClusterSurveyDepartmentInfoSchema,
  })
  .openapi("ClusterSurveyDepartmentInfoResponse")
