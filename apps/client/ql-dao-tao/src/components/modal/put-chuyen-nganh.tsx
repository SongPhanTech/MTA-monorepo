import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    TrainingMajor,
    TrainingObjectType,
    TrainingField,
} from '@workspace/db'
import { $Enums } from '@workspace/db'
import {
    useCreateTrainingMajor,
    useFindUniqueTrainingMajor,
    useUpdateTrainingMajor,
    useFindManyTrainingObjectType,
    useFindManyTrainingField,
    useFindManyOrganization,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio, InputNumber } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
import TreeSelect from '@components/commons/tree-select/TreeSelect'
import { convertToTreeSelect } from '@/utils/convertOrganizationToTree'
export type PutTrainingMajor = TrainingMajor & {
    trainingObjectTypeIds: string[]
}
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutTrainingMajorModal = () => {
    const [form] = Form.useForm<PutTrainingMajor>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingMajorModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()
    const { data: trainingFieldData = [], refetch: refetchTrainingMajor } =
        useFindManyTrainingField()

    const { data: organizations, refetch: refetchOrganizations } =
        useFindManyOrganization()

    const { mutateAsync: createTrainingMajor } = useCreateTrainingMajor()
    const { mutateAsync: updateTrainingMajor } = useUpdateTrainingMajor()
    async function onOk(output?: PutTrainingMajor) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingMajor({
                    data: {
                        codeTrainingMajor: output.codeTrainingMajor,
                        name: output.name,
                        sumary: output.sumary,
                        description: output.description,
                        englishName: output.englishName,
                        status: output.status,
                        organizationId: output.organizationId,
                        trainingFieldId: output.trainingFieldId,
                        numberCreditsMajor: output.numberCreditsMajor,
                        numberCreditsRequired: output.numberCreditsRequired,
                        numberCreditsElective: output.numberCreditsElective,
                        trainingObjectTypes: {
                            set: output.trainingObjectTypeIds.map(
                                (trainingObjectTypeId) => ({
                                    trainingMajorId_trainingObjectTypeId: {
                                        trainingMajorId: id,
                                        trainingObjectTypeId:
                                            trainingObjectTypeId,
                                    },
                                })
                            ),
                        },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingMajor({
                    data: {
                        codeTrainingMajor: output.codeTrainingMajor,
                        name: output.name,
                        sumary: output.sumary,
                        description: output.description,
                        englishName: output.englishName,
                        status: output.status,
                        organizationId: output.organizationId,
                        trainingFieldId: output.trainingFieldId,
                        numberCreditsMajor: output.numberCreditsMajor,
                        numberCreditsRequired: output.numberCreditsRequired,
                        numberCreditsElective: output.numberCreditsElective,
                        trainingObjectTypes: {
                            createMany: {
                                data: output.trainingObjectTypeIds.map(
                                    (trainingObjectTypeId) => ({
                                        trainingObjectTypeId,
                                    })
                                ),
                            },
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingMajor'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingMajor({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
            })
        }
    }, [level])
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        form.setFieldsValue({
            status: 'ACTIVE',
        })
    }, [])
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa chuyên ngành' : 'Thêm mới chuyên ngành'}
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeIds"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select
                        mode="multiple"
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
                <FormItem
                    form={form}
                    name="trainingFieldId"
                    label="Ngành"
                    required
                >
                    <Select
                        placeholder="Chọn ngành"
                        options={trainingFieldData.map((i: TrainingField) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    required
                    name="organizationId"
                    label="Khoa phụ trách"
                    className="mb-2"
                >
                    <TreeSelect
                        placeholder="Chọn khoa phụ trách"
                        treeData={convertToTreeSelect(organizations || [])}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="codeTrainingMajor"
                    label="Mã chuyên ngành"
                    required
                >
                    <Input placeholder="Nhập mã chuyên ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="sumary" label="Viết tắt" required>
                    <Input placeholder="Nhập viết tắt" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên chuyên ngành"
                    required
                >
                    <Input placeholder="Nhập tên chuyên ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="englishName"
                    label="Tên tiếng anh"
                    required
                >
                    <Input placeholder="Nhập tên tiếng anh" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsMajor"
                    label="Số TC Chuyên Ngành"
                    required
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsRequired"
                    label="Số TC Bắt Buộc"
                    required
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsElective"
                    label="Số TC Lựa Chọn"
                    required
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={24}>
                <Col span={24}>
                    <FormItem
                        form={form}
                        name={'status'}
                        label="Trạng thái"
                        required
                    >
                        <Radio.Group buttonStyle="solid">
                            <Radio value={$Enums.TrainingFieldStatus.ACTIVE}>
                                Đang hoạt động
                            </Radio>
                            <Radio value={$Enums.TrainingFieldStatus.IN_ACTIVE}>
                                Ngừng hoạt động
                            </Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingMajorModal
