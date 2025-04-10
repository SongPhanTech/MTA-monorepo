import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Milestone, SchoolYear } from '@workspace/db'
import {
    useCreateMilestone,
    useFindUniqueMilestone,
    useFindManySchoolYear,
    useFindManyMilestone,
    useUpdateMilestone
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutMilestone = Milestone
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutMilestoneModal = () => {
    const [form] = Form.useForm<PutMilestone>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutMilestoneModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data = [], refetch } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })
    const { data: organizations = [], refetch: refetchMilestones } = useFindManyMilestone({
        take: 1000,
        skip: 0,
    })

    const { mutateAsync: createMilestone } = useCreateMilestone()
    const { mutateAsync: updateMilestone } = useUpdateMilestone()
    async function onOk(output?: PutMilestone) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateMilestone({
                    data: {
                        name: output.name,
                        period: output.period,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        schoolYearId: output.schoolYearId,
                        description: output.description
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createMilestone({
                    data: {
                        name: output.name,
                        period: output.period,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        schoolYearId: output.schoolYearId,
                        description: output.description
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Milestone'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueMilestone({
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
        } else {
            form.setFieldsValue({
                period: "12"
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
            title={
                id
                    ? 'Chỉnh sửa mốc huấn luyện'
                    : 'Thêm mới mốc huấn luyện'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Nội dung"
                    required
                >
                    <Input placeholder="Nhập nội dung" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="period"
                    label="Thời gian"
                    required
                >
                    <Input placeholder="Nhập thời gian" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="schoolYearId"
                    label="Năm học"
                    required
                >
                    <Select placeholder='Chọn năm học' options={data.map((i: SchoolYear) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
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

export default PutMilestoneModal
