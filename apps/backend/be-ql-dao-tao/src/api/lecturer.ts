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
            lecturerIds: z.string().array().nullish(),
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
  const { lecturerIds } = c.req.valid("json")

  const lecturers = await prisma.lecturer.findMany({
    where: {
      ...(lecturerIds?.length ? { id: { in: lecturerIds } } : {}),
    },
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
  })

  const data = lecturers.map((lecturer, idx) => ({
    no: idx + 1,
    ...lecturer,
    fullname: lecturer.userProfile?.fullname,
    dateOfBirth: lecturer.userProfile?.dateOfBirth
      ? `'${dayjs(lecturer.userProfile.dateOfBirth).format("DD/MM/YYYY")}`
      : "",
    gender: lecturer.userProfile?.gender?.sTen,
    type: lecturer.lecturerType.name,
    academicRank: lecturer.userProfile?.academicRankType?.sTen,
    academicDegree: lecturer.userProfile?.academicDegreeType?.sTen,
    facultyOrganization: lecturer.organization.sTen,
    departmentOrganization: lecturer.organization.sTen,
    address: lecturer.userProfile?.currentAddress,
    phoneNumber: lecturer.userProfile?.phoneNumber,
    email: lecturer.userProfile?.email,
    idCardNumber: lecturer.userProfile?.idCardNumber,
    note: lecturer.description,
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
