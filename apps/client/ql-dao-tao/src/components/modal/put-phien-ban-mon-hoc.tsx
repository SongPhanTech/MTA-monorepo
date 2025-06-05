import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useFindManyTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutVersionSubjectModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutVersionSubjectModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTypeId: output.trainingTypeId,
                        trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTypeId: output.trainingTypeId,
                        trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingCourse({
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
            title={id ? 'Sửa phiên bản môn học' : 'Thêm phiên bản môn học'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Cơ sở cấp bằng"
                >
                    <Input placeholder="Nhập cơ sở cấp bằng" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="STC">
                    <Input placeholder="Nhập STC" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="STTKB">
                    <Input placeholder="Nhập STTKB" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="STLT">
                    <Input placeholder="Nhập STLT" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="STTL">
                    <Input placeholder="Nhập STTL" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="STTH">
                    <Input placeholder="Nhập STTH" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Không TD">
                    <Input placeholder="Nhập Không TD" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Thi">
                    <Input placeholder="Nhập hình thức thi" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="DBN">
                    <Input placeholder="Nhập DBN" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="SĐĐ">
                    <Input placeholder="Nhập SĐĐ" />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingTypeId"
                        label="Trạng thái"
                    >
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { label: 'Đang hoạt động', value: 'ACTIVE' },
                                { label: 'Ngừng đào tạo', value: 'IN_ACTIVE' },
                            ]}
                            allowClear
                        />
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

export default PutVersionSubjectModal
