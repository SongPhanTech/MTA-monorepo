import useSpinner from '@hooks/spinner'
import { Form } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PutTrinhDoLyLuanChinhTriModal() {
    const [form] = Form.useForm()

    const { isOpen, onOpen, onClose } = useDisclosure({
        tag: PutTrinhDoLyLuanChinhTriModal.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output: any) {}
}
