import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { EVALUATION_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { $Enums, type EvaluationCouncilMember } from '@workspace/db'
import {
    useCreateEvaluationCouncilMember,
    useFindManyLecturer,
    useFindUniqueEvaluationCouncilMember,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { Col, Form, message } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvaluationCouncilMemberType = EvaluationCouncilMember
const PutEvaluationCouncilMember = () => {
    const [form] = Form.useForm<PutEvaluationCouncilMemberType>()
    const router = useRouter()
    const { isOpen, onClose, input } = useDisclosure<{
        evaluationCouncilId: string
        evaluationCouncilMemberId?: string
    }>({
        tag: 'PutEvaluationCouncilMember',
        onClose: form.resetFields,
    })
    const evaluationCouncilId = router.query.id as string

    const roleWatch = Form.useWatch('role', form)

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvaluationCouncilMember } = useCreateEvaluationCouncilMember()
    const { mutateAsync: updateEvaluationCouncilMember } = useUpdateEvaluationCouncilMember()
    async function onOk(output?: PutEvaluationCouncilMemberType) {
        if (!output || !input) return
        try {
            showSpinner()
            const data = {
                evaluationCouncilId: input.evaluationCouncilId,
                lecturerId: output.lecturerId,
                role: output.role,
            }
            if (input.evaluationCouncilMemberId && evaluationCouncilId) {
                await updateEvaluationCouncilMember({
                    data,
                    where: {
                        id: input.evaluationCouncilMemberId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createEvaluationCouncilMember({
                    data: {
                        ...data,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationCouncilMember'],
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

    const { data: lecturerData = [] } = useFindManyLecturer({
        include: {
            userProfile: {
                include: {
                    academicDegreeType: {
                        select: {
                            sTen: true,
                        },
                    },
                    academicRankType: {
                        select: {
                            sTen: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const { data: initialValue } = useFindUniqueEvaluationCouncilMember(
        {
            where: { id: input?.evaluationCouncilMemberId },
        },
        {
            enabled: !!input?.evaluationCouncilMemberId,
        }
    )

    console.log(roleWatch)

    const filteredLecturers = useMemo(() => {
        if (!roleWatch || roleWatch.length === 0) return lecturerData

        return lecturerData.filter((lecturer) => {
            const academicRank = lecturer.userProfile.academicRankType?.sTen || ''
            const degree = lecturer.userProfile.academicDegreeType?.sTen || ''

            const isChairmanQualified =
                academicRank.includes('Giáo sư') || degree.includes('Tiến sĩ')
            const isVicePresidentQualified =
                academicRank.includes('Giáo sư') ||
                degree.includes('Tiến sĩ') ||
                degree.includes('Thạc sĩ')

            const isSecretaryQualified =
                degree.includes('Thạc sĩ') ||
                degree.includes('Tiến sĩ') ||
                academicRank.includes('Giáo sư') ||
                academicRank.includes('Giảng viên')

            if (roleWatch.includes($Enums.EvaluationMemberRole.CHAIRMAN) && isChairmanQualified) {
                return true
            }

            if (
                roleWatch.includes($Enums.EvaluationMemberRole.VICE_PRESIDENT) &&
                isVicePresidentQualified
            ) {
                return true
            }

            if (roleWatch.includes($Enums.EvaluationMemberRole.SECRETARY) && isSecretaryQualified) {
                return true
            }

            return true
        })
    }, [roleWatch, lecturerData])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
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
            title={
                input?.evaluationCouncilMemberId
                    ? 'Chỉnh sửa hội đồng đánh giá'
                    : 'Thêm mới hội đồng đánh giá'
            }
            className="w-[600px]"
        >
            <Col span={24}>
                <FormItem form={form} name="role" label="Chức vụ trong hội đồng" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn chức vụ trong hội đồng"
                        options={EVALUATION_MEMBER_ROLE}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="lecturerId" label="Giảng viên">
                    <Select
                        placeholder="Chọn giảng viên"
                        options={filteredLecturers.map((i) => {
                            const academicRank = i.userProfile?.academicRankType?.sTen || ''
                            const degree = i.userProfile?.academicDegreeType?.sTen || ''

                            const fullName = i?.userProfile?.fullname
                                ? i?.userProfile?.fullname
                                : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`

                            const academicTitle = [academicRank, degree].filter(Boolean).join('.')

                            return {
                                value: i?.id,
                                label: `${i.code} - ${academicTitle ? `${academicTitle} ` : ''}${fullName}`,
                            }
                        })}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationCouncilMember
