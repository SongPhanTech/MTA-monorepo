import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { AcademicRankingBaseType, type AcademicRankingConvert } from '@workspace/db'
import {
    useCreateAcademicRankingConvert,
    useFindManyTrainingCourse,
    useFindUniqueAcademicRankingConvert,
    useUpdateAcademicRankingConvert,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, Switch } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Select from '@components/commons/select'
export type PutAcademicRankingFormType = AcademicRankingConvert
dayjs.locale('vi')

const academicRankingBaseTypeOptions = [
    { label: 'Hệ 10', value: AcademicRankingBaseType.Base10 },
    { label: 'Hệ 4', value: AcademicRankingBaseType.Base4 },
]

const PutAcademicRanking = () => {
    const [form] = Form.useForm<PutAcademicRankingFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutAcademicRanking.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createAcademicRankingConvert } = useCreateAcademicRankingConvert()
    const { mutateAsync: updateAcademicRankingConvert } = useUpdateAcademicRankingConvert()
    const { data: trainingCourses } = useFindManyTrainingCourse({
        where: { active: true },
        orderBy: { name: 'asc' },
    })

    async function onOk(output?: PutAcademicRankingFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateAcademicRankingConvert({
                    data: output,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createAcademicRankingConvert({
                    data: output,
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

    const { data: level } = useFindUniqueAcademicRankingConvert(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa loại học lực' : 'Thêm mới loại học lực'}
            className="w-[40vw]"
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
                <FormItem form={form} name="base10Min" label="Hệ 10 từ" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="base10Max" label="Hệ 10 đến" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="base4Min" label="Điểm hệ 4 từ">
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="base4Max" label="Điểm hệ 4 đến">
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập điểm"
                        step={0.1}
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="baseScore" label="Loại hệ điểm" required>
                    <Select
                        placeholder="Chọn loại hệ điểm"
                        options={academicRankingBaseTypeOptions?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="graduated" label="Qua môn" required>
                    <Radio.Group>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
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

export default PutAcademicRanking
