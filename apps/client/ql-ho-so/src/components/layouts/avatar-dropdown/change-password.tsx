import { SafetyCertificateOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { env } from '@/env'

function ChangePassword() {
    return (
        <div className="flex items-center gap-2 color-black ">
            <SafetyCertificateOutlined />
            <Link href={`${env.NEXT_PUBLIC_MY_ACCOUNT}/security`} target="_blank">
                Đổi mật khẩu
            </Link>
        </div>
    )
}

export default ChangePassword
