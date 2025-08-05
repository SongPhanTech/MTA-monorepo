import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { useExamStatusOptions } from '@hooks/exam-status'
import useSpinner from '@hooks/spinner'
import { type Exam, ExamStatus } from '@workspace/db'
import {
    useCreateExam,
    useFindManyQuestionBank,
    useFindUniqueExam,
    useUpdateExam,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutExamType = Exam
const PutExam = () => {
    const [form] = Form.useForm<PutExamType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutExam.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { options: examStatusOptions } = useExamStatusOptions()

    const { mutateAsync: createExam } = useCreateExam()
    const { mutateAsync: updateExam } = useUpdateExam()
    async function onOk(output?: PutExamType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                title: output.title,
                status: output.status,
                questionBankId: output.questionBankId,
                startTime: output.startTime,
                endTime: output.endTime,
                duration: output.duration,
                passScore: output.passScore,
                shuffleQuestions: output.shuffleQuestions,
                shuffleAnswers: output.shuffleAnswers,
                showResult: output.showResult,
            }
            if (id) {
                await updateExam({
                    data: data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createExam({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Exam'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    const { data: questionBankData } = useFindManyQuestionBank(
        {
            include: { subjectVersion: true },
            orderBy: { createdAt: 'desc' },
        },
        {
            enabled: !id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                startTime: dayjs(initialValue.startTime),
                endTime: dayjs(initialValue.endTime),
            })
        } else {
            form.setFieldsValue({
                status: ExamStatus.DRAFT,
                passScore: 5,
                shuffleQuestions: true,
                shuffleAnswers: true,
                showResult: false,
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
            title={id ? 'Chỉnh sửa kỳ thi' : 'Thêm mới kỳ thi'}
        >
            <Col span={12}>
                <FormItem form={form} name="title" label="Tên kỳ thi" required>
                    <Input placeholder="Nhập tên kỳ thi" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="status" label="Trạng thái" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn trạng thái"
                        options={examStatusOptions}
                        defaultValue={ExamStatus.DRAFT}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="questionBankId"
                    label="Phiên bản ngân hàng câu hỏi"
                    required
                >
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn phiên bản ngân hàng câu hỏi"
                        options={questionBankData?.map(({ id, name, subjectVersion }) => ({
                            value: id,
                            label: `${name} - ${subjectVersion?.name}`,
                        }))}
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="duration" label="Thời gia thi (phút)" required>
                    <InputNumber className="w-full" step={1} placeholder="Nhập thời gian thi" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startTime" label="Thời gian bắt đầu" required>
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
                <FormItem form={form} name="endTime" label="Thời gian kết thúc" required>
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
                <FormItem form={form} name="passScore" label="Điểm đạt" required>
                    <InputNumber
                        className="w-full"
                        step={0.1}
                        defaultValue={5}
                        placeholder="Nhập điểm đạt"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'shuffleQuestions'} label="Xáo trộn câu hỏi" required>
                    <Radio.Group buttonStyle="solid" defaultValue={true}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'shuffleAnswers'} label="Xáo trộn đáp án" required>
                    <Radio.Group buttonStyle="solid" defaultValue={true}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'showResult'} label="Hiển thị kết quả ngay" required>
                    <Radio.Group buttonStyle="solid" defaultValue={false}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutExam
