import { getTemplateBuffer } from "@workspace/libs/server"
import XlsxTemplate from "xlsx-template"
import { prisma } from ".."

export async function _generateCurriculumImportTemplate(
  trainingObjectTypeId: string
): Promise<ArrayBuffer> {
  const [trainingBlocks, organizations] = await Promise.all([
    prisma.trainingBlock.findMany({
      where: { active: true, deletedAt: null, trainingObjectTypeId },
      select: {
        name: true,
        priority: true,
        curriculumVersions: { select: { electiveCreditsRequired: true } },
      },
      orderBy: { priority: "asc" },
    }),
    prisma.dM_DonVi.findMany({
      where: { bActive: true, bDeleted: false, iLoaiDonVi: { in: [5, 6, 7] } },
      select: { sMa: true, sTKPUCode: true, sTen: true },
      orderBy: { sTen: "asc" },
    }),
  ])

  const buffer = await getTemplateBuffer(prisma, "MAU-NHAP_CTDT_v4.xlsx")
  const template = new XlsxTemplate(buffer)

  template.substitute("KKT_TU_CHON", {
    team: trainingBlocks.map((tb) => ({
      name: tb.name,
      so_tc: tb.curriculumVersions
        .map((cv) => cv.electiveCreditsRequired)
        .reduce((a, b) => a + b, 0),
    })),
  })

  template.substitute("DON_VI", {
    team: organizations.map((o) => ({
      ma: o.sMa || "",
      maTkpu: o.sTKPUCode || "",
      name: o.sTen || "",
    })),
  })

  return template.generate({ type: "nodebuffer" }) as any
}
