import { ThesisType } from "@workspace/db/client"
import dayjs from "dayjs"
import { prisma } from ".."
import { renderLuanVanXlsxFromItems } from "./thesis-excel-render.service"
import { getSupervisorName, tenDoiTuong } from "./thesis-payment.helpers"
import { patchPhuLucDanhSachLuanVanTemplate } from "../utils/patch-phu-luc-ds-luan-van-template"

const TEMPLATE_PATH = "PhuLucDanhSachLuanVan.xlsx"
const FILE_NAME = "PhuLucDsLuanVan.xlsx"

const expertInclude = {
  academicRankType: true,
  academicDegreeType: true,
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
} as const

export type ExportPhuLucDanhSachLuanVanParams = {
  thesisSessionId: string
  trainingCourseIds?: string[]
  fixedClassIds?: string[]
  organizationId?: string
}

export type ExportPhuLucDanhSachLuanVanResult = {
  buffer: Buffer
  fileName: string
}

type ThesisRow = {
  hovatenhocvien: string
  ngaysinh: string
  doituongdaotao: string
  khoa: string
  tendetai: string
  gvhd1: string
  gvhd2: string
  isThesis: string
  language: string
}

type MajorGroup = {
  majorName: string
  specializationName: string
  thesisProject: ThesisRow[]
}

async function resolveTrainingCourseIds(
  thesisSessionId: string,
  trainingCourseIds?: string[]
): Promise<string[]> {
  const selectedIds = trainingCourseIds?.filter(Boolean) ?? []
  if (selectedIds.length) return selectedIds

  const session = await prisma.thesisSession.findFirst({
    where: { id: thesisSessionId, deletedAt: null },
    select: {
      trainingCourses: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  })

  return session?.trainingCourses.map((course) => course.id) ?? []
}

async function resolveFixedClassIds(
  thesisSessionId: string,
  trainingCourseIds?: string[],
  fixedClassIds?: string[]
): Promise<string[]> {
  const courseIds = await resolveTrainingCourseIds(thesisSessionId, trainingCourseIds)
  if (!courseIds.length) return []

  const selectedClassIds = fixedClassIds?.filter(Boolean) ?? []
  if (selectedClassIds.length) {
    const classes = await prisma.fixedClass.findMany({
      where: {
        deletedAt: null,
        id: { in: selectedClassIds },
        trainingCourseId: { in: courseIds },
      },
      select: { id: true },
    })
    return classes.map((item) => item.id)
  }

  const classes = await prisma.fixedClass.findMany({
    where: {
      deletedAt: null,
      trainingCourseId: { in: courseIds },
    },
    select: { id: true },
  })
  return classes.map((item) => item.id)
}

function buildPhuLucProjectWhere(
  thesisSessionId: string,
  fixedClassIds: string[],
  organizationId?: string
) {
  return {
    deletedAt: null,
    thesisType: ThesisType.THESIS,
    thesisSessionId,
    ...(organizationId ? { organizationId } : {}),
    registrations: {
      some: {
        deletedAt: null,
        student: {
          fixedClassId: { in: fixedClassIds },
        },
      },
    },
  } as const
}

async function loadProjectsForPhuLucExport(
  thesisSessionId: string,
  fixedClassIds: string[],
  organizationId?: string
) {
  return prisma.thesisProject.findMany({
    where: buildPhuLucProjectWhere(thesisSessionId, fixedClassIds, organizationId),
    include: {
      thesisSession: {
        select: {
          id: true,
          name: true,
          decisionNumber: true,
          decisionDate: true,
        },
      },
      supervisor: { include: expertInclude },
      coSupervisor: { include: expertInclude },
      registrations: {
        where: {
          deletedAt: null,
          student: {
            fixedClassId: { in: fixedClassIds },
          },
        },
        include: {
          student: {
            include: {
              userProfile: true,
              fixedClass: {
                include: {
                  trainingCourse: { include: { trainingObjectType: true } },
                  curriculumVersion: {
                    include: {
                      curriculum: {
                        include: {
                          trainingMajor: {
                            include: { trainingField: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

function buildMajorGroups(
  projects: Awaited<ReturnType<typeof loadProjectsForPhuLucExport>>
): MajorGroup[] {
  const majorMap = new Map<string, MajorGroup>()

  for (const thesisProject of projects) {
    for (const registration of thesisProject.registrations) {
      const student = registration.student
      if (!student) continue

      const majorName =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name || ""
      const specializationName =
        student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
      const groupKey = `${majorName}__${specializationName}`

      if (!majorMap.has(groupKey)) {
        majorMap.set(groupKey, {
          majorName: majorName || "Chưa có ngành",
          specializationName: specializationName || "Chưa có chuyên ngành",
          thesisProject: [],
        })
      }

      const doiTuong =
        student.fixedClass?.trainingCourse?.trainingObjectType?.type as keyof typeof tenDoiTuong

      majorMap.get(groupKey)?.thesisProject.push({
        hovatenhocvien: student.userProfile?.fullname || "",
        ngaysinh: student.userProfile?.dateOfBirth
          ? dayjs(student.userProfile.dateOfBirth).format("DD/MM/YYYY")
          : "",
        doituongdaotao: doiTuong ? (tenDoiTuong[doiTuong]?.shortname ?? "") : "",
        khoa: student.fixedClass?.trainingCourse?.name || "",
        tendetai: thesisProject.title || "",
        gvhd1: getSupervisorName(thesisProject.supervisor, true) || "",
        gvhd2: getSupervisorName(thesisProject.coSupervisor, true) || "",
        isThesis: thesisProject.type || "",
        language: (thesisProject.language || "").trim(),
      })
    }
  }

  return Array.from(majorMap.values())
}

function buildTemplateItems(
  groups: MajorGroup[],
  session: {
    name?: string | null
    decisionNumber?: string | null
    decisionDate?: Date | string | null
  } | null
) {
  const ngayQD = session?.decisionDate
    ? dayjs(session.decisionDate).format("DD/MM/YYYY")
    : ""
  const [ngay, thang, nam] = ngayQD.split("/")
  const totalStudents = groups.reduce((acc, group) => acc + group.thesisProject.length, 0)
  let stt = 1

  return groups.map((group, index) => ({
    dotxet: (session?.name || "").trim().toUpperCase(),
    soQD: session?.decisionNumber || "",
    ngay: ngay || "",
    thang: thang || "",
    nam: nam || "",
    groupTitle: `${index + 1} Ngành ${group.majorName} (${group.specializationName}) : ${group.thesisProject.length} học viên`,
    tongso:
      index === groups.length - 1 ? `(Tổng số: ${totalStudents} học viên)` : "",
    data: group.thesisProject.map((thesis) => ({
      stt: stt++,
      hovaten: `${thesis.hovatenhocvien}\nNS:${thesis.ngaysinh}\n${thesis.doituongdaotao}-${thesis.khoa}`,
      tendetai: thesis.tendetai,
      gvhd:
        thesis.gvhd1 && thesis.gvhd2
          ? `1. ${thesis.gvhd1}\n2. ${thesis.gvhd2}`
          : thesis.gvhd1 || thesis.gvhd2 || "",
      isThesis: thesis.isThesis,
      ghichu: thesis.language.trim().toLowerCase() === "tiếng việt" ? "" : thesis.language,
    })),
  }))
}

export async function exportPhuLucDanhSachLuanVan(
  params: ExportPhuLucDanhSachLuanVanParams
): Promise<ExportPhuLucDanhSachLuanVanResult> {
  const { thesisSessionId, trainingCourseIds, fixedClassIds, organizationId } = params

  if (!thesisSessionId) {
    throw new Error("Không xác định được đợt luận văn.")
  }

  const resolvedFixedClassIds = await resolveFixedClassIds(
    thesisSessionId,
    trainingCourseIds,
    fixedClassIds
  )
  if (!resolvedFixedClassIds.length) {
    throw new Error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
  }

  const projects = await loadProjectsForPhuLucExport(
    thesisSessionId,
    resolvedFixedClassIds,
    organizationId || undefined
  )
  if (!projects.length) {
    throw new Error("Không tìm thấy dữ liệu để xuất phụ lục danh sách luận văn")
  }

  const groups = buildMajorGroups(projects)
  if (!groups.length) {
    throw new Error("Không có dữ liệu để xuất phụ lục danh sách luận văn")
  }

  const items = buildTemplateItems(groups, projects[0]?.thesisSession ?? null)
  const buffer = await renderLuanVanXlsxFromItems({
    path: TEMPLATE_PATH,
    prefix: "mta/luan-van",
    items,
    prepareTemplate: patchPhuLucDanhSachLuanVanTemplate,
  })

  return { buffer, fileName: FILE_NAME }
}
