import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ScoreConvert } from '@workspace/db'
import {
    useCountScoreConvert,
    useCreateScoreConvert,
    useFindUniqueScoreConvert,
    useUpdateScoreConvert,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Switch } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutConvertScoreFormType = ScoreConvert
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutConvertScore = () => {
    const [form] = Form.useForm<PutConvertScoreFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutConvertScore.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createScoreConvert } = useCreateScoreConvert()
    const { mutateAsync: updateScoreConvert } = useUpdateScoreConvert()

    async function onOk(output?: PutConvertScoreFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateScoreConvert({
                    data: {
                        score10From: output.score10From,
                        score10To: output.score10To,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                        score4: output.score4,
                        scoreChar: output.scoreChar,
                        active: output.active,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createScoreConvert({
                    data: {
                        score10From: output.score10From,
                        score10To: output.score10To,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                        score4: output.score4,
                        scoreChar: output.scoreChar,
                        active: output.active,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: scoreConvertCount = 0 } = useCountScoreConvert()

    const { data: level } = useFindUniqueScoreConvert({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
        } 
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa chuyển đổi điểm' : 'Thêm mới chuyển đổi điểm'}
            className="w-[30vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="score10From" label="Từ điểm" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="score10To" label="Đến điểm" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="score4" label="Điểm hệ 4" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="scoreChar" label="Điểm chữ" required>
                    <Input
                        placeholder="Nhập điểm chữ"
                        maxLength={2}
                        style={{ width: '100%' }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="startDate"
                    label="Ngày bắt đầu"
                    required
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="endDate"
                    label="Ngày kết thúc"
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="active"
                    label="Kích hoạt"
                    valuePropName="checked"
                >
                    <Switch />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutConvertScore
