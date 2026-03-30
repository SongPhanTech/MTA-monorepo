import type { PrismaClient } from "@workspace/db"
import { getMinioUrl } from "./utils"

export const getTemplateBuffer = async (prisma: PrismaClient, templateCode: string) => {
  const templateFile = await prisma.templateFile.findUnique({
    where: { code: templateCode },
  })

  // if (!templateFile) {
  //     throw new HTTPException(404, { message: `template not found (${templateCode})` })
  // }
  const fallbackPath = templateCode.endsWith(".xlsx")
    ? `/mta/template/${templateCode}`
    : `/mta/template/${templateCode}.xlsx`
  const url = getMinioUrl(templateFile?.path || fallbackPath)

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch template: ${res.status} ${res.statusText}`)
  }

  const buffer = await res.arrayBuffer()
  const nodeBuffer: Buffer<ArrayBuffer> = Buffer.from(buffer)

  return nodeBuffer
}
