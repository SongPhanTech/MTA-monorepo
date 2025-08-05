import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { DisciplinaryWarningReason } from '@workspace/db'
import {
    useCreateDisciplinaryWarningReason,
    useFindUniqueDisciplinaryWarningReason,
    useUpdateDisciplinaryWarningReason,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutDisciplinaryWarningReasonFormType = DisciplinaryWarningReason
dayjs.locale('vi')
const PutDisciplinaryWarningReason = () => {
    const [form] = Form.useForm<PutDisciplinaryWarningReasonFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutDisciplinaryWarningReason.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createDisciplinaryWarningReason } = useCreateDisciplinaryWarningReason()
    const { mutateAsync: updateDisciplinaryWarningReason } = useUpdateDisciplinaryWarningReason()
    async function onOk(output?: PutDisciplinaryWarningReasonFormType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                code: output.code,
                name: output.name,
                severityLevel: output.severityLevel,
                description: output.description,
                active: output.active,
            }
            if (id) {
                await updateDisciplinaryWarningReason({
                    data: data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createDisciplinaryWarningReason({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueDisciplinaryWarningReason(
        {
            where: { id },
        },
        { enabled: !!id }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({
                active: true,
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
            title={id ? 'Chỉnh sửa cảnh cáo học đường' : 'Thêm mới cảnh cáo học đường'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã cảnh cáo học đường" required>
                    <Input placeholder="Nhập mã cảnh cáo học đường" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên cảnh cáo học đường" required>
                    <Input placeholder="Nhập tên cảnh cáo học đường" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="severityLevel" label="Mức nâng" required>
                    <InputNumber
                        placeholder="Nhập mức nâng"
                        className="w-full"
                        min={0}
                        max={4}
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {id && (
                <Col span={24}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
                        <Radio.Group buttonStyle="solid">
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutDisciplinaryWarningReason
