import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useFindManyAcademicRankingConvert,
    useFindManyDiplomaType,
    useFindManyStudent,
    useFindUniqueGraduationDecision,
    useUpdateGraduationDecision,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Select } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import { type GraduationDecision, RankingContext } from '@workspace/db'
import dayjs from 'dayjs'
import { useEffect } from 'react'

dayjs.locale('vi')

type PutGraduationDecisionFormValues = GraduationDecision

const PutGraduationDecision = () => {
    const [form] = Form.useForm<PutGraduationDecisionFormValues>()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; trainingCourseId: string }>({
        tag: PutGraduationDecision.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateGraduationDecision } = useUpdateGraduationDecision()
    async function onOk(output?: PutGraduationDecisionFormValues) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                decisionDate: output?.decisionDate,
                notes: output?.notes,
                finalGpa: output?.finalGpa,
                finalRankingId: output?.finalRankingId,
                diplomaTypeId: output?.diplomaTypeId,
                diplomaNumber: output?.diplomaNumber,
                diplomaIssueDate: output?.decisionDate,
            }
            if (input?.id) {
                await updateGraduationDecision({
                    data: data,
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueGraduationDecision(
        {
            where: {
                id: input?.id,
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
                diplomaIssueDate:
                    initialValue.diplomaIssueDate && dayjs(initialValue.diplomaIssueDate),
            })
        } else {
            form.setFieldsValue({
                decisionDate: dayjs(),
            })
        }
    }, [initialValue])

    const { data: students, refetch } = useFindManyStudent({
        where: {
            fixedClass: {
                trainingCourseId: input?.trainingCourseId,
            },
        },
        include: {
            userProfile: true,
        },
        take: 500,
    })

    const { data: finalRankingData } = useFindManyAcademicRankingConvert(
        {
            where: {
                trainingCourseId: input?.trainingCourseId,
                context: RankingContext.GRADUATION,
            },
        },
        { enabled: !!input?.trainingCourseId }
    )

    const { data: diplomaTypeData } = useFindManyDiplomaType(
        {
            where: {
                curriculumVersion: {
                    some: {
                        fixedClasses: {
                            some: {
                                trainingCourseId: input?.trainingCourseId,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!input?.trainingCourseId }
    )

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Sửa quyết định tốt nghiệp' : 'Thêm quyết định tốt nghiệp'}
        >
            <Col span={12}>
                <FormItem form={form} name={'studentId'} label={'Sinh viên'} required>
                    <Select
                        placeholder={'Chọn sinh viên'}
                        options={students?.map((item) => ({
                            label: [item.code, item.userProfile.fullname]
                                .filter(Boolean)
                                .join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        filterOption={false}
                        allowClear
                        disabled={!!input?.id}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="decisionDate" label="Ngày duyệt đơn" required>
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
                <FormItem form={form} name={'finalRankingId'} label={'Xếp loại'} required>
                    <Select
                        placeholder={'Chọn xếp loại'}
                        options={finalRankingData?.map((item) => ({
                            label: [item.classification].filter(Boolean).join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        filterOption={false}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="finalGpa" label="GPA cuối cùng" required>
                    <InputNumber placeholder="Nhập gpa" step={0.1} className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'diplomaTypeId'} label={'Loại văn bằng'}>
                    <Select
                        placeholder={'Chọn loại văn bằng'}
                        options={diplomaTypeData?.map((item) => ({
                            label: [item.name].filter(Boolean).join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        filterOption={false}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="diplomaNumber" label="Số hiệu văn bằng">
                    <Input placeholder="Nhập số hiệu" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="diplomaIssueDate" label="Ngày cấp bằng">
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
                <FormItem form={form} name="notes" label="Ghi chú của hội đồng">
                    <Input.TextArea placeholder="Nhập ghi chú" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutGraduationDecision
