import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { DisciplinaryWarning } from '@workspace/db'
import {
    useCreateDisciplinaryWarning,
    useFindManyDisciplinaryWarningReason,
    useFindManyStudent,
    useFindUniqueDisciplinaryWarning,
    useUpdateDisciplinaryWarning,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutDisciplinaryWarningFromType = DisciplinaryWarning & {
    reasonIds: string[]
}

type DisciplinaryWarningInput = {
    id: string
    semesterId: string
}

dayjs.locale('vi')
const PutDisciplinaryWarning = () => {
    const [form] = Form.useForm<PutDisciplinaryWarningFromType>()
    const { isOpen, onClose, input } = useDisclosure<DisciplinaryWarningInput>({
        tag: 'PutDisciplinaryWarning',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

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
            studentSemesterResult: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const { data: reasonData = [] } = useFindManyDisciplinaryWarningReason({
        orderBy: {
            name: 'asc',
        },
    })

    const studentId = Form.useWatch('studentId', form)
    const reasonIds = Form.useWatch('reasonIds', form)

    useEffect(() => {
        if (!studentId) return

        const selectedStudent = studentData.find((student) => student.id === studentId)

        if (selectedStudent) {
            const currentLevel = selectedStudent.disciplinaryWarningLevel || 0

            form.setFieldsValue({
                increasedFrom: currentLevel,
            })

            const sumSeverity =
                reasonIds && Array.isArray(reasonIds)
                    ? reasonData
                          .filter((reason) => reasonIds.includes(reason.id))
                          .reduce((sum, reason) => sum + reason.severityLevel, 0)
                    : 0

            form.setFieldsValue({
                level: currentLevel + sumSeverity,
            })
        }
    }, [studentId, studentData, reasonIds, form, reasonData])

    const { mutateAsync: createDisciplinaryWarning } = useCreateDisciplinaryWarning()
    const { mutateAsync: updateDisciplinaryWarning } = useUpdateDisciplinaryWarning()
    const { mutateAsync: updateStudent } = useUpdateStudent()
    async function onOk({ reasonIds, ...rest }: PutDisciplinaryWarningFromType) {
        try {
            showSpinner()
            const data = {
                ...rest,
                semesterId: input?.semesterId,
            }
            if (input?.id) {
                await updateDisciplinaryWarning({
                    data: data,
                    where: { id: input?.id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createDisciplinaryWarning({
                    data: {
                        ...data,
                        reasonDetails: {
                            connect: reasonIds.map((id) => ({ id })),
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }

            await updateStudent({
                where: { id: studentId },
                data: {
                    disciplinaryWarningLevel: rest.level,
                },
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

    const { data: initialValue } = useFindUniqueDisciplinaryWarning(
        {
            where: { id: input?.id },
            include: { reasonDetails: { select: { id: true } } },
        },
        { enabled: !!input?.id }
    )

    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                reasonIds: initialValue.reasonDetails?.map(({ id }) => id) || [],
            })
        } else {
            form.setFieldsValue({ increasedFrom: 0, level: 0, reasonIds: [] })
        }
    }, [initialValue, form.setFieldsValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.id ? 'Chỉnh sửa xét cảnh cáo học đường' : 'Thêm mới xét cảnh cáo học đường'
            }
        >
            <Col span={12}>
                <FormItem form={form} name="studentId" label="Sinh viên" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn sinh viên"
                        options={studentData.map((i) => {
                            return {
                                value: i.id,
                                label: [i.code, i.userProfile.fullname].filter(Boolean).join(' - '),
                            }
                        })}
                        disabled={!!input?.id}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="increasedFrom" label="Mức CCHĐ hiện tại">
                    <InputNumber
                        type="number"
                        placeholder="Nhập hệ số"
                        className="w-full"
                        step={1}
                        disabled
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="reasonIds" label="Nguyên do" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn nguyên do"
                        options={reasonData.map((i) => {
                            return {
                                value: i.id,
                                label: `${i.name} (tăng ${i.severityLevel} mức)`,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="level" label="Mức CCHĐ" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập độ ưu tiên"
                        className="w-full"
                        min={1}
                        step={1}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutDisciplinaryWarning
