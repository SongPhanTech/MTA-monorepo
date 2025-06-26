import type { SubjectClass } from '@workspace/db'
import { Col, DatePicker, Form, Radio, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { useWatch } from 'antd/es/form/Form'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSubjectClass = SubjectClass

dayjs.extend(customParseFormat)

const HanNhapDiem = () => {
    const [form] = Form.useForm<PutSubjectClass>()
    const isLockScore = useWatch('isLockScore', form)
    const isLockExamScore = useWatch('isLockExamScore', form)
    const scoreDeadline = useWatch('scoreDeadline', form)
    const examScoreDeadline = useWatch('examScoreDeadline', form)

    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: HanNhapDiem.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue, refetch } = useFindUniqueSubjectClass(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                scoreDeadline: dayjs(initialValue.scoreDeadline),
                examScoreDeadline: dayjs(initialValue.examScoreDeadline),
                isLockScore: initialValue.isLockScore,
                isLockExamScore: initialValue.isLockExamScore,
            })
        }
    }, [initialValue])

    const { mutateAsync: update } = useUpdateSubjectClass()

    async function onOk(output?: SubjectClass) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            const data = {
                isLockScore: output?.isLockScore,
                isLockExamScore: output?.isLockExamScore,
                scoreDeadline: output?.scoreDeadline,
                examScoreDeadline: output?.examScoreDeadline,
            }
            if (id) {
                await update({
                    data: data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['SubjectClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Điều chỉnh hạn nhập điểm'}
            width={900}
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Khóa điểm ĐQT"
                    labelAlign="left"
                    name="isLockScore"
                >
                    <Radio.Group
                        onChange={(e) => {
                            form.setFieldsValue({
                                isLockScore: e.target.value,
                            })
                        }}
                    >
                        <Radio value={true}>Đã khóa</Radio>
                        <Radio value={false}>Chưa khóa</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    label="Khóa điểm thi"
                    name="isLockExamScore"
                    labelAlign="left"
                >
                    <Radio.Group
                        onChange={(e) => {
                            form.setFieldsValue({
                                isLockExamScore: e.target.value,
                            })
                        }}
                    >
                        <Radio value={true}>Đã khóa</Radio>
                        <Radio value={false}>Chưa khóa</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    label="Hạn nhập điểm ĐQT"
                    name="scoreDeadline"
                    labelAlign="left"
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        placeholder="Chọn ngày"
                        format="DD/MM/YYYY"
                        disabled={isLockScore}
                        value={scoreDeadline}
                        onChange={(date) => {
                            form.setFieldsValue({
                                scoreDeadline: date ? dayjs(date) : null,
                            })
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Hạn nhập điểm thi "
                    name="examScoreDeadline"
                    labelAlign="left"
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        placeholder="Chọn ngày"
                        format="DD/MM/YYYY"
                        disabled={isLockExamScore}
                        value={examScoreDeadline}
                        onChange={(date) => {
                            form.setFieldsValue({
                                examScoreDeadline: date ? dayjs(date) : null,
                            })
                        }}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default HanNhapDiem
