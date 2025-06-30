import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Button } from '@workspace/ui'
import { Avatar, Dropdown, type MenuProps } from 'antd'
import { usePathname } from 'next/navigation'
import AccountInformation from './account-information'
import ChangePassword from './change-password'
import signOutAction from './sign-out'

const items: MenuProps['items'] = [
    {
        key: 'THONG_TIN_TAI_KHOAN',
        label: <AccountInformation />,
    },
    {
        key: 'DOI_MAT_KHAU',
        label: <ChangePassword />,
    },
    {
        key: 'DANG_XUAT',
        label: (
            <Button onClick={signOutAction} className="text-red-500 flex items-center gap-2">
                <LogoutOutlined />
                <span>Đăng xuất</span>
            </Button>
        ),
    },
]
const AvatarDropdown = () => {
    const _pathname = usePathname()
    return (
        <Dropdown menu={{ items }} placement="bottomLeft" className="cursor-pointer">
            <Avatar size="large" icon={<UserOutlined />} />
        </Dropdown>
    )
}

export default AvatarDropdown
