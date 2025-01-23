import { UserOutlined } from '@ant-design/icons'
// import ROUTER_PATH from '@constants/page-path'
import { Avatar, Dropdown, type MenuProps } from 'antd'
import { usePathname } from 'next/navigation'
import SignOut from './sign-out'
import AccountInformation from './account-information'
import ChangePassword from './change-password'

const items: MenuProps['items'] = [
    {
        key: 'THONG_TIN_TAI_KHOAN',
        // label: <Link href="#">Thông tin tài khoản</Link>,
        label: <AccountInformation/>,
    },
    {
        key: 'DOI_MAT_KHAU',
        label: <ChangePassword />,
    },
    {
        key: 'DANG_XUAT',
        label: <SignOut />,
    },
   
]
const AvatarDropdown = () => {
    const pathname = usePathname()
    return (
        <Dropdown menu={{ items }} placement="bottomLeft" className='cursor-pointer'>
            <Avatar size="large" icon={<UserOutlined />} />
        </Dropdown>
    )
}

export default AvatarDropdown
