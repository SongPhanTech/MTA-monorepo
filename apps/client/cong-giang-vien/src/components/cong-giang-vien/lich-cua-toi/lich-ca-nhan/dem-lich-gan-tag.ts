import { fetchInstance } from "@api/index"
import { getRuntimeEnv } from "@workspace/libs/utils"

export async function demSoLichGanTag(tagId: string, lecturerId: string): Promise<number> {
  const args = {
    where: {
      lecturerId,
      tags: { some: { id: tagId } },
    },
  }
  const endpoint = `${getRuntimeEnv("NEXT_PUBLIC_API_MODEL_BASE_URL")}/api/model`
  const response = await fetchInstance(
    `${endpoint}/individualSchedule/count?q=${encodeURIComponent(JSON.stringify(args))}`
  )

  if (!response.ok) {
    throw new Error("Không thể kiểm tra lịch gắn loại lịch")
  }

  const data: unknown = await response.json()
  if (typeof data === "number") return data
  if (typeof data === "object" && data !== null && "data" in data) {
    return Number((data as { data: unknown }).data) || 0
  }
  return Number(data) || 0
}
