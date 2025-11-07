import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'

import { Col, Form, Input, InputNumber, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutScoreScaleCatalogType = ScoreScaleCatalog
const PutScoreScaleCatalog = () => {
    const [form] = Form.useForm<PutScoreScaleCatalogType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutScoreScaleCatalog',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createScoreScaleCatalog } = useCreateScoreScaleCatalog()
    const { mutateAsync: updateScoreScaleCatalog } = useUpdateScoreScaleCatalog()
    async function onOk(output?: PutScoreScaleCatalogType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name.trim(),
                minValue: output.minValue,
                maxValue: output.maxValue,
                passFrom: output.passFrom,
            }
            if (id) {
                await updateScoreScaleCatalog({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createScoreScaleCatalog({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['ScoreScaleCatalog'],
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

    const { data: initialValue } = useFindUniqueScoreScaleCatalog(
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
            title={id ? 'Chỉnh sửa thang điểm' : 'Thêm mới thang điểm'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên thang điểm" required>
                    <Input placeholder="Nhập tên thang điểm" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="minValue" label="Điểm thấp nhất" required>
                    <InputNumber min={0} type="number" className="w-full" step={1} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="maxValue" label="Điểm cao nhất" required>
                    <InputNumber min={0} type="number" className="w-full" step={1} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="passFrom" label="Điểm đạt">
                    <InputNumber min={0} type="number" className="w-full" step={1} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutScoreScaleCatalog
