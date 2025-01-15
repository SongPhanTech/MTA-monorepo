import { PieChartOutlined, UserOutlined } from '@ant-design/icons'
import ROUTER_PATH from '@constants/page-path'

interface MenuItem {
    id: string
    label: string
    icon?: any
    path?: string
    children?: MenuItem[]
}

export const navigations: MenuItem[] = [
    {
        id: 'home',
        label: 'Trang chủ',
        icon: PieChartOutlined,
        path: ROUTER_PATH.HOME,
    },
    {
        id: 'user',
        label: 'Người sử dụng',
        icon: UserOutlined,
        children: [
            { id: 'list', label: 'Danh sách', path: '/user/list' },
            { id: 'profile', label: 'Hồ sơ', path: '/user/profile' },
        ],
    },
]
