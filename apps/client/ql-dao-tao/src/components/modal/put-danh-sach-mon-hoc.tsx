import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutSubjectListModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSubjectListModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

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
            title={id ? 'Sửa danh sách môn học' : 'Thêm danh sách môn học'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="trainingObjectTypeId" label="ĐTĐT">
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map(
                            (i: TrainingObjectType) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            }
                        )}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="ĐV QL">
                    <Input placeholder="Nhập tên khóa" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã">
                    <Input placeholder="Nhập mã" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Mã TKB">
                    <Input placeholder="Nhập mã TKB" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Tên Môn Học">
                    <Input placeholder="Nhập tên môn học" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Tên Viết Tắt"
                >
                    <Input placeholder="Nhập tên viết tắt" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Tên Tiếng Anh"
                >
                    <Input placeholder="Nhập tên tiếng anh" />
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
                <FormItem form={form} name="trainingTypeId" label="ĐQ">
                    <Input placeholder="Nhập ĐQ" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Không TD">
                    <Input placeholder="Nhập Không TD" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="SV Max">
                    <Input placeholder="Nhập SV Max" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="HSHP">
                    <Input placeholder="Nhập HSHP" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="HSHP2">
                    <Input placeholder="Nhập HSHP2" />
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
                <FormItem form={form} name="trainingTypeId" label="SDD">
                    <Input placeholder="Nhập SDD" />
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

export default PutSubjectListModal
