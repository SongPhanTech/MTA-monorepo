import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type { TrainingField, TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingField,
    useFindManyDM_DonVi,
    useFindManyTrainingObjectType,
    useFindUniqueTrainingField,
    useUpdateTrainingField,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutTrainingField = TrainingField & {
    trainingObjectTypeIds: string[]
}
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { data: organizations = [], refetch: refetchOrganizations } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(organizations)

    const { mutateAsync: createTrainingField } = useCreateTrainingField()
    const { mutateAsync: updateTrainingField } = useUpdateTrainingField()
    async function onOk({ trainingObjectTypeIds, ...rest }: PutTrainingField) {
        try {
            showSpinner()
            if (id) {
                await updateTrainingField({
                    data: {
                        ...rest,
                        trainingObjectTypes: {
                            createMany: {
                                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                                    trainingObjectTypeId,
                                })),
                                skipDuplicates: true,
                            },
                            deleteMany: {
                                trainingFieldId: id,
                                trainingObjectTypeId: {
                                    notIn: trainingObjectTypeIds,
                                },
                            },
                        },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingField({
                    data: {
                        ...rest,
                        trainingObjectTypes: {
                            createMany: {
                                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                                    trainingObjectTypeId,
                                })),
                            },
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingField'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: level } = useFindUniqueTrainingField(
        {
            where: { id },
            include: {
                organization: true,
                trainingObjectTypes: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                trainingObjectTypeIds: level.trainingObjectTypes.map(
                    (i: { trainingObjectTypeId: string }) => i?.trainingObjectTypeId
                ),
                publishDate: dayjs(level.publishDate),
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
            title={id ? 'Chỉnh sửa ngành' : 'Thêm mới ngành'}
            className="w-[900px]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã ngành" required>
                    <Input placeholder="Nhập mã ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên ngành" required>
                    <Input placeholder="Nhập tên ngành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="englishName" label="Tên tiếng anh" required>
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
                        maxTagCount={'responsive'}
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map((i: TrainingObjectType) => {
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
                    label="Chọn đơn vị"
                    className="mb-2"
                >
                    <TreeSelect
                        allowClear
                        showSearch
                        placeholder="Chọn đơn vị quản lý"
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="publishDate" label="Ngày ban hành" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingFieldModal
