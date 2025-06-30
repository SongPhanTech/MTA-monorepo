import { UserOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { env } from '@/env'

function AccountInformation() {
    return (
        <div className="flex items-center gap-2 color-black ">
            <UserOutlined />
            <Link href={env.NEXT_PUBLIC_MY_ACCOUNT} target="_blank" style={{ color: 'black' }}>
                Thông tin tài khoản
            </Link>
        </div>
    )
}

export default AccountInformation
