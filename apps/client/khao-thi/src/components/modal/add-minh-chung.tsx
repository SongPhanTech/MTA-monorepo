import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useSession } from '@workspace/auth/react'
import type { Evidence, EvidenceFile } from '@workspace/db'
import {
    useCreateEvidence,
    useFindManyEvidenceCategory,
    useUpdateEvidence,
} from '@workspace/db/hooks'
import { Form, message } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvidenceType = Evidence & {
    evidenceFile?: EvidenceFile[]
}
const PutEvidence = () => {
    const { data: dataUser } = useSession()
    console.log(dataUser)

    const [form] = Form.useForm<PutEvidenceType>()
    const [document, setDocument] = useState<EvidenceFile[]>([])
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
        categoryId: string
    }>({
        tag: PutEvidence.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvidence } = useCreateEvidence()
    const { mutateAsync: updateEvidence } = useUpdateEvidence()
    async function onOk(output?: PutEvidenceType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name,
                categoryId: input?.categoryId || '',
                information: output.information,
                issuer: output.issuer,
            }

            if (input?.id) {
                message.success('Cập nhật thành công')
            } else {
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Evidence'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { data: listEvidence } = useFindManyEvidenceCategory()
    // const { data: initialValue } = useFindUniqueEvidence(
    //     {
    //         where: { id: input?.id },
    //         include: {
    //             evidenceFile: true,
    //         },
    //     },
    //     {
    //         enabled: !!input?.id,
    //     }
    // )
    // // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    // useEffect(() => {
    //     if (initialValue) {
    //         form.setFieldsValue({ ...initialValue })
    //         setDocument(initialValue.evidenceFile)
    //     } else {
    //         form.setFieldsValue({
    //             evidenceFile: [],
    //         })
    //         setDocument([])
    //     }
    // }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa minh chứng' : 'Thêm mới minh chứng'}
            className="w-[700px]"
        ></PutFormModal>
    )
}

export default PutEvidence
