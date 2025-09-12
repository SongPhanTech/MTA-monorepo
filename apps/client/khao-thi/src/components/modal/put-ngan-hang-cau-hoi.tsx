import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { QuestionBank, SubjectVersion } from '@workspace/db'
import {
    useCreateQuestionBank,
    useFindManySubjectVersion,
    useFindUniqueQuestionBank,
    useUpdateQuestionBank,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutQuestionBankType = QuestionBank
const PutQuestionBank = () => {
    const [form] = Form.useForm<PutQuestionBankType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutQuestionBank',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createQuestionBank } = useCreateQuestionBank()
    const { mutateAsync: updateQuestionBank } = useUpdateQuestionBank()
    async function onOk(output?: PutQuestionBankType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                code: output.code,
                name: output.name,
                subjectVersionId: output.subjectVersionId,
                description: output.description,
            }
            if (id) {
                await updateQuestionBank({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createQuestionBank({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['QuestionBank'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueQuestionBank(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    const { data: subjectVersionData = [] } = useFindManySubjectVersion({
        orderBy: { name: 'asc' },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({ ...initialValue })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa ngân hàng câu hỏi' : 'Thêm mới ngân hàng câu hỏi'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã ngân hàng câu hỏi">
                    <Input placeholder="Nhập mã ngân hàng câu hỏi" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên ngân hàng câu hỏi" required>
                    <Input placeholder="Nhập tên ngân hàng câu hỏi" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="subjectVersionId" label="Phiên bản môn học" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn phiên bản môn học"
                        options={subjectVersionData.map((i: SubjectVersion) => {
                            const name = i.name || ''
                            const period = i.period ? ` (${i.period} tiết)` : ''
                            const credit = i.credit ? `, ${i.credit} tín chỉ` : ''
                            return {
                                value: i.id,
                                label: `${name}${period}${credit}`,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutQuestionBank
