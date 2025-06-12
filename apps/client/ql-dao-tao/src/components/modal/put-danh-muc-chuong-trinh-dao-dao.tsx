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
import { Col, Form, Input, message, Switch, TreeSelect } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutCurriculum = Curriculum
import 'dayjs/locale/vi'
import type React from 'react'
import './index.css'
import { buildOrgTree } from '@lib/utils'
import DocumentPaths from '@components/commons/documentPaths'
dayjs.locale('vi')

const PutCurriculum = () => {
    const [fileList, setFileList] = useState<File[]>([])

    const handleRemoveFile = (index: number): void => {
        const newList = [...fileList]
        newList.splice(index, 1)
        setFileList(newList)
        form.setFieldValue('documentPaths', newList) // Cập nhật vào form
    }

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
                        name: output.name,
                        englishName: output.englishName,
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
                        name: output.name,
                        englishName: output.englishName,
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
    const [active, setActive] = useState(true)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
            })
            setActive(initialData?.active)
        }
    }, [initialData])

    const handleChange = (checked: boolean) => {
        setActive(checked)
        form.setFieldsValue({ active: checked })
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id ? 'Sửa chương trình đào tạo' : 'Thêm chương trình đào tạo'
            }
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên chương trình (tiếng việt)"
                    required
                >
                    <Input placeholder="Nhập tên chương trình (tiếng việt)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="englishName"
                    label="Tên chương trình (tiếng anh)"
                >
                    <Input placeholder="Nhập tên chương trình (tiếng anh)" />
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
            <Col span={12}>
                <FormItem
                    form={form}
                    name="documentPaths"
                    label="Tài liệu đính kèm"
                >
                    <DocumentPaths
                        form={form}
                        fileList={fileList}
                        setFileList={setFileList}
                        handleRemoveFile={handleRemoveFile}
                    />
                </FormItem>
            </Col>
            <Col span={12} className="flex items-center">
                <FormItem
                    form={form}
                    name="active"
                    label=""
                    valuePropName="checked"
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Switch checked={active} onChange={handleChange} />
                        <span>{active ? 'Đang đào tạo' : 'Ngừng đào tạo'}</span>
                    </div>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutCurriculum
