
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useFindManyLecturer,
    useFindUniqueStudentSubjectScore,
    useUpdateStudentResearchTopic,
    useUpdateStudentSubjectScore,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, Row, Select,message } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
dayjs.locale('vi')
const { TextArea } = Input;
 interface PutResearchTopicForm {
    name: string
    mainContent: string
    supervisorId: string
    coSupervisorId: string
    reportDate: Date
    deadline: Date

    score: string
    
}

const PutResearchTopicModal = () => {

    const [form] = Form.useForm<PutResearchTopicForm>()
    const { isOpen, onClose, input } = useDisclosure<{
        studentResearchTopicId: string
        studentSubjectScoreId: string
    }>({
        tag: 'PutResearchTopicModal',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: lecturer = [] } = useFindManyLecturer(
        {
            include: {
                userProfile: true,
            },
        }
    )  
    const { data: studentSubjectScore } = useFindUniqueStudentSubjectScore({
        where: { id: input?.studentSubjectScoreId },
        include: {
            studentResearchTopic: true,
        },
    }, { enabled: !!input?.studentSubjectScoreId })

    const { mutateAsync: updateStudentResearchTopic } = useUpdateStudentResearchTopic()
    const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()
    async function onOk() {
        try {
            showSpinner()
            if (input?.studentResearchTopicId) {
                await updateStudentResearchTopic({
                    where: { id: input?.studentResearchTopicId },
                    data: {
                        name: form.getFieldValue('name'),
                        mainContent: form.getFieldValue('mainContent'),
                        supervisorId: form.getFieldValue('supervisorId'),
                        coSupervisorId: form.getFieldValue('coSupervisorId'),
                        reportDate: form.getFieldValue('reportDate'),
                        deadline: form.getFieldValue('deadline'),
                    },
                })
                await updateStudentSubjectScore({
                    where: { id: input?.studentSubjectScoreId },
                    data: {
                        finalScore: form.getFieldValue('score'),
                    },
                })
            }
            message.success('Cập nhật thành công')
            onClose()
        }
        catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        finally {
            hideSpinner()
        }
    }
    useEffect(() => {
        if (input?.studentSubjectScoreId) {
            form.setFieldsValue({
                name: studentSubjectScore?.studentResearchTopic?.name ?? '',
                mainContent: studentSubjectScore?.studentResearchTopic?.mainContent ?? '',
                supervisorId: studentSubjectScore?.studentResearchTopic?.supervisorId ?? undefined,
                coSupervisorId: studentSubjectScore?.studentResearchTopic?.coSupervisorId ?? undefined,
                reportDate: studentSubjectScore?.studentResearchTopic?.reportDate
                    ? dayjs(studentSubjectScore?.studentResearchTopic?.reportDate) : undefined,
                deadline: studentSubjectScore?.studentResearchTopic?.deadline
                    ? dayjs(studentSubjectScore?.studentResearchTopic?.deadline) : undefined,
                score: studentSubjectScore?.finalScore?.toString() ?? '',
            })
        }
    }, [input?.studentSubjectScoreId, studentSubjectScore, form])
    return (
        <PutFormModal
        open={isOpen}
        onFinish={onOk}
        form={form}
        onCancel={onClose}
        maskClosable={true}
        title={input?.studentResearchTopicId ? 'Chỉnh sửa chuyên đề nghiên cứu' : 'Thêm mới chuyên đề nghiên cứu'}
        className="w-[60vw]"
    >
        <Row gutter={[24, 0]}>
            <Col span={12}>
                <Form.Item name="name" label="Tên chuyên đề" required>
                    <TextArea 
                        placeholder="Nhập tên chuyên đề" 
                        autoSize={{ minRows: 2, maxRows: 4 }} 
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="mainContent" label="Nội dung chính của chuyên đề" required>
                    <TextArea 
                        placeholder="Nhập nội dung chính của chuyên đề" 
                        autoSize={{ minRows: 2, maxRows: 4 }} 
                    />
                </Form.Item>
            </Col>

            <Col span={12}>
                <Form.Item name="supervisorId" label="Giảng viên hướng dẫn" required>
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
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="coSupervisorId" label="Chuyên gia hướng dẫn phụ">
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
                </Form.Item>
            </Col>

            <Col span={12}>
                <Form.Item name="reportDate" label="Thời gian báo cáo">
                    <DatePicker
                        format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                        className="w-full"
                        placeholder="Chọn ngày báo cáo"
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="deadline" label="Hạn nhập chuyên đề">
                    <DatePicker
                        format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                        className="w-full"
                        placeholder="Chọn hạn nhập chuyên đề"
                    />
                </Form.Item>
            </Col>

            <Col span={12}>
                <Form.Item name="score" label="Điểm số">
                    <InputNumber
                        min={0}
                        max={10}
                        step={0.1}
                        className="w-full"
                        placeholder="Nhập điểm (ví dụ: 8.5)"
                    />
                </Form.Item>
            </Col>
        </Row>
    </PutFormModal>
    )
}

export default PutResearchTopicModal
