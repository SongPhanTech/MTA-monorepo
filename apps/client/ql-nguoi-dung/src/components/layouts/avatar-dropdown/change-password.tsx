import { SafetyCertificateOutlined } from '@ant-design/icons'
import React from 'react'

function ChangePassword() {
    return (
        <div className="flex items-center gap-2 color-black ">
            <SafetyCertificateOutlined />
            <span>Đổi mật khẩu</span>
        </div>
    )
}

export default ChangePassword
