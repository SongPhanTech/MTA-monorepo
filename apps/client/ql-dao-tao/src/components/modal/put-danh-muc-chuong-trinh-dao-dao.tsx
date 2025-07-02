import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Curriculum, TrainingMajor } from '@workspace/db'
import {
    useCreateCurriculum,
    useFindManyDM_DonVi,
    useFindManyTrainingMajor,
    useFindUniqueCurriculum,
    useUpdateCurriculum,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import DocumentPaths from '@components/commons/documentPaths'
import { buildOrgTree } from '@lib/utils'
export type PutCurriculum = Curriculum
dayjs.locale('vi')

const PutCurriculum = () => {
    const [document, setDocument] = useState<string[]>([])
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

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { mutateAsync: createCurriculum } = useCreateCurriculum()
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function onOk(output?: PutCurriculum) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                code: output.code,
                name: output.name,
                englishName: output.englishName,
                description: output.description,
                trainingMajorId: output.trainingMajorId,
                managementOrganizationId: output.managementOrganizationId,
                documentPaths: output.documentPaths,
                active: output.active,
            }
            if (id) {
                await updateCurriculum({
                    data: data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculum({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: initialData } = useFindUniqueCurriculum(
        {
            where: { id },
        },
        { enabled: !!id }
    )
    const treeData = buildOrgTree(manageOrgData)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
            })
            setDocument(initialData?.documentPaths)
        } else {
            form.setFieldsValue({
                active: true,
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
            title={id ? 'Sửa chương trình đào tạo' : 'Thêm chương trình đào tạo'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã chương trình" required>
                    <Input placeholder="Nhập mã CTDT" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên chương trình (tiếng việt)" required>
                    <Input placeholder="Nhập tên chương trình (tiếng việt)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="englishName" label="Tên chương trình (tiếng anh)">
                    <Input placeholder="Nhập tên chương trình (tiếng anh)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingMajorId" label="Chuyên ngành đào tạo" required>
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
                    label="Đơn vị quản lý"
                    required
                >
                    <TreeSelect
                        placeholder="Chọn đơn vị quản lý"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string).toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="documentPaths" label="Tài liệu đính kèm">
                    <DocumentPaths form={form} data={document} />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
                        <Radio.Group buttonStyle="solid">
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutCurriculum
