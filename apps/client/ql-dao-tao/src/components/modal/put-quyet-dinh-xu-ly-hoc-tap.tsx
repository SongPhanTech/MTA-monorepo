import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    AcademicActionType,
    DecisionStatus,
    type DocumentFile,
    type StudentAcademicDecision,
} from '@workspace/db'
import {
    useCreateStudentAcademicDecision,
    useFindManyStudent,
    useFindUniqueStudentAcademicDecision,
    useUpdateStudent,
    useUpdateStudentAcademicDecision,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import DocumentPaths from '@components/commons/documentPaths'
import Select from '@components/commons/select'
import { useDecisionStatusOptions } from '@hooks/decisionStatus'
export type PutStudentAcademicDecision = StudentAcademicDecision & {
    documentEvidence?: DocumentFile[]
}
dayjs.locale('vi')

type StudentAcademicDecisionInput = {
    id: string
    semesterId: string
    actionTaken: AcademicActionType
}

const PutStudentAcademicDecision = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutStudentAcademicDecision>()
    const { options: decisionStatusOptions } = useDecisionStatusOptions()

    const { isOpen, onClose, input } = useDisclosure<StudentAcademicDecisionInput>({
        tag: PutStudentAcademicDecision.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createStudentAcademicDecision } = useCreateStudentAcademicDecision()
    const { mutateAsync: updateStudentAcademicDecision } = useUpdateStudentAcademicDecision()
    const { mutateAsync: updateStudent } = useUpdateStudent()
    async function onOk(output?: PutStudentAcademicDecision) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.semesterId) {
                message.error('Thiếu mã học kỳ')
                hideSpinner()
                return
            }
            const baseData = {
                studentId: output?.studentId,
                semesterId: input.semesterId,
                actionTaken: input.actionTaken,
                decisionDate: output?.decisionDate,
                reason: output?.reason,
                status: output?.status,
            }
            if (input?.id) {
                const updateData = {
                    ...baseData,
                    documentEvidence: {
                        upsert: (output.documentEvidence || [])
                            .filter((file) => !!file.id)
                            .map((file) => ({
                                where: { id: file.id },
                                create: {
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                    studentAcademicDecision: { connect: { id: input?.id } },
                                },
                                update: {
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                },
                            })),
                        create: (output.documentEvidence || [])
                            .filter((file) => !file.id)
                            .map((file) => ({
                                name: file.name,
                                path: file.path,
                                mimeType: file.mimeType,
                                size: file.size,
                            })),
                        disconnect: document
                            .filter(
                                (existing) =>
                                    !output.documentEvidence?.some((f) => f.id === existing.id)
                            )
                            .map((file) => ({ id: file.id })),
                    },
                }
                await updateStudentAcademicDecision({
                    data: updateData,
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createStudentAcademicDecision({
                    data: {
                        ...baseData,
                        documentEvidence: {
                            create: (output.documentEvidence || []).map((file) => ({
                                name: file.name,
                                path: file.path,
                                mimeType: file.mimeType,
                                size: file.size,
                            })),
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            if (output.status === DecisionStatus.APPROVED) {
                let studentUpdateData = {}

                switch (input.actionTaken) {
                    case AcademicActionType.EXPULSION:
                        studentUpdateData = { expelled: true }
                        break
                    case AcademicActionType.SUSPENSION:
                        studentUpdateData = { suspended: true }
                        break
                }

                if (Object.keys(studentUpdateData).length > 0) {
                    await updateStudent({
                        where: { id: output.studentId },
                        data: studentUpdateData,
                    })
                }
            }
            queryClient.invalidateQueries({
                queryKey: ['StudentAcademicDecision'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueStudentAcademicDecision(
        {
            where: { id: input?.id },
            include: {
                documentEvidence: true,
            },
        },
        { enabled: !!input?.id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                decisionDate: initialValue.decisionDate && dayjs(initialValue.decisionDate),
            })
            setDocument(initialValue?.documentEvidence)
        } else {
            form.setFieldsValue({
                documentEvidence: [],
                decisionDate: dayjs(),
            })
            setDocument([])
        }
    }, [initialValue])

    const { data: studentData = [] } = useFindManyStudent({
        where: {
            studentSemesterResult: {
                some: {
                    semesterId: input?.semesterId,
                },
            },
        },
        include: {
            userProfile: true,
        },
        orderBy: {
            userProfile: {
                fullname: 'asc',
            },
        },
    })

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Sửa quyết định' : 'Thêm quyết định'}
        >
            <Col span={12}>
                <FormItem form={form} name="studentId" label="Sinh viên" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn sinh viên"
                        options={studentData.map((i) => {
                            return {
                                value: i.id,
                                label: [i.code, i.userProfile?.fullname]
                                    .filter(Boolean)
                                    .join(' - '),
                            }
                        })}
                        disabled={!!input?.id}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="decisionDate" label="Ngày quyết định" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        defaultValue={dayjs()}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} label="Trạng thái" name="status" required>
                    <Select
                        placeholder="Chọn trạng thái"
                        options={decisionStatusOptions}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="reason" label="Ghi chú lý do">
                    <Input.TextArea placeholder="Nhập ghi chú" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="documentEvidence"
                    label="Minh chứng (biên bản họp, quyết định...)"
                >
                    <DocumentPaths
                        form={form}
                        data={document}
                        relationId={input?.id ?? ''}
                        relationType="studentAcademicDecisionId"
                        titleForm="documentEvidence"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutStudentAcademicDecision
