import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { type GraduationSession, GraduationSessionStatus } from '@workspace/db'
import {
    useCreateGraduationSession,
    useFindUniqueGraduationSession,
    useUpdateGraduationSession,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import { useGraduationSessionStatusOptions } from '@hooks/graduationSessionStatus'
import { useEffect } from 'react'
export type PutGraduationSession = GraduationSession
dayjs.locale('vi')

const PutGraduationSession = () => {
    const { graduationSessionStatusOptions } = useGraduationSessionStatusOptions()
    const [form] = Form.useForm<PutGraduationSession>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutGraduationSession.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: graduationSession } = useFindUniqueGraduationSession(
        { where: { id } },
        { enabled: !!id }
    )

    useEffect(() => {
        if (graduationSession) {
            form.setFieldsValue({
                ...graduationSession,
                sessionDate: graduationSession.sessionDate
                    ? dayjs(graduationSession.sessionDate)
                    : undefined,
                applicationStart: graduationSession.applicationStart
                    ? dayjs(graduationSession.applicationStart)
                    : undefined,
                applicationEnd: graduationSession.applicationEnd
                    ? dayjs(graduationSession.applicationEnd)
                    : undefined,
            })
        } else {
            form.setFieldsValue({
                status: GraduationSessionStatus.PLANNING,
            })
        }
    }, [graduationSession, form])

    const { mutateAsync: createGraduationSession } = useCreateGraduationSession()
    const { mutateAsync: updateGraduationSession } = useUpdateGraduationSession()
    async function onOk(output?: PutGraduationSession) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                name: output.name,
                sessionDate: output.sessionDate,
                applicationStart: output.applicationStart,
                applicationEnd: output.applicationEnd,
                status: output.status,
            }

            if (id) {
                await updateGraduationSession({
                    data: payload,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createGraduationSession({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlock'],
            })
            onClose()
        } catch (_error) {
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
            title={id ? 'Chỉnh sửa đợt xét tốt nghiệp' : 'Thêm mới đợt xét tốt nghiệp'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đợt xét tốt nghiệp" required>
                    <Input placeholder="Nhập tên đợt xét tốt nghiệp" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="sessionDate" label="Ngày họp dội đồng" required>
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
                <FormItem
                    form={form}
                    name="applicationStart"
                    label="Ngày bắt đầu nhận đơn"
                    required
                >
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
                <FormItem form={form} name="applicationEnd" label="Ngày kết thúc nhận đơn" required>
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
                <FormItem form={form} name="status" label="Trạng thái" required>
                    <Select
                        placeholder="Chọn trạng thái"
                        options={graduationSessionStatusOptions?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                        defaultValue={GraduationSessionStatus.PLANNING}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutGraduationSession
