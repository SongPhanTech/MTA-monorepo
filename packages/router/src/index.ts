import { PieChartOutlined, UserOutlined } from '@ant-design/icons'
import * as ROUTER_PATH from '../generated/router.json'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
interface MenuItem {
    id: string
    label: string
    icon?: React.ForwardRefExoticComponent<
        Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
    >
    path?: string
    children?: MenuItem[]
}

type NavigationType = Record<keyof typeof ROUTER_PATH, MenuItem[]>

const NAVIGATION: NavigationType = {
    QL_NGUOI_DUNG: [
        {
            id: 'home',
            label: 'Trang chủ',
            icon: PieChartOutlined,
            path: ROUTER_PATH.QL_NGUOI_DUNG.HOME,
        },
        {
            id: 'user',
            label: 'Người sử dụng',
            icon: UserOutlined,
            children: [
                {
                    id: 'list',
                    label: 'Danh sách',
                    path: ROUTER_PATH.QL_NGUOI_DUNG.USER_LIST,
                },
                {
                    id: 'profile',
                    label: 'Hồ sơ',
                    path: ROUTER_PATH.QL_NGUOI_DUNG.USER,
                },
            ],
        },
    ],
    WEB: [],
}
export type { MenuItem, NavigationType }
export { ROUTER_PATH }
export default NAVIGATION
