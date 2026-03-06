import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ScholarshipCriteria } from '@workspace/db/client'
import {
    useCreateScholarshipCriteria,
    useFindUniqueScholarshipCriteria,
    useUpdateScholarshipCriteria,
} from '@workspace/db/hooks'
import { Checkbox, Col, Form, Input, InputNumber, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import { useCriteriaFieldOptions } from '@hooks/criteriaField'
import { useCriteriaOperatorOptions } from '@hooks/criteriaOperator'
export type PutScholarshipCriteria = ScholarshipCriteria
dayjs.locale('vi')

type ScholarshipCriteriaInput = {
    scholarshipId: string
    scholarshipCriteriaId: string
}

const PutScholarshipCriteria = () => {
    const [form] = Form.useForm<PutScholarshipCriteria>()
    const { options: criteriaFieldOptions } = useCriteriaFieldOptions()
    const { options: criteriaOperatorOptions } = useCriteriaOperatorOptions()

    const { isOpen, onClose, input } = useDisclosure<ScholarshipCriteriaInput>({
        tag: 'PutScholarshipCriteria',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createScholarshipCriteria } = useCreateScholarshipCriteria()
    const { mutateAsync: updateScholarshipCriteria } = useUpdateScholarshipCriteria()
    async function onOk(output?: PutScholarshipCriteria) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.scholarshipId) {
                message.error('Thiếu mã học bổng')
                hideSpinner()
                return
            }
            const data = {
                code: output?.code,
                scholarshipId: input.scholarshipId,
                field: output?.field,
                // invert: output?.invert,
                operator: output?.operator,
                value: output?.value,
                // tuple: output?.tuple,
                bonusValue: output?.bonusValue,
                description: output?.description,
                active: output?.active,
            }
            if (input?.scholarshipCriteriaId) {
                await updateScholarshipCriteria({
                    data,
                    where: {
                        id: input?.scholarshipCriteriaId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createScholarshipCriteria({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SchoolYear'],
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

    const { data: initialValue } = useFindUniqueScholarshipCriteria(
        {
            where: { id: input?.scholarshipCriteriaId },
        },
        { enabled: !!input?.scholarshipCriteriaId }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                // invert: initialValue.invert,
            })
        } else {
            form.setFieldsValue({
                active: true,
                // invert: false,
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
                input?.scholarshipCriteriaId
                    ? 'Sửa tiêu chí xét học bổng'
                    : 'Thêm tiêu chí xét học bổng'
            }
        >
            <Col span={12}>
                <FormItem form={form} label="Trường được đánh giá" name="field" required>
                    <Select
                        placeholder="Chọn trường được đánh giá"
                        options={criteriaFieldOptions}
                        allowClear
                    />
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem
                    form={form}
                    name="invert"
                    valuePropName="checked"
                    className="mb-0"
                    label="Đảo ngược so sánh"
                >
                    <Checkbox />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <FormItem form={form} label="So sánh" name="operator" required>
                    <Select
                        placeholder="Chọn so sánh"
                        options={criteriaOperatorOptions}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="value" label="Giá trị ngưỡng để so sánh" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập giá trị ngưỡng"
                        className="w-full"
                        step={1}
                        min={0}
                    />
                </FormItem>
            </Col>
            {/* <Col span={24}>
                <FormItem form={form} name="tuple" label="Giá trị sử dụng cho operator IN">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col> */}

            <Col span={12}>
                <FormItem form={form} name="bonusValue" label="Cộng thêm điểm nếu đúng tiêu chí">
                    <InputNumber
                        type="number"
                        placeholder="Nhập điểm cộng nếu đúng tiêu chí"
                        className="w-full"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            {input?.scholarshipCriteriaId && (
                <Col span={12}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
                        <Radio.Group buttonStyle="solid">
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutScholarshipCriteria
