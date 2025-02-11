import {
    ApartmentOutlined,
    PieChartOutlined,
    SettingOutlined,
    UserOutlined,
} from '@ant-design/icons'
import * as ROUTER_PATH from '../generated/router.json'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
interface MenuItem {
    id: string
    label: React.ReactNode
    icon?: React.ForwardRefExoticComponent<
        Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
    >
    path?: string
    children?: MenuItem[]
    description?: string
}

type NavigationType = Record<
    keyof typeof ROUTER_PATH,
    {
        menus: MenuItem[]
        label: string
    }
>

const NAVIGATION: NavigationType = {
    QL_NGUOI_DUNG: {
        menus: [
            {
                id: 'home',
                label: 'Trang chủ',
                icon: PieChartOutlined,
                path: ROUTER_PATH.QL_NGUOI_DUNG.HOME,
                description: 'Thông tin trang chủ',
            },
            {
                id: 'nguoi-dung',
                label: 'Người dùng',
                icon: UserOutlined,
                children: [
                    {
                        id: 'danh-sach',
                        label: 'Danh sách',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_DANH_SACH,
                        description: 'Danh sách người dùng',
                    },
                    {
                        id: 'nhom-nguoi-dung',
                        label: 'Nhóm người dùng',
                        path: ROUTER_PATH.QL_NGUOI_DUNG
                            .NGUOI_DUNG_NHOM_NGUOI_DUNG,
                        description: 'Nhóm người dùng',
                    },
                    {
                        id: 'vai-tro',
                        label: 'Vai trò',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_VAI_TRO,
                        description: 'Vai trò người dùng',
                    },
                    {
                        id: 'quyen-co-ban',
                        label: 'Quyền cơ bản',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.NGUOI_DUNG_QUYEN_CO_BAN,
                        description: 'Quyền cơ bản người dùng',
                    },
                ],
            },
            {
                id: 'gioi-han-dia-chi-mang',
                label: 'Quản trị giới hạn địa chỉ mạng',
                path: ROUTER_PATH.QL_NGUOI_DUNG.GIOI_HAN_DIA_CHI_MANG,
                description: 'Quản trị giới hạn địa chỉ mạng từ xa',
                icon: ApartmentOutlined,
            },
            {
                id: 'cau-hinh',
                label: 'Cấu hình',
                icon: SettingOutlined,
                children: [
                    {
                        id: 'thoi-gian-cho',
                        label: 'Thời gian chờ',
                        path: ROUTER_PATH.QL_NGUOI_DUNG.CAU_HINH_THOI_GIAN_CHO,
                    },
                    {
                        id: 'sso',
                        label: 'SSO',
                        path: 'https://auth.swantech.vn/t/carbon.super/console',
                    },
                ],
            },
        ],
        label: 'Quản lý người dùng',
    },
    QL_HE_THONG: {
        menus: [],
        label: 'Quản lý hệ thống',
    },
}
export type { MenuItem, NavigationType }
export { ROUTER_PATH }
export default NAVIGATION
