import { SafetyCertificateOutlined } from '@ant-design/icons'
import { PutChangePasswordModal } from '@components/modal'
import type { PutChangePasswordFormType } from '@components/modal/put-change-password'
import useDisclosure from '@hooks/disclosure'
import React from 'react'

function ChangePassword() {
    const { onOpen, onClose } = useDisclosure<
        string,
        PutChangePasswordFormType
    >({
        tag: PutChangePasswordModal.name,
        onOk,
    })

    function onOk(output?: PutChangePasswordFormType) {
        console.log(output)
    }
    const handleModal = () => {
        onOpen()
    }
    return (
        <div className="flex items-center gap-2 color-black ">
            <SafetyCertificateOutlined />
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <span onClick={handleModal}>Đổi mật khẩu</span>
        </div>
    )
}

export default ChangePassword
