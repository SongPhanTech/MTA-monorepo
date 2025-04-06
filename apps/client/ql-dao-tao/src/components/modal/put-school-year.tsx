import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { SchoolYear } from '@workspace/db'
import {
    useCreateSchoolYear,
    useFindUniqueSchoolYear,
    useUpdateSchoolYear,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutSchoolYearFormType = SchoolYear
const PutSchoolYearModal = () => {
    const [form] = Form.useForm<PutSchoolYearFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSchoolYearModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createSchoolYear } = useCreateSchoolYear()
    const { mutateAsync: updateSchoolYear } = useUpdateSchoolYear()
    async function onOk(output?: PutSchoolYearFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSchoolYear({
                    data: {
                        code: output.code,
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSchoolYear({
                    data: {
                        code: output.code,
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueSchoolYear({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa năm học' : 'Thêm mới năm học'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="code" label="Mã năm học" required>
                    <Input placeholder="Nhập mã năm học" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên năm học" required>
                    <Input placeholder="Nhập tên năm học" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
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

export default PutSchoolYearModal
