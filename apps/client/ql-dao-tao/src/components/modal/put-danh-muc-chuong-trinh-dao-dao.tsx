import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Curriculum, TrainingMajor } from '@workspace/db'
import {
    useFindUniqueCurriculum,
    useCreateCurriculum,
    useUpdateCurriculum,
    useFindManyOrganization,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutCurriculum = Curriculum
import 'dayjs/locale/vi'
import type React from 'react'
import './index.css'
import { buildOrgTree } from '@lib/utils'
dayjs.locale('vi')

const PutCurriculum = () => {
    const [form] = Form.useForm<PutCurriculum>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCurriculum.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: manageOrgData = [] } = useFindManyOrganization()

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor()

    const { mutateAsync: createCurriculum } = useCreateCurriculum()
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function onOk(output?: PutCurriculum) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateCurriculum({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingMajorId: output.trainingMajorId,
                        managementOrganizationId:
                            output.managementOrganizationId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculum({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingMajorId: output.trainingMajorId,
                        managementOrganizationId:
                            output.managementOrganizationId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: initialData } = useFindUniqueCurriculum({
        where: { id },
    })
    const treeData = buildOrgTree(manageOrgData)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
            })
        }
    }, [initialData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Sửa danh mục chương trình đào tạo'
                    : 'Thêm danh mục chương trình đào tạo'
            }
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên danh mục (tiếng việt)"
                    required
                >
                    <Input placeholder="Nhập tên danh mục (tiếng việt)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã" required>
                    <Input placeholder="Nhập mã" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="englishName"
                    label="Tên danh mục (tiếng anh)"
                >
                    <Input placeholder="Nhập tên danh mục (tiếng anh)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingMajorId"
                    label="Chuyên ngành đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn chuyên ngành đào tạo"
                        options={trainingMajorData.map((i: TrainingMajor) => {
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
                    name="managementOrganizationId"
                    label="Đơn vị phụ trách"
                    required
                >
                    <TreeSelect
                        placeholder="Chọn đơn vị phụ trách"
                        allowClear
                        showSearch
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
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutCurriculum
