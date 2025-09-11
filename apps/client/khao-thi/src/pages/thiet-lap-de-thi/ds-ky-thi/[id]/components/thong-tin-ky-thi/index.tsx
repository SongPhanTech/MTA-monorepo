import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import TreeSelectRoom from '@components/commons/room-select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import TreeSelectSubjectVersion from '@components/commons/subject-version-select'
import { useExamStatusOptions } from '@hooks/exam-status'
import useSpinner from '@hooks/spinner'
import { type Exam, ExamStatus, type StudentSubjectScore } from '@workspace/db'
import {
    useCreateExam,
    useCreateManyExamSession,
    useFindManyQuestionBank,
    useFindUniqueExam,
    useUpdateExam,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { ROUTER_PATH } from '@workspace/router'
import {
    Button,
    Checkbox,
    Col,
    DatePicker,
    Flex,
    Form,
    Input,
    InputNumber,
    message,
    Row,
    Select,
} from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
export type PutExamType = Exam & {
    subjectClass: string[]
    semesterId?: string
    room: string[]
}

interface InformationProps {
    id: string
    selectedIds?: string[]
}

export default function Information({ id, selectedIds }: InformationProps) {
    const router = useRouter()
    const [form] = Form.useForm<PutExamType>()
    const { options: examStatusOptions } = useExamStatusOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const [selectedSubjectVersionId, setSelectedSubjectVersionId] = useState<string>('')

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
            include: {
                subjectClass: { select: { id: true, semesterId: true } },
                questionBank: true,
                room: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    const { data: questionBankData } = useFindManyQuestionBank({
        where: {
            subjectVersion: {
                subjectClass: {
                    some: {
                        semesterId: selectedSemesterId || undefined,
                        cancelled: false,
                        id: selectedIds?.[0] || undefined,
                    },
                },
            },
        },
        include: { subjectVersion: true },
        orderBy: { createdAt: 'desc' },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                startTime: dayjs(initialValue.startTime),
                endTime: dayjs(initialValue.endTime),
                subjectClass: initialValue.subjectClass?.map((sc) => sc.id),
                semesterId: initialValue.subjectClass?.[0]?.semesterId || '',
                room: initialValue.room?.map((r) => r.id),
            })
            setSelectedSemesterId(initialValue.subjectClass?.[0]?.semesterId || '')
            if (initialValue.questionBank?.subjectVersionId) {
                setSelectedSubjectVersionId(initialValue.questionBank.subjectVersionId)
            }
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

    const { mutateAsync: createExam } = useCreateExam()
    const { mutateAsync: updateExam } = useUpdateExam()
    const { mutateAsync: createManyExamSession } = useCreateManyExamSession()
    async function onOk(output?: PutExamType) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                title: output.title,
                status: output.status,
                questionBank: {
                    connect: {
                        id: output.questionBankId,
                    },
                },
                startTime: output.startTime,
                endTime: output.endTime,
                duration: output.duration,
                passScore: output.passScore,
                shuffleQuestions: output.shuffleQuestions,
                shuffleAnswers: output.shuffleAnswers,
                showResult: output.showResult,
            }
            const res = await sqlTransaction([
                {
                    model: 'StudentSubjectScore',
                    operation: 'findMany',
                    data: {
                        where: {
                            subjectClassId: { in: output.subjectClass },
                            examBanned: false,
                        },
                        select: { studentId: true },
                    },
                },
            ])

            if (res.status !== 200) throw new Error('Lỗi khi tạo phiên thi cho sinh viên')

            const studentScores = res.data?.[0] as StudentSubjectScore[]
            if (id) {
                const oldSubjectClassIds = initialValue?.subjectClass?.map((sc) => sc.id) || []
                const newSubjectClassIds = output.subjectClass || []

                const hasSubjectClassChanged =
                    oldSubjectClassIds.length !== newSubjectClassIds.length ||
                    oldSubjectClassIds.some((id) => !newSubjectClassIds.includes(id))

                await updateExam({
                    data: {
                        ...data,
                        subjectClass: {
                            set: output.subjectClass?.map((item) => ({ id: item })) || [],
                        },
                        room: {
                            set: output.room?.map((item) => ({ id: item })) || [],
                        },
                    },
                    where: {
                        id,
                    },
                })

                if (hasSubjectClassChanged) {
                    await sqlTransaction([
                        {
                            model: 'ExamSession',
                            operation: 'deleteMany',
                            data: { where: { examId: id } },
                        },
                    ])

                    if (output.subjectClass?.length && studentScores.length) {
                        await createManyExamSession({
                            data: studentScores.map((s) => ({
                                studentId: s.studentId,
                                examId: id,
                            })),
                            skipDuplicates: true,
                        })
                    }
                }
                message.success('Cập nhật thành công')
            } else {
                const newExam = await createExam({
                    data: {
                        ...data,
                        subjectClass: {
                            connect: output.subjectClass?.map((item) => ({ id: item })) || [],
                        },
                        room: {
                            connect: output.room?.map((item) => ({ id: item })) || [],
                        },
                    },
                })

                if (output.subjectClass?.length && newExam?.id) {
                    if (studentScores.length) {
                        await createManyExamSession({
                            data: studentScores.map((s) => ({
                                studentId: s.studentId,
                                examId: newExam.id,
                            })),
                            skipDuplicates: true,
                        })
                    }
                }

                message.success('Thêm mới thành công')
                router.push(`${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/${newExam?.id}`)
            }
            queryClient.invalidateQueries({
                queryKey: ['Exam'],
            })
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

    const isDraft = useMemo(() => {
        if (!id) return true
        return initialValue?.status === ExamStatus.DRAFT
    }, [id, initialValue?.status])

    return (
        <Form form={form} layout="vertical" onFinish={onOk}>
            <Row gutter={16}>
                <Col span={12}>
                    <FormItem form={form} name="title" label="Tên kỳ thi" required>
                        <Input placeholder="Nhập tên kỳ thi" disabled={!isDraft} />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="duration" label="Thời gia thi (phút)" required>
                        <InputNumber
                            type="number"
                            className="w-full"
                            step={1}
                            placeholder="Nhập thời gian thi"
                            disabled={!isDraft}
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <Form.Item name="semesterId" label="Chọn kỳ học">
                        <TreeSelectSemester
                            onChange={(val) => setSelectedSemesterId(val)}
                            disabled={!isDraft}
                        />
                    </Form.Item>
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
                                subjectVersionId: subjectVersion?.id,
                            }))}
                            onChange={(value, option: any) => {
                                setSelectedSubjectVersionId(option?.subjectVersionId || '')
                            }}
                            allowClear
                            disabled={!isDraft}
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="subjectClass" label="Lớp thi">
                        <TreeSelectSubjectVersion
                            semesterId={selectedSemesterId}
                            subjectVersionId={selectedSubjectVersionId}
                            edit={!!id}
                            defaultValue={selectedIds}
                            disabled={!isDraft}
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="room" label="Phòng thi">
                        <TreeSelectRoom disabled={!isDraft} />
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
                            placeholder="Chọn thời gian bắt đầu"
                            disabled={!isDraft}
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
                            placeholder="Chọn thời gian kết thúc"
                            disabledDate={(current) => {
                                const startTime = form.getFieldValue('startTime')
                                if (!startTime) return false
                                return current && current < dayjs(startTime).startOf('day')
                            }}
                            disabled={!isDraft}
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem form={form} name="passScore" label="Điểm đạt" required>
                        <InputNumber
                            type="number"
                            className="w-full"
                            step={0.1}
                            defaultValue={5}
                            placeholder="Nhập điểm đạt"
                            disabled={!isDraft}
                        />
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
                <Col span={24}>
                    <FormItem form={form} name="shuffleQuestions" valuePropName="checked">
                        <Checkbox disabled={!isDraft}>Trộn thứ tự câu hỏi</Checkbox>
                    </FormItem>
                    <FormItem form={form} name="shuffleAnswers" valuePropName="checked">
                        <Checkbox disabled={!isDraft}>Trộn thứ tự đáp án</Checkbox>
                    </FormItem>
                    {/* <FormItem form={form} name="showResult" valuePropName="checked">
                        <Checkbox disabled={!isDraft}>Hiển thị kết quả ngay sau khi thi</Checkbox>
                    </FormItem> */}
                </Col>
                <Col span={24}>
                    <Flex justify="end" gap={8}>
                        {id ? (
                            <Button type="primary" onClick={() => form.submit()}>
                                Cập nhật
                            </Button>
                        ) : (
                            <>
                                <Button type="primary" onClick={() => router.back()}>
                                    Hủy
                                </Button>
                                <Button type="primary" onClick={() => form.submit()}>
                                    Lưu
                                </Button>
                            </>
                        )}
                    </Flex>
                </Col>
            </Row>
        </Form>
    )
}
