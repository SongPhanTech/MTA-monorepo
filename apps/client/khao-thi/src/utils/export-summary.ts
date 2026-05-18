import { message } from "antd"
import { TemplateHandler } from "easy-template-x"
import PizZip from "pizzip"

import { getMinioUrl } from "@workspace/libs/utils"
import { saveFile } from "@/utils/saveFile"

import { getClusterSurveyStatisticsForOrganization } from "@workspace/libs/api/exam"

export type ExportSummaryInput = {
  organizationId: string
  clusterSurveyId: string
  organizationName?: string
}

export async function exportSummary(
  organizationId?: string,
  clusterSurveyId?: string,
  organizationName?: string
) {
  try {
    const templateUrl = getMinioUrl("mta/template/TongKetPhieuKhoa.docx")

    const res = await fetch(templateUrl)

    if (!res.ok) {
      message.error("Không tải được file mẫu")
      return
    }

    const templateBuffer = await res.arrayBuffer()

    const repairedBuffer = new PizZip(templateBuffer).generate({
      type: "arraybuffer",
    })

    const templateBlob = new Blob([repairedBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const handler = new TemplateHandler()

    const payload: Record<string, any> = {
      organizationId: organizationId || "",
      clusterSurveyId: clusterSurveyId || "",
      organizationName: organizationName || "",
    }

    // Log toàn bộ thông tin payload dùng để render template
    console.log(payload)

    if (organizationId && clusterSurveyId) {
      const statsRes = await getClusterSurveyStatisticsForOrganization(clusterSurveyId, {
        organizationId,
      } as any)

      payload.data = (statsRes as any)?.data

      // Log thêm phần dữ liệu chuyên sâu (thông tin khoa)
      console.log(payload.data)
    }

    console.log(payload)

    const doc = await handler.process(templateBlob, payload)

    saveFile("TongKetPhieuKhoa.docx", doc)
  } catch (error) {
    console.error(error)
    message.error("Không thể xuất file Word")
  }
}
