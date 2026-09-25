import type { PrismaClient } from "@workspace/db"
import { fetchMinio } from "./utils"

const resolveTemplatePath = (templateCode: string, folder: "template" | "luan-van") =>
  templateCode.endsWith(".xlsx") || templateCode.endsWith(".docx")
    ? `/mta/${folder}/${templateCode}`
    : `/mta/${folder}/${templateCode}.xlsx`

const readTemplateBuffer = async (
  prisma: PrismaClient,
  templateCode: string,
  folder: "template" | "luan-van"
) => {
  const templateFile = await prisma.templateFile.findUnique({
    where: { code: templateCode },
  })

  const res = await fetchMinio(templateFile?.path || resolveTemplatePath(templateCode, folder))

  if (!res.ok) {
    throw new Error(`Failed to fetch template: ${res.status} ${res.statusText}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

export const getTemplateBuffer = (prisma: PrismaClient, templateCode: string) =>
  readTemplateBuffer(prisma, templateCode, "template")

export const getLuanVanTemplateBuffer = (prisma: PrismaClient, templateCode: string) =>
  readTemplateBuffer(prisma, templateCode, "luan-van")
