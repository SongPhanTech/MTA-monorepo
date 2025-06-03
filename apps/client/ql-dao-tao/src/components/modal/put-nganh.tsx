import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    TrainingField,
    SchoolYear,
    TrainingForm,
    TrainingLevel,
    TrainingType,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCreateTrainingField,
    useFindUniqueTrainingField,
    useFindManySchoolYear,
    useFindManyTrainingField,
    useUpdateTrainingField,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManyOrganization
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Switch } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
import TreeSelect from '@components/commons/tree-select/TreeSelect'
import { convertToTreeSelect } from '@/utils/convertOrganizationToTree'
export type PutTrainingField = TrainingField & {
    trainingObjectTypeIds: string[]
}
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutTrainingFieldModal = () => {
    const [form] = Form.useForm<PutTrainingField>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingFieldModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingFormData = [], refetch: refetchForm } =
        useFindManyTrainingForm()

    const { data: trainingTypeData = [], refetch: refetchType } =
        useFindManyTrainingType()
    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { data: organizations, refetch: refetchOrganizations } =
        useFindManyOrganization()
    // const { data: organizations = [], refetch: refetchTrainingFields } =
    //     useFindManyTrainingField()

    const { mutateAsync: createTrainingField } = useCreateTrainingField()
    const { mutateAsync: updateTrainingField } = useUpdateTrainingField()
    async function onOk(output?: PutTrainingField) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingField({
                    data: {
                        codeTrainingField: output.codeTrainingField,
                        name: output.name,
                        description: output.description,
                        publishDate: output.publishDate,
                        englishName: output.englishName,
                        status: output.status ? 'ACTIVE' : 'IN_ACTIVE',
                        organizationId: output.organizationId,
                        trainingObjectTypes: {
                            set:
                                output.trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                                    trainingFieldId_trainingObjectTypeId: {
                                        trainingFieldId: id,
                                        trainingObjectTypeId: trainingObjectTypeId
                                    }
                                }))

                        }
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingField({
                    data: {
                        codeTrainingField: output.codeTrainingField,
                        name: output.name,
                        description: output.description,
                        publishDate: output.publishDate,
                        englishName: output.englishName,
                        status: output.status ? 'ACTIVE' : 'IN_ACTIVE',
                        organizationId: output.organizationId,
                        trainingObjectTypes: {
                            createMany: {
                                data: output.trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                                    trainingObjectTypeId
                                }))
                            }
                        }
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingField'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingField({
        where: { id },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                publishDate: dayjs(level.publishDate),
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
            title={id ? 'Chỉnh sửa ngành' : 'Thêm mới ngành'}
            className="w-[45vw]"

        >
            <Col span={12}>
                <FormItem form={form} name="codeTrainingField" label="Mã ngành" required>
                    <Input placeholder="Nhập mã ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên ngành" required>
                    <Input placeholder="Nhập tên ngành" />
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
                    required
                    name="organizationId"
                    label="Chọn đơn vị"
                    className="mb-2"
                >
                    <TreeSelect
                        placeholder="Chọn đơn vị"
                        treeData={convertToTreeSelect(organizations || [])}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="publishDate"
                    label="Ngày ban hành"
                    required
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="status" label="">
                    <div className="flex items-center space-x-2">
                        <span className="text-[#000000e0]">Đang đào tạo</span>
                        <Switch />
                    </div>
                </FormItem>

            </Col>

        </PutFormModal>
    )
}

export default PutTrainingFieldModal
