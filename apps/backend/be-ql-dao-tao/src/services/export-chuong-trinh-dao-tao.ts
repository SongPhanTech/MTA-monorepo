import { HTTPException } from "hono/http-exception"
import { $Enums } from "@workspace/db"
import { formatNgayIn, formatThangIn, nowVn } from "@workspace/libs/timezone"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"
import { prisma } from ".."
import { loadTemplateBuffer } from "./render-xlsx-template"

export const CtdtExportMau = {
  CTTK_DAI_HAN: "cttk-dai-han",
  CTTK_NGAN_HAN: "cttk-ngan-han",
  KHTK_NGHIEN_CUU: "khtk-nghien-cuu",
  KHTK_UNG_DUNG: "khtk-ung-dung",
} as const

export type CtdtExportMau = (typeof CtdtExportMau)[keyof typeof CtdtExportMau]

const TEMPLATE_BY_MAU: Record<CtdtExportMau, string> = {
  "cttk-dai-han": "/lms/templates/chuong-trinh-dao-tao/CTTK-dai-han.docx",
  "cttk-ngan-han": "/lms/templates/chuong-trinh-dao-tao/CTTK-ngan-han.docx",
  "khtk-nghien-cuu": "/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-nghien-cuu.docx",
  "khtk-ung-dung": "/mta/template/chuong-trinh-dao-tao/KHTK-ding-huong-ung-dung.docx",
}

const FILE_PREFIX_BY_MAU: Record<CtdtExportMau, string> = {
  "cttk-dai-han": "CTTK-dai-han",
  "cttk-ngan-han": "CTTK-ngan-han",
  "khtk-nghien-cuu": "KHTK-ding-huong-nghien-cuu",
  "khtk-ung-dung": "KHTK-ding-huong-ung-dung",
}

function firstCase(value: string | null | undefined): string {
  if (!value) return ""
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function trainingObjectTypeLabel(type?: $Enums.TrainingObjectTypes | null): string {
  switch (type) {
    case $Enums.TrainingObjectTypes.CIVILIAN:
      return "Dân sự"
    case $Enums.TrainingObjectTypes.INTERNATIONAL_MILITARY:
      return "Quốc tế"
    default:
      return "Quân sự"
  }
}

export async function exportChuongTrinhDaoTao({
  fixedClassId,
  mau,
}: {
  fixedClassId: string
  mau: CtdtExportMau
}) {
  if (!fixedClassId) {
    throw new HTTPException(400, { message: "Thiếu ID lớp quản lý" })
  }

  const fixedClass = await prisma.fixedClass.findUnique({
    where: { id: fixedClassId },
    select: {
      name: true,
      _count: {
        select: {
          students: {
            where: { active: true, status: $Enums.StudentStatus.ENROLLED },
          },
        },
      },
      trainingCourse: {
        select: {
          name: true,
          trainingObjectType: { select: { type: true } },
        },
      },
      curriculumVersion: {
        select: {
          name: true,
          curriculum: {
            select: {
              trainingMajor: { select: { name: true, code: true } },
            },
          },
          trainingBlocks: {
            orderBy: { priority: "asc" },
            select: {
              trainingBlock: { select: { name: true } },
              subjects: {
                orderBy: { semester: "asc" },
                select: {
                  semester: true,
                  subject: {
                    select: {
                      name: true,
                      credit: true,
                      period: true,
                      managementOrganization: { select: { sMa: true } },
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

  if (!fixedClass) {
    throw new HTTPException(404, { message: "Không tìm thấy lớp quản lý" })
  }

  const subjects = (fixedClass.curriculumVersion?.trainingBlocks ?? []).flatMap((block) =>
    block.subjects.map((e) => ({
      semester: e.semester,
      subject: e.subject,
      blockName: block.trainingBlock?.name,
    }))
  )

  const periodOf = (semester: number) =>
    subjects.reduce((total, curr) => total + (curr.semester === semester ? curr.subject.period || 0 : 0), 0)

  const today = nowVn()
  const monHoc = subjects.map((e, index) => ({
    tt: index + 1,
    ten_mon: e.subject.name,
    trong_so: e.subject.credit,
    so_tiet: e.subject.period,
    dv_phu_trach: e.subject.managementOrganization?.sMa ?? "",
    ghi_chu: firstCase(e.blockName),
    ky_1: e.semester === 1 && e.subject.period ? e.subject.period : "",
    ky_2: e.semester === 2 && e.subject.period ? e.subject.period : "",
    ky_3: e.semester === 3 && e.subject.period ? e.subject.period : "",
    ky_4: e.semester === 4 && e.subject.period ? e.subject.period : "",
  }))

  const data = {
    d: formatNgayIn(today.date()),
    m: formatThangIn(today.month() + 1),
    y: today.format("YYYY"),
    TEN_CTDT: (fixedClass.curriculumVersion?.name ?? "").toUpperCase(),
    KHOA_HOC: (fixedClass.trainingCourse?.name ?? "").toUpperCase(),
    lop_quan_ly: fixedClass.name,
    ten_lop: fixedClass.name,
    HE: trainingObjectTypeLabel(fixedClass.trainingCourse?.trainingObjectType?.type).toUpperCase(),
    chuyen_nganh: fixedClass.curriculumVersion?.curriculum?.trainingMajor?.name ?? "",
    ma_nganh: fixedClass.curriculumVersion?.curriculum?.trainingMajor?.code ?? "",
    quan_so: fixedClass._count.students,
    mon_hoc: monHoc,
    tong_trong_so: subjects.reduce((total, curr) => total + (curr.subject.credit || 0), 0),
    tong_so_tiet: subjects.reduce((total, curr) => total + (curr.subject.period || 0), 0),
    tong_ky_1: periodOf(1),
    tong_ky_2: periodOf(2),
    tong_ky_3: periodOf(3),
    tong_ky_4: periodOf(4),
  }

  const templateBuffer = await loadTemplateBuffer(prisma, TEMPLATE_BY_MAU[mau])
  const zip = new PizZip(templateBuffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.render(data)

  const buffer = doc.getZip().generate({ type: "nodebuffer" }) as Buffer
  const fileName = `${FILE_PREFIX_BY_MAU[mau]}.${today.format("DDMMYY")}.docx`
  return { buffer, fileName }
}
