import useSpinner from '@hooks/spinner'
import { Modal as AntdModal } from 'antd'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type itemProps = {
    id: string
    name: string
    answers: { answer: string; count: number; id: string; description: string }[]
}

const PinEvidenceToPeriod = () => {
    const { isOpen, onClose, input } = useDisclosure<{
        data: itemProps
    }>({
        tag: PinEvidenceToPeriod.name,
    })

    const dataRender = useMemo(() => {
        if (input?.data?.answers) {
            return input?.data?.answers
        }
        return input?.data?.answers
    }, [input?.data])
    const { showSpinner, hideSpinner } = useSpinner()

    return (
        <AntdModal
            open={isOpen}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm minh chứng cho tiêu chí'}
            className="w-[700px]"
        ></AntdModal>
    )
}

export default PinEvidenceToPeriod
