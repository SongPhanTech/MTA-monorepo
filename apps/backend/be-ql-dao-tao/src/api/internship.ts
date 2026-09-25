import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { getTemplateBuffer } from "@workspace/libs/server"
import { formatDateVn } from "@workspace/libs/timezone"
import ExcelJS from "exceljs"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."
import { fieldDesc } from "../dto/openapi-helpers"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import { excelSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"

const app = new OpenAPIHono({ strict: false })

const exportInternshipProfile = createRoute({
  operationId: "exportInternshipProfile",
  tags: ["Thực tập"],
  path: "/export-internship-profile",
  method: "post",
  summary: "Xuất danh sách thực tập",
  description: `Xuất Excel hồ sơ thực tập học viên.

**Bảng dữ liệu nguồn:** StudentInternship, StudentSubjectScore, Lecturer, UserProfile.

**Tham số:** internshipIds — danh sách ID (null/empty = tất cả).`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              internshipIds: z
                .string()
                .array()
                .nullish()
                .openapi(fieldDesc("ID bản ghi thực tập; bỏ trống = xuất tất cả.")),
            })
            .openapi("ExportInternshipProfileRequest"),
        },
      },
    },
  },
  responses: {
    ...excelSuccess("File Excel danh sách thực tập"),
    ...standardErrorResponses(),
    400: {
      description: "Tham số không hợp lệ",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
    },
  },
})

app.openapi(exportInternshipProfile, async (c) => {
  const { internshipIds } = c.req.valid("json")

  const internships = await prisma.studentInternship.findMany({
    where: {
      ...(internshipIds?.length ? { id: { in: internshipIds } } : {}),
    },
    include: {
      studentSubjectScore: {
        include: {
          student: {
            include: {
              userProfile: {
                include: {
                  gender: true,
                },
              },
            },
          },
          subjectClass: true,
        },
      },
      supervisor: {
        include: {
          academicDegreeType: true,
          academicRankType: true,
          expert: {
            include: {
              lecturer: {
                include: {
                  userProfile: {
                    include: {
                      academicRankType: true,
                      academicDegreeType: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      coSupervisor: {
        include: {
          academicDegreeType: true,
          academicRankType: true,
          expert: {
            include: {
              lecturer: {
                include: {
                  userProfile: {
                    include: {
                      academicRankType: true,
                      academicDegreeType: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const formatSupervisor = (
    supervisor: (typeof internships)[number]["supervisor"] | (typeof internships)[number]["coSupervisor"]
  ) => {
    const userProfile = supervisor?.expert?.lecturer?.userProfile
    return [
      userProfile?.academicRankType?.sMa ?? supervisor?.academicRankType?.sMa,
      userProfile?.academicDegreeType?.sMa ?? supervisor?.academicDegreeType?.sMa,
      userProfile?.fullname ?? supervisor?.name,
    ]
      .filter(Boolean)
      .join(". ")
  }

  const data = internships.map((internship, idx) => ({
    no: idx + 1,
    code: internship.studentSubjectScore?.student?.userProfile?.code || "",
    fullname: internship.studentSubjectScore?.student?.userProfile?.fullname || "",
    dateOfBirth: internship.studentSubjectScore?.student?.userProfile?.dateOfBirth
      ? formatDateVn(internship.studentSubjectScore.student.userProfile.dateOfBirth)
      : "",
    subjectClassCode: internship.studentSubjectScore?.subjectClass?.code || "",
    subjectClassName: internship.studentSubjectScore?.subjectClass?.name || "",
    gender: internship.studentSubjectScore?.student?.userProfile?.gender?.sTen || "",
    institution:
      internship.institution && internship.unit
        ? `${internship.institution} / ${internship.unit}`
        : internship.unit || internship.institution || "",
    address: internship.address || "",
    internshipContent: internship.internshipContent || "",
    supervisor: formatSupervisor(internship.supervisor),
    coSupervisor: formatSupervisor(internship.coSupervisor),
    startDate: internship.startDate ? formatDateVn(internship.startDate) : "",
    endDate: internship.endDate ? formatDateVn(internship.endDate) : "",
    reportDate: internship.reportDate ? formatDateVn(internship.reportDate) : "",
    finalScore: internship.studentSubjectScore?.finalScore?.toString() || "",
  }))

  const buffer = await getTemplateBuffer(prisma, "danh_sach_thuc_tap")

  const template = new XlsxTemplate(buffer)

  template.substitute(1, { data })

  const templateResult = await template.generate({ type: "nodebuffer" })

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateResult)
  const worksheet = workbook.getWorksheet(1)

  if (worksheet) {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.protection = { locked: false }
      })
    })

    const scoreColumnIndex = 16
    worksheet.getColumn(scoreColumnIndex).eachCell((cell) => {
      cell.protection = { locked: true }
    })

    await worksheet.protect("", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
    })
  }

  const result = await workbook.xlsx.writeBuffer()

  const fileName = "danh_sach_thuc_tap.xlsx"
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return c.body(result, 200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": disposition,
  })
})

export default app
