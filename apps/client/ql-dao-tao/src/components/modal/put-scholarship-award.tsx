import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ScholarshipAward } from '@workspace/db'
import {
    useCreateScholarshipAward,
    useFindManyScholarship,
    useFindManyStudent,
    useFindUniqueScholarshipAward,
    useUpdateScholarshipAward,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import { queryClient } from '@api/index'
import Select from '@components/commons/select'
export type PutScholarshipAward = ScholarshipAward
dayjs.locale('vi')

type ScholarshipAwardInput = {
    id: string
    semesterId: string
}

const PutScholarshipAward = () => {
    const [form] = Form.useForm<PutScholarshipAward>()

    const { isOpen, onClose, input } = useDisclosure<ScholarshipAwardInput>({
        tag: PutScholarshipAward.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createScholarshipAward } = useCreateScholarshipAward()
    const { mutateAsync: updateScholarshipAward } = useUpdateScholarshipAward()
    async function onOk(output?: PutScholarshipAward) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.semesterId) {
                message.error('Thiếu mã học kỳ')
                hideSpinner()
                return
            }
            const data = {
                studentId: output?.studentId,
                semesterId: input?.semesterId,
                scholarshipId: output?.scholarshipId,
                amount: output?.amount,
                gpaAtAward: output?.gpaAtAward,
                priorityRank: output?.priorityRank,
            }
            if (input?.id) {
                await updateScholarshipAward({
                    data: data,
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createScholarshipAward({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: initialValue } = useFindUniqueScholarshipAward(
        {
            where: { id: input?.id },
        },
        { enabled: !!input?.id }
    )

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
                fullname: 'asc',
            },
        },
    })

    const { data: scholarshipData = [] } = useFindManyScholarship({
        where: {
            awards: {
                some: {
                    semesterId: input?.semesterId,
                },
            },
        },
        include: {
            trainingCourse: true,
        },
        orderBy: {
            rankOrder: 'asc',
        },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        } else {
            form.setFieldsValue({})
        }
    }, [initialValue])

    useEffect(() => {
        const currentScholarshipId = form.getFieldValue('scholarshipId')
        if (currentScholarshipId) {
            const selectedScholarship = scholarshipData.find((s) => s.id === currentScholarshipId)
            if (selectedScholarship) {
                const amount =
                    Number(selectedScholarship.baseAmount) * selectedScholarship.multiplier
                form.setFieldValue('amount', amount)
            }
        }
    }, [form, scholarshipData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Sửa xét học bổng' : 'Thêm xét học bổng'}
        >
            <Col span={12}>
                <FormItem form={form} name="studentId" label="Sinh viên" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn sinh viên"
                        options={studentData.map((i) => {
                            return {
                                value: i.id,
                                label: [i.userProfile.code, i.userProfile.fullname]
                                    .filter(Boolean)
                                    .join(' - '),
                            }
                        })}
                        disabled={!!input?.id}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="scholarshipId" label="Sinh viên" required>
                    <Select
                        maxTagCount={'responsive'}
                        placeholder="Chọn sinh viên"
                        options={scholarshipData.map((i) => {
                            return {
                                value: i.id,
                                label: [i.name, i.trainingCourse.name].filter(Boolean).join(' - '),
                            }
                        })}
                        onChange={(value) => {
                            const selected = scholarshipData.find((s) => s.id === value)
                            if (selected) {
                                form.setFieldValue(
                                    'amount',
                                    Number(selected.baseAmount) * selected.multiplier
                                )
                            }
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="amount" label="Số tiền học bổng">
                    <InputNumber
                        placeholder="Nhập số tiền học bổng"
                        className="w-full"
                        step={1}
                        disabled
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="gpaAtAward" label="GPA">
                    <InputNumber placeholder="Nhập GPA" className="w-full" step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="priorityRank" label="Xếp hạng xét học bổng">
                    <InputNumber placeholder="Nhập hệ số" className="w-full" step={1} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutScholarshipAward
