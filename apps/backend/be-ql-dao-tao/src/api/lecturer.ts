import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import dayjs from "dayjs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."

const app = new OpenAPIHono({ strict: false })

const exportLecturerProfile = createRoute({
  operationId: "exportLecturerProfile",
  tags: ["Lecturer"],
  path: "/export-lecturer-profile",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            isSelectAll: z.boolean().optional(),
            lecturerIds: z.string().uuid().array().optional(),
            excludedIds: z.string().uuid().array().optional(),
            filters: z
              .object({
                code: z.string().optional(),
                name: z.string().optional(),
                dateOfBirth: z.string().array().optional(),
                academicRankType: z.string().uuid().array().optional(),
                academicDegreeType: z.string().uuid().array().optional(),
                organization: z.string().uuid().array().optional(),
                gender: z.string().uuid().array().optional(),
                rankId: z.string().uuid().array().optional(),
                officerNumber: z.string().optional(),
                lecturerType: z.string().uuid().array().optional(),
                idCardNumber: z.string().optional(),
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Export list of lecturer profile as .xlsx",
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
          schema: z.object({
            message: z.string(),
          }),
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
