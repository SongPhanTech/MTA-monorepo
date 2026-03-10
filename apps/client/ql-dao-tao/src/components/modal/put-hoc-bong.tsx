import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Scholarship, TrainingCourse } from '@workspace/db/client'
import {
    useCreateScholarship,
    useFindManyTrainingCourse,
    useFindUniqueScholarship,
    useUpdateScholarship,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import { useTrainingObjectTypeStore } from '@workspace/ui'

dayjs.locale('vi')
const PutHocBong = () => {
    const [form] = Form.useForm<Scholarship>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutHocBong',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: { active: true, trainingObjectTypeId, deletedAt: null },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    const { mutateAsync: createScholarship } = useCreateScholarship()
    const { mutateAsync: updateScholarship } = useUpdateScholarship()
    async function onOk(data?: Scholarship) {
        if (!data) return
        try {
            showSpinner()
            if (id) {
                await updateScholarship({ data, where: { id } })
                message.success('Cập nhật thành công')
            } else {
                await createScholarship({ data })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Scholarship'],
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

    const { data: initialValue } = useFindUniqueScholarship(
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
                effectiveFrom: initialValue.effectiveFrom
                    ? dayjs(initialValue.effectiveFrom)
                    : undefined,
                effectiveTo: initialValue.effectiveTo ? dayjs(initialValue.effectiveTo) : undefined,
            })
        } else {
            form.setFieldsValue({ multiplier: 1, active: true })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa học bổng' : 'Thêm mới học bổng'}
        >
            <Col span={12}>
                <FormItem form={form} name="trainingCourseId" label="Khoá học" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn khoá"
                        options={trainingCourseData.map((i: TrainingCourse) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên học bổng" required>
                    <Input placeholder="Nhập tên học bổng" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="rankOrder" label="Độ ưu tiên" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập độ ưu tiên"
                        className="w-full"
                        min={1}
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="baseAmount" label="Số tiền cơ bản">
                    <InputNumber
                        type="number"
                        placeholder="Nhập số tiền"
                        className="w-full"
                        min={1}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                        max={1000000000}
                        step={1}
                        suffix="VNĐ"
                    />
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem form={form} name="multiplier" label="Hệ số" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập hệ số"
                        className="w-full"
                        min={0}
                        max={10}
                        step={0.1}
                    />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <FormItem form={form} name="effectiveFrom" label="Hiệu lực từ ngày">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="effectiveTo" label="Hiệu lực đến ngày">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('effectiveFrom')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('day')
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
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

export default PutHocBong
