import { SafetyCertificateOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
function ChangePassword() {
    const router = useRouter()
    const handleChangePassword = () => {
        router.push(String(process.env.NEXT_PUBLIC_MY_ACCOUNT))
    }
    return (
        <div className="flex items-center gap-2 color-black ">
            <SafetyCertificateOutlined />
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <span onClick={handleChangePassword}>Đổi mật khẩu</span>
        </div>
    )
}

export default ChangePassword
