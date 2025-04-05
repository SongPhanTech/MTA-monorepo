import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingCourse, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse
const PutTrainingCourseModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingCourseModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingFormData = [], refetch: refetchForm } = useFindManyTrainingForm({
        take: 1000,
        skip: 0,
    });

    const { data: trainingTypeData = [], refetch: refetchType } = useFindManyTrainingType({
        take: 1000,
        skip: 0,
    });
    const { data: trainingLevelData = [], refetch: refetchLevel } = useFindManyTrainingLevel({
        take: 1000,
        skip: 0,
    });
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } = useFindManyTrainingObjectType({
        take: 1000,
        skip: 0,
    });

    const { data: organizations = [], refetch: refetchTrainingCourses } = useFindManyTrainingCourse({
        take: 1000,
        skip: 0,
    })

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
                endDate: dayjs(level.endDate)
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
            title={
                id
                    ? 'Chỉnh sửa khóa'
                    : 'Thêm mới khóa'
            }
            className="w-[30vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã khóa"
                    required
                >
                    <Input placeholder='Nhập mã khóa' />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên khóa"
                    required
                >
                    <Input placeholder="Nhập tên khóa" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select placeholder='Chọn đối tượng đào tạo' options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Loại hình đào tạo"
                    required
                >
                    <Select placeholder='Chọn loại hình đào tạo' options={trainingTypeData.map((i: TrainingType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingFormId"
                    label="Hình thức đào tạo"
                    required
                >
                    <Select placeholder='Chọn hình thức đào tạo' options={trainingFormData.map((i: TrainingForm) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLevelId"
                    label="Trình độ đào tạo"
                    required
                >
                    <Select placeholder='Chọn trình độ đào tạo' options={trainingLevelData.map((i: TrainingLevel) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
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

export default PutTrainingCourseModal
