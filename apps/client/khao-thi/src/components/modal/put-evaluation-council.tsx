import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { EvaluationCouncil } from '@workspace/db'
import {
    useCreateEvaluationCouncil,
    useFindManyEvaluationPeriod,
    useFindUniqueEvaluationCouncil,
    useUpdateEvaluationCouncil,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvaluationCouncilType = EvaluationCouncil
const PutEvaluationCouncil = () => {
    const [form] = Form.useForm<PutEvaluationCouncilType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvaluationCouncil',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvaluationCouncil } = useCreateEvaluationCouncil()
    const { mutateAsync: updateEvaluationCouncil } = useUpdateEvaluationCouncil()
    async function onOk(output?: PutEvaluationCouncilType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                code: output.code,
                name: output.name.trim(),
                description: output.description,
                periodId: output?.periodId,
            }
            if (id) {
                await updateEvaluationCouncil({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createEvaluationCouncil({
                    data: {
                        ...data,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationCouncil'],
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

    const { data: periodData = [] } = useFindManyEvaluationPeriod({
        orderBy: {
            createdAt: 'desc',
        },
    })

    const { data: initialValue } = useFindUniqueEvaluationCouncil(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa hội đồng đánh giá' : 'Thêm mới hội đồng đánh giá'}
            className="w-[600px]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã chương">
                    <Input placeholder="Nhập mã chương" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem form={form} name="name" label="Tên hội đồng đánh giá" required>
                    <Input placeholder="Nhập mã hội đồng đánh giá" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="periodId" label="Đợt đánh giá CTĐT" required>
                    <Select
                        placeholder="Chọn chủ đề khảo sát"
                        options={periodData.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
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

export default PutEvaluationCouncil
