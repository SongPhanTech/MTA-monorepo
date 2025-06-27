import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type {
    TrainingField,
    TrainingMajor,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCreateTrainingMajor,
    useFindManyDM_DonVi,
    useFindManyTrainingField,
    useFindManyTrainingObjectType,
    useFindUniqueTrainingMajor,
    useUpdateTrainingMajor,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, Radio, TreeSelect, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutTrainingMajor = TrainingMajor & {
    trainingObjectTypeIds: string[]
}
dayjs.locale('vi')
const PutTrainingMajorModal = () => {
    const [form] = Form.useForm<PutTrainingMajor>()
    const [targetDisabled, setTargetDisabled] = useState(true)
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingMajorModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { data: trainingFieldData = [], refetch: refetchManyTrainingField } =
        useFindManyTrainingField()

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType({
            where: {
                trainingFields: {
                    some: {
                        trainingFieldId: form.getFieldValue('trainingFieldId'),
                    },
                },
            },
        })

    const { data: organizations = [], refetch: refetchOrganizations } =
        useFindManyDM_DonVi()
    const treeData = buildOrgTree(organizations)

    const { mutateAsync: createTrainingMajor } = useCreateTrainingMajor()
    const { mutateAsync: updateTrainingMajor } = useUpdateTrainingMajor()
    async function onOk({ trainingObjectTypeIds, ...rest }: PutTrainingMajor) {
        try {
            showSpinner()
            if (id) {
                await updateTrainingMajor({
                    data: {
                        ...rest,
                        trainingObjectTypes: {
                            createMany: {
                                data: trainingObjectTypeIds.map(
                                    (trainingObjectTypeId) => ({
                                        trainingObjectTypeId,
                                    })
                                ),
                                skipDuplicates: true,
                            },
                            deleteMany: {
                                trainingMajorId: id,
                                trainingObjectTypeId: {
                                    notIn: trainingObjectTypeIds,
                                },
                            },
                        },
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingMajor({
                    data: {
                        ...rest,
                        trainingObjectTypes: {
                            createMany: {
                                data: trainingObjectTypeIds.map(
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

    const { data: level } = useFindUniqueTrainingMajor(
        {
            where: { id },
            include: {
                organization: true,
                trainingObjectTypes: true,
            },
        },
        { enabled: !!id }
    )

    const handleMajorChange = async (val: string) => {
        try {
            form.setFieldsValue({
                trainingObjectTypeIds: [],
            })
            setTargetDisabled(true)
            await refetchObjectType()
            if (form.getFieldValue('trainingFieldId')) {
                setTargetDisabled(false)
            } else {
                setTargetDisabled(true)
            }
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            setTargetDisabled(false)
            form.setFieldsValue({
                ...level,
                trainingObjectTypeIds: level.trainingObjectTypes.map(
                    (i) => i?.trainingObjectTypeId
                ),
            })
        } else {
            form.setFieldsValue({
                active: true,
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
            title={id ? 'Chỉnh sửa chuyên ngành' : 'Thêm mới chuyên ngành'}
            className="w-[900px]"
        >
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
                                label: i?.code
                                    ? `${i?.code} - ${i.name}`
                                    : i?.name,
                            }
                        })}
                        onChange={(val) => handleMajorChange(val)}
                    />
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
                        maxTagCount={'responsive'}
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map(
                            (i: TrainingObjectType) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            }
                        )}
                        disabled={targetDisabled}
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
                        allowClear
                        showSearch
                        placeholder="Chọn đơn vị phụ trách"
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string)
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã chuyên ngành"
                    required
                >
                    <Input placeholder="Nhập mã chuyên ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="summary" label="Viết tắt" required>
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
                <FormItem form={form} name="englishName" label="Tên tiếng anh">
                    <Input placeholder="Nhập tên tiếng anh" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsMajor"
                    label="Số TC Chuyên Ngành"
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsRequired"
                    label="Số TC Bắt Buộc"
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberCreditsElective"
                    label="Số TC Lựa Chọn"
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
                <FormItem
                    form={form}
                    name={'active'}
                    label="Trạng thái"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingMajorModal
