import { MessageOutlined } from "@ant-design/icons"
import type { MenuItem } from '@workspace/router'

export type ApiConversation = {
    id: string
    label?: string
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

    const generateGroup = (id: string, label: string, items: ApiConversation[]): MenuItem | null => {
        if (!items || items.length === 0) return null
        return {
            id,
            label,
            type: 'group',
            children: items.map((item, index) => ({
                id: `${id}-${index}`,
                label: item.label || `Hội thoại số ${index + 1}`,
                path: `/hoi-thoai/${item.id}`,
            })),
        }
    }

    const groups: (MenuItem | null)[] = [
        generateGroup('hom-nay', 'Hôm nay', safeData.today),
        generateGroup('hom-qua', 'Hôm qua', safeData.yesterday),
        generateGroup('cu', 'Hội thoại cũ', safeData.old),
    ]

    return [
        {
            id: 'tro-ly-ao',
            label: 'Trợ lý ảo',
            icon: MessageOutlined,
            path: '/',
        },
        ...groups.filter((group): group is MenuItem => group !== null),
    ]
}