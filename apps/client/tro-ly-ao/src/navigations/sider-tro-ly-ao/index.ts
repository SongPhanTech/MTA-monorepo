import { MessageOutlined } from "@ant-design/icons"
import type { MenuItem } from '@workspace/router'

export type ApiConversation = {
  id: string
  label?: string
  path?: string // optional: để tránh hardcode nếu API trả về sẵn
}

export type ConversationDataFromAPI = {
  today: ApiConversation[]
  yesterday: ApiConversation[]
  old: ApiConversation[]
}

export function generateMenusTroLyAo(data?: ConversationDataFromAPI): MenuItem[] {
  const safeData: ConversationDataFromAPI = {
    today: data?.today || [],
    yesterday: data?.yesterday || [],
    old: data?.old || [],
  }

  // Hàm tạo group menu
  const generateGroup = (
    groupId: string,
    groupLabel: string,
    conversations: ApiConversation[]
  ): MenuItem | null => {
    if (!conversations.length) return null

    const children: MenuItem[] = conversations.map((item, index) => ({
      id: `${groupId}-${item.id}`,
      label: item.label || `Hội thoại số ${index + 1}`,
      path: item.path || `/hoi-thoai/${item.id}`,
    }))

    return {
      id: groupId,
      label: groupLabel,
      type: 'group',
      children,
    }
  }

  const conversationGroups = [
    generateGroup('hom-nay', 'Hôm nay', safeData.today),
    generateGroup('hom-qua', 'Hôm qua', safeData.yesterday),
    generateGroup('cu', 'Hội thoại cũ', safeData.old),
  ].filter((group): group is MenuItem => group !== null)

  return [
    {
      id: 'tro-ly-ao',
      label: 'Trợ lý ảo',
      icon: MessageOutlined,
      path: '/',
    },
    ...conversationGroups,
  ]
}