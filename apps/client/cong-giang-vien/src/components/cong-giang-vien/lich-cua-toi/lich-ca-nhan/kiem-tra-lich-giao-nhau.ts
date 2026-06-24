import { fetchInstance } from "@api/index"
import { taoDieuKienTimLichGiaoNhau } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { getRuntimeEnv } from "@workspace/libs/utils"

export type LichGiaoNhauTomTat = {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay: boolean
}

export async function timLichGiaoNhau(
  lecturerId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<LichGiaoNhauTomTat[]> {
  const args = {
    where: taoDieuKienTimLichGiaoNhau(lecturerId, startTime, endTime, excludeId),
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      allDay: true,
    },
    orderBy: [{ startTime: "asc" }],
    take: 5,
  }
  const endpoint = `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/model`
  const response = await fetchInstance(
    `${endpoint}/individualSchedule/findMany?q=${encodeURIComponent(JSON.stringify(args))}`
  )

  if (!response.ok) {
    throw new Error("Không thể kiểm tra lịch trùng")
  }

  const data: unknown = await response.json()
  if (Array.isArray(data)) return data as LichGiaoNhauTomTat[]
  if (typeof data === "object" && data !== null && "data" in data) {
    return (data as { data: LichGiaoNhauTomTat[] }).data ?? []
  }
  return []
}
