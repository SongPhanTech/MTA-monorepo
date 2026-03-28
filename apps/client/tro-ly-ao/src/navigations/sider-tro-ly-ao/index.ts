import { MessageOutlined, OpenAIOutlined } from "@ant-design/icons"
import type { MenuItem } from "@workspace/router"

export type ApiConversation = {
  id: string
  label?: string
  path?: string
}

export type ConversationDataFromAPI = ApiConversation[]

export function generateMenusTroLyAo(data?: ConversationDataFromAPI): MenuItem[] {
  const safeData: ApiConversation[] = data || []

  const historyItems: MenuItem[] = safeData.map((item, index) => ({
    id: `history-${item.id}`,
    label: item.label || `Hội thoại số ${index + 1}`,
    path: item.path || `/hoi-thoai/${item.id}`,
    icon: MessageOutlined,
  }))

  const menuItems: MenuItem[] = [
    {
      id: "tro-ly-ao",
      label: "Hội thoại mới",
      icon: OpenAIOutlined,
      path: "/tro-ly-ao",
    },
    ...historyItems,
  ]

  return menuItems
}
