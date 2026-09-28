import { customTrainingFetch } from "@workspace/libs/api/custom-instance"
import { message } from "antd"

type SyncStudentDonViResponse = {
  status: number
  data?: {
    message?: string
    synced?: number
    failed?: { studentId: string; message: string }[]
  }
}

export async function syncStudentDonViFromFixedClass(params: {
  studentIds?: string[]
  fixedClassId?: string
}) {
  if (!params.studentIds?.length && !params.fixedClassId) return

  const res = await customTrainingFetch<SyncStudentDonViResponse>(
    "/api/student/sync-don-vi-from-fixed-class",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  )

  if (res.status !== 200) {
    message.warning(res.data?.message || "Đã gán lớp nhưng đồng bộ đơn vị LSB chưa thành công")
    return res
  }

  if (res.data?.failed?.length) {
    message.warning(`Đã gán lớp. ${res.data.failed.length} hồ sơ chưa đồng bộ đơn vị LSB`)
  }

  return res
}
