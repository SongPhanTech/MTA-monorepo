import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ScoreConvert } from '@workspace/db/client'
import {
    useCreateScoreConvert,
    useFindManyTrainingCourse,
    useFindUniqueScoreConvert,
    useUpdateScoreConvert,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, Switch } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Select from '@components/commons/select'
import { useTrainingObjectTypeStore } from '@workspace/ui'
export type PutConvertScoreFormType = ScoreConvert
dayjs.locale('vi')
const PutConvertScore = () => {
    const [form] = Form.useForm<PutConvertScoreFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutConvertScore',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createScoreConvert } = useCreateScoreConvert()
    const { mutateAsync: updateScoreConvert } = useUpdateScoreConvert()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingCourses } = useFindManyTrainingCourse({
        where: { active: true, trainingObjectTypeId },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    async function onOk(output?: PutConvertScoreFormType) {
        if (!output) return
        try {
            showSpinner()
            if (output?.base10Min >= output?.base10Max) {
                message.error('Điểm hệ 10 từ phải nhỏ hơn điểm hệ 10 đến')
                return
            }
            if (id) {
                await updateScoreConvert({
                    data: output,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createScoreConvert({
                    data: output,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['ScoreConvert'],
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

    const { data: level } = useFindUniqueScoreConvert(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
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
            className="w-[600px]"
        >
            <Col span={12}>
                <FormItem form={form} name="trainingCourseId" label="Khoá học" required>
                    <Select
                        options={trainingCourses?.map(({ id, name }) => ({
                            value: id,
                            label: name,
                        }))}
                        placeholder="Chọn khoá học"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="classification" label="Xếp loại" required>
                    <Input placeholder="Xuất sắc..." />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="base10Min"
                    label="Hệ 10 từ"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập điểm hệ 10',
                        },
                    ]}
                >
                    <InputNumber
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                        max={10}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="base10Max"
                    label="Hệ 10 đến"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập điểm hệ 10',
                        },
                    ]}
                >
                    <InputNumber
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                        max={10}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="base4" label="Điểm hệ 4" required>
                    <InputNumber
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                        max={4}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="letter" label="Điểm chữ" required>
                    <Input placeholder="Nhập điểm chữ" maxLength={2} style={{ width: '100%' }} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="pass" label="Qua môn" required>
                    <Radio.Group>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="improvementRegister"
                    label="Cho phép cải thiện"
                    required
                >
                    <Radio.Group>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={4}>
                <FormItem form={form} name="active" label="Kích hoạt" valuePropName="checked">
                    <Switch defaultValue={true} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutConvertScore
