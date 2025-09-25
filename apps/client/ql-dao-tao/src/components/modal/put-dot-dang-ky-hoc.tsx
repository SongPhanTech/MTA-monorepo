import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { type ClassRegisterSession, type TrainingCourse, TrainingObjectTypes } from '@workspace/db'
import { Col, Form, Input, message, Radio, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import {
    useCreateClassRegisterSession,
    useFindManyTrainingCourse,
    useFindUniqueClassRegisterSession,
    useUpdateClassRegisterSession,
} from '@workspace/db/hooks'
import { useEffect } from 'react'

export type PutClassRegisterSession = ClassRegisterSession & {
    trainingCourses: string[]
}
dayjs.locale('vi')

const PutClassRegisterSession = () => {
    const [form] = Form.useForm<PutClassRegisterSession>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutClassRegisterSession',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueClassRegisterSession(
        { where: { id }, include: { trainingCourses: true } },
        { enabled: !!id }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                trainingCourses: initialValue?.trainingCourses?.map((item) => item.id),
                startDate: dayjs(initialValue?.startDate),
                endDate: dayjs(initialValue?.endDate),
            })
        } else {
            form.setFieldsValue({
                active: true,
            })
        }
    }, [initialValue])

    const { mutateAsync: createClassRegisterSession } = useCreateClassRegisterSession()
    const { mutateAsync: updateClassRegisterSession } = useUpdateClassRegisterSession()
    async function onOk(output?: PutClassRegisterSession) {
        if (!output) return

        try {
            showSpinner()
            const data = {
                name: output.name.trim(),
                startDate: dayjs(output.startDate).toDate(),
                endDate: dayjs(output.endDate).toDate(),
                semesterId: output.semesterId,
                active: output.active,
                description: output.description,
            }
            if (id) {
                await updateClassRegisterSession({
                    data: {
                        ...data,
                        trainingCourses: {
                            set:
                                output.trainingCourses?.length > 0
                                    ? output.trainingCourses.map((item) => ({ id: item }))
                                    : [],
                        },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createClassRegisterSession({
                    data: {
                        ...data,
                        trainingCourses: {
                            connect:
                                output.trainingCourses?.length > 0
                                    ? output.trainingCourses.map((item) => ({ id: item }))
                                    : [],
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['ClassRegisterSessions'],
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

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        where: { active: true, trainingObjectType: { type: TrainingObjectTypes.CIVILIAN } },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đợt đăng ký học' : 'Thêm mới đợt đăng ký học'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đợt đăng ký" required>
                    <Input placeholder="Nhập tên đợt đăng ký" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="semesterId" label="Học kỳ" required>
                    <TreeSelectSemester />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày mở đợt" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY HH:mm',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày mở đợt"
                        showTime={{ format: 'HH:mm' }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc đợt" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY HH:mm',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày kết thúc đợt"
                        showTime={{ format: 'HH:mm' }}
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('startDate')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('minute')
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingCourses" label="Khóa" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn ngành"
                        options={trainingCourses.map((i: TrainingCourse) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
                    <FormItem form={form} name="active" label="Trạng thái">
                        <Radio.Group buttonStyle="solid">
                            <Radio value={true}>Đang mở</Radio>
                            <Radio value={false}>Đã đóng</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutClassRegisterSession
