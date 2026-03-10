import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ThesisSession } from '@workspace/db/client'
import {
    useCreateThesisSession,
    useFindManyTrainingCourse,
    useFindUniqueThesisSession,
    useUpdateThesisSession,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import Select from '@components/commons/select'
import { useFindManyTrainingObjectTypePermission } from '@workspace/ui'
import { useEffect, useState } from 'react'
export type PutThesisSession = ThesisSession
dayjs.locale('vi')

const PutThesisSession = () => {
    const [form] = Form.useForm<PutThesisSession>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutThesisSession',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: thesisSession } = useFindUniqueThesisSession({ where: { id } }, { enabled: !!id })

    useEffect(() => {
        if (thesisSession) {
            form.setFieldsValue({
                ...thesisSession,
                trainingCourseId: thesisSession.trainingCourseId,
                trainingObjectTypeId: thesisSession.trainingObjectTypeId,
                decisionNumber: thesisSession.decisionNumber,
                decisionMaker: thesisSession.decisionMaker,
                defenseDecisionNumber: thesisSession.defenseDecisionNumber,
                defenseDecisionMaker: thesisSession.defenseDecisionMaker,
                chief: thesisSession.chief,
                startDate: thesisSession.startDate ? dayjs(thesisSession.startDate) : undefined,
                endDate: thesisSession.endDate ? dayjs(thesisSession.endDate) : undefined,
                decisionDate: thesisSession.decisionDate
                    ? dayjs(thesisSession.decisionDate)
                    : undefined,
                defenseDecisionDate: thesisSession.defenseDecisionDate
                    ? dayjs(thesisSession.defenseDecisionDate)
                    : undefined,
            })
            setTrainingObjectId(thesisSession.trainingObjectTypeId)
        } else {
            form.setFieldsValue({})
        }
    }, [thesisSession, form])

    const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectTypePermission()
    const [trainingObjectId, setTrainingObjectId] = useState<string | null>(null)
    const { data: trainingCourses = [] } = useFindManyTrainingCourse(
        {
            where: { trainingObjectTypeId: trainingObjectId ?? ('' as string) },
            orderBy: {
                semesterStart: {
                    startDate: 'desc',
                },
            },
        },

        { enabled: !!trainingObjectId }
    )
    const { mutateAsync: createThesisSession } = useCreateThesisSession()
    const { mutateAsync: updateThesisSession } = useUpdateThesisSession()
    async function onOk(output?: PutThesisSession) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                name: output.name.trim(),
                startDate: output.startDate ? dayjs(output.startDate).toDate() : new Date(),
                trainingObjectTypeId: output.trainingObjectTypeId,
                trainingCourseId: output.trainingCourseId,
                decisionNumber: output.decisionNumber,
                decisionMaker: output.decisionMaker,
                decisionDate: output.decisionDate
                    ? dayjs(output.decisionDate).toDate()
                    : new Date(),
                defenseDecisionNumber: output.defenseDecisionNumber,
                defenseDecisionMaker: output.defenseDecisionMaker,
                defenseDecisionDate: output.defenseDecisionDate
                    ? dayjs(output.defenseDecisionDate).toDate()
                    : new Date(),
                chief: output.chief,
                endDate: output.endDate ? dayjs(output.endDate).toDate() : new Date(),
            }

            if (id) {
                await updateThesisSession({
                    data: payload,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createThesisSession({
                    data: {
                        ...payload,
                    },
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['ThesisSession'],
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

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đợt xét luận văn' : 'Thêm mới đợt xét luận văn'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đợt xét luận văn" required>
                    <Input placeholder="Nhập tên đợt xét luận văn" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypes.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        onChange={(value) => setTrainingObjectId(value)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingCourseId" label="Khóa học" required>
                    <Select
                        placeholder="Chọn khóa học"
                        options={trainingCourses?.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="decisionNumber" label="Số QĐĐT" required>
                    <Input placeholder="Nhập số QĐĐT" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="decisionMaker" label="Người ký QĐĐT" required>
                    <Input placeholder="Nhập người ký QĐĐT" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="decisionDate" label="Ngày QĐĐT" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày QĐĐT"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="defenseDecisionNumber" label="Số QĐBVLV" required>
                    <Input placeholder="Nhập số QĐBVLV" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="defenseDecisionMaker" label="Người ký QĐBVLV" required>
                    <Input placeholder="Nhập người ký QĐBVLV" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="defenseDecisionDate" label="Ngày QĐBVLV" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày QĐBVLV"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="chief" label="Thủ trưởng" required>
                    <Input placeholder="Nhập thủ trưởng" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày bắt đầu"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('startDate')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('day')
                        }}
                        placeholder="Chọn ngày kết thúc"
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutThesisSession
