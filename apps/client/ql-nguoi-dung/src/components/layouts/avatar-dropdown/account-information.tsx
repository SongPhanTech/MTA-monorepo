import { UserOutlined } from '@ant-design/icons'
import Link from 'next/link'
import React from 'react'

function AccountInformation() {
    return (
        <div className="flex items-center gap-2 color-black ">
            <UserOutlined />
            <Link href={'#'} style={{ color: 'black' }}>Thông tin tài khoản</Link>
        </div>
    )
}

export default AccountInformation
