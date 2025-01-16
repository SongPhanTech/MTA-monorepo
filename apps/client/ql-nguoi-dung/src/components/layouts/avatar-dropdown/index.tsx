import { UserOutlined } from '@ant-design/icons'
import ROUTER_PATH from '@constants/page-path'
import { Avatar, Dropdown, MenuProps } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOut from './sign-out'

const items: MenuProps['items'] = [
    {
        key: 'THONG_TIN_TAI_KHOAN',
        label: <Link href="#">Thông tin tài khoản</Link>,
    },
    {
        key: 'DANG_XUAT',
        label: <SignOut />,
    },
]
const AvatarDropdown = () => {
    const pathname = usePathname()
    return (
        <Dropdown menu={{ items }} placement="bottomLeft">
            <Avatar size="large" icon={<UserOutlined />} />
        </Dropdown>
    )
}

export default AvatarDropdown
