import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"

const app = new OpenAPIHono({ strict: false })

const exportLecturerProfile = createRoute({
  operationId: "exportLecturerProfile",
  tags: ["Giảng viên"],
  path: "/export-lecturer-profile",
  method: "post",
  summary: "Xuất hồ sơ giảng viên",
  description: `Xuất Excel danh sách giảng viên theo bộ lọc hoặc danh sách ID.

**Bảng dữ liệu nguồn:** Lecturer, UserProfile.

**Tham số:** isSelectAll, lecturerIds, excludedIds, filters.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              isSelectAll: z.boolean().optional().openapi(fieldDesc("Chọn tất cả theo filters.")),
              lecturerIds: z
                .string()
                .uuid()
                .array()
                .optional()
                .openapi(fieldDesc("Danh sách ID giảng viên xuất.")),
              excludedIds: z
                .string()
                .uuid()
                .array()
                .optional()
                .openapi(fieldDesc("ID loại trừ khi isSelectAll.")),
              filters: z
                .object({
                  code: z.string().optional().openapi(fieldDesc("Lọc mã GV.")),
                  name: z.string().optional().openapi(fieldDesc("Lọc họ tên.")),
                  dateOfBirth: z.string().array().optional().openapi(fieldDesc("Khoảng ngày sinh.")),
                  academicRankType: z
                    .string()
                    .uuid()
                    .array()
                    .optional()
                    .openapi(fieldDesc("Học hàm.")),
                  academicDegreeType: z
                    .string()
                    .uuid()
                    .array()
                    .optional()
                    .openapi(fieldDesc("Học vị.")),
                  organization: z
                    .string()
                    .uuid()
                    .array()
                    .optional()
                    .openapi(fieldDesc("Đơn vị.")),
                  gender: z.string().uuid().array().optional().openapi(fieldDesc("Giới tính.")),
                  rankId: z.string().uuid().array().optional().openapi(fieldDesc("Cấp bậc.")),
                  officerNumber: z.string().optional().openapi(fieldDesc("Số hiệu sĩ quan.")),
                  lecturerType: z
                    .string()
                    .uuid()
                    .array()
                    .optional()
                    .openapi(fieldDesc("Loại giảng viên.")),
                  idCardNumber: z.string().optional().openapi(fieldDesc("CCCD.")),
                })
                .optional()
                .openapi(fieldDesc("Bộ lọc khi isSelectAll = true.")),
            })
            .openapi("ExportLecturerProfileRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "File Excel hồ sơ giảng viên",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportLecturerProfile, async (c) => {
  const { isSelectAll, lecturerIds, excludedIds, filters } = c.req.valid("json")

  let where: any = { deletedAt: null }

  if (isSelectAll) {
    if (filters) {
      where = {
        ...where,
        ...(filters.code
          ? {
              code: {
                contains: filters.code,
                mode: "insensitive",
              },
            }
          : {}),
        ...(filters.name
          ? {
              userProfile: {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(filters.idCardNumber
          ? {
              userProfile: {
                idCardNumber: {
                  contains: filters.idCardNumber,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(filters.gender?.length
          ? {
              userProfile: {
                genderId: {
                  in: filters.gender,
                },
              },
            }
          : {}),
        ...(filters.dateOfBirth?.length === 2
          ? {
              userProfile: {
                dateOfBirth: {
                  gte: dayjs(filters.dateOfBirth[0], "DD/MM/YYYY").toDate(),
                  lte: dayjs(filters.dateOfBirth[1], "DD/MM/YYYY").toDate(),
                },
              },
            }
          : {}),
        ...(filters.officerNumber
          ? {
              userProfile: {
                officerNumber: {
                  contains: filters.officerNumber,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(filters.academicRankType?.length
          ? {
              userProfile: {
                academicRankTypeId: {
                  in: filters.academicRankType,
                },
              },
            }
          : {}),
        ...(filters.academicDegreeType?.length
          ? {
              userProfile: {
                academicDegreeTypeId: {
                  in: filters.academicDegreeType,
                },
              },
            }
          : {}),
        ...(filters.rankId?.length
          ? {
              userProfile: {
                rankId: {
                  in: filters.rankId,
                },
              },
            }
          : {}),
        ...(filters.lecturerType?.length
          ? {
              lecturerTypeId: {
                in: filters.lecturerType,
              },
            }
          : {}),
        ...(filters.organization?.length
          ? {
              organizationId: {
                in: filters.organization,
              },
            }
          : {}),
      }
    }

    if (excludedIds?.length) {
      where = {
        ...where,
        id: { notIn: excludedIds },
      }
    }
  } else {
    where = {
      ...where,
      id: { in: lecturerIds || [] },
    }
  }

  const lecturers = await prisma.lecturer.findMany({
    where,
    include: {
      lecturerType: true,
      organization: true,
      userProfile: {
        include: {
          gender: true,
          rank: true,
          academicDegreeType: true,
          academicRankType: true,
        },
      },
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
  })

  const data = lecturers.map((lecturer, idx) => ({
    no: idx + 1,
    ...lecturer,
    fullname: lecturer.userProfile?.fullname,
    dateOfBirth: lecturer.userProfile?.dateOfBirth
      ? `'${dayjs(lecturer.userProfile.dateOfBirth).format("DD/MM/YYYY")}`
      : "",
    gender: lecturer.userProfile?.gender?.sTen,
    type: lecturer.lecturerType?.name || "",
    academicRank: lecturer.userProfile?.academicRankType?.sTen || "",
    academicDegree: lecturer.userProfile?.academicDegreeType?.sTen || "",
    facultyOrganization: lecturer.organization?.sTen || "",
    departmentOrganization: lecturer.organization?.sTen || "",
    address: lecturer.userProfile?.currentAddress || "",
    phoneNumber: lecturer.userProfile?.phoneNumber || "",
    email: lecturer.userProfile?.email || "",
    idCardNumber: lecturer.userProfile?.idCardNumber || "",
    note: lecturer.description || "",
  }))

  const buffer = await getTemplateBuffer(prisma, "DANH_SACH_GV")

  const template = new XlsxTemplate(buffer)

  template.substitute(1, { data })

  const result = await template.generate({ type: "arraybuffer" })

  const fileName = "danh_sach_GV.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
