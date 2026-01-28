import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useFindManyLecturer,
    useFindUniqueStudentResearchTopic,
    useUpdateStudentResearchTopic,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Row, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import type { StudentResearchTopic } from '@workspace/db/client'
import { FormItem } from '@workspace/ui'

dayjs.locale('vi')
const { TextArea } = Input
type PutResearchTopicForm = {
    score: string
    studentFullname?: string | null
    studentCode?: string | null
    studentDateOfBirth?: Date | null
} & StudentResearchTopic

const PutResearchTopicModal = () => {
    const [form] = Form.useForm<PutResearchTopicForm>()
    const { isOpen, onClose, input } = useDisclosure<{
        studentResearchTopicId: string
    }>({
        tag: 'PutResearchTopicModal',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: lecturer = [] } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })

    const { data: studentResearchTopic } = useFindUniqueStudentResearchTopic(
        {
            where: { id: input?.studentResearchTopicId },
            include: {
                supervisor: {
                    include: {
                        userProfile: true,
                    },
                },
                coSupervisor: {
                    include: {
                        userProfile: true,
                    },
                },
                studentSubjectScore: {
                    include: {
                        student: {
                            select: {
                                code: true,
                                userProfile: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!input?.studentResearchTopicId,
        }
    )

    const { mutateAsync: updateStudentResearchTopic } = useUpdateStudentResearchTopic()
    async function onOk() {
        try {
            showSpinner()
            if (input?.studentResearchTopicId) {
                const score = form.getFieldValue('score')
                    ? Number(form.getFieldValue('score'))
                    : null

                await updateStudentResearchTopic({
                    where: { id: input?.studentResearchTopicId },
                    data: {
                        name: form.getFieldValue('name'),
                        mainContent: form.getFieldValue('mainContent'),
                        supervisor: {
                            connect: { id: form.getFieldValue('supervisorId') || null },
                        },
                        coSupervisor: {
                            connect: { id: form.getFieldValue('coSupervisorId') || null },
                        },
                        reportDate: form.getFieldValue('reportDate'),
                        deadline: form.getFieldValue('deadline'),
                        studentSubjectScore: {
                            update: {
                                attendanceScore: score,
                                midtermScore: score,
                                examScore: score,
                                finalScore: score,
                            },
                        },
                    },
                })
            }
            message.success('Cập nhật thành công')
            onClose()
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    useEffect(() => {
        if (input?.studentResearchTopicId) {
            form.setFieldsValue({
                name: studentResearchTopic?.name ?? '',
                mainContent: studentResearchTopic?.mainContent ?? '',
                supervisorId: studentResearchTopic?.supervisorId ?? undefined,
                coSupervisorId: studentResearchTopic?.coSupervisorId ?? undefined,
                reportDate: studentResearchTopic?.reportDate
                    ? dayjs(studentResearchTopic?.reportDate)
                    : undefined,
                deadline: studentResearchTopic?.deadline
                    ? dayjs(studentResearchTopic?.deadline)
                    : undefined,
                score: studentResearchTopic?.studentSubjectScore?.finalScore?.toString() ?? '',
                studentFullname:
                    studentResearchTopic?.studentSubjectScore?.student?.userProfile?.fullname,
                studentCode: studentResearchTopic?.studentSubjectScore?.student?.code,
                studentDateOfBirth: studentResearchTopic?.studentSubjectScore?.student?.userProfile
                    ?.dateOfBirth
                    ? dayjs(
                          studentResearchTopic?.studentSubjectScore?.student?.userProfile
                              ?.dateOfBirth
                      ).format('DD/MM/YYYY')
                    : undefined,
            })
        }
    }, [input?.studentResearchTopicId, studentResearchTopic, form])
    return (
        <PutFormModal
            open={isOpen}
            onFinish={onOk}
            form={form}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.studentResearchTopicId
                    ? 'Chỉnh sửa chuyên đề nghiên cứu'
                    : 'Thêm mới chuyên đề nghiên cứu'
            }
            className="w-[60vw]"
        >
            <Row gutter={[8, 8]}>
                <Col span={8}>
                    <FormItem form={form} name="studentCode" label="Mã HV/SV">
                        <Input variant="outlined" disabled />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="studentFullname" label="Họ và tên">
                        <Input variant="outlined" disabled />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="studentDateOfBirth" label="Ngày sinh">
                        <Input variant="outlined" disabled />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="name" label="Tên chuyên đề" required>
                        <TextArea
                            placeholder="Nhập tên chuyên đề"
                            autoSize={{ minRows: 2, maxRows: 6 }}
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="mainContent"
                        label="Nội dung chính của chuyên đề"
                        required
                    >
                        <TextArea
                            placeholder="Nhập nội dung chính của chuyên đề"
                            autoSize={{ minRows: 2, maxRows: 6 }}
                        />
                    </FormItem>
                </Col>

                <Col span={12}>
                    <FormItem form={form} name="supervisorId" label="Giảng viên hướng dẫn" required>
                        <Select
                            placeholder="Chọn giảng viên hướng dẫn"
                            options={lecturer.map((item) => ({
                                label: `${item.lectureID ? `${item.lectureID} -` : ''} ${item.userProfile.fullname}`,
                                value: item.id,
                            }))}
                            showSearch
                            filterOption={false}
                            allowClear
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="coSupervisorId" label="Chuyên gia hướng dẫn phụ">
                        <Select
                            placeholder="Chọn chuyên gia phụ"
                            options={lecturer.map((item) => ({
                                label: `${item.lectureID ? `${item.lectureID} -` : ''} ${item.userProfile.fullname}`,
                                value: item.id,
                            }))}
                            showSearch
                            filterOption={false}
                            allowClear
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="reportDate" label="Thời gian báo cáo">
                        <DatePicker
                            format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                            className="w-full"
                            placeholder="Chọn ngày báo cáo"
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="deadline" label="Hạn nhập chuyên đề">
                        <DatePicker
                            format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                            className="w-full"
                            placeholder="Chọn hạn nhập chuyên đề"
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="score" label="Điểm số">
                        <InputNumber disabled min={0} max={10} step={0.1} className="w-full" />
                    </FormItem>
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default PutResearchTopicModal
