import { getRuntimeEnv } from "@workspace/libs/utils"

export async function fetchXuLyVanBan({
  text,
  topic_type,
  conversationId,
  signal,
}: {
  text: string
  topic_type: string
  conversationId: string
  signal?: AbortSignal
}) {
  const params = new URLSearchParams({
    text,
    topic_type,
    conversationId,
  })

  const response = await fetch(
    `${getRuntimeEnv("NEXT_PUBLIC_DOC_CHAT_BOT_URL")}/util/nlp_task?${params.toString()}`,
    {
      method: "GET",
      signal,
    }
  )

  if (!response.ok) {
    throw new Error("Lỗi khi gọi API NLP Task")
  }

  return response
}
