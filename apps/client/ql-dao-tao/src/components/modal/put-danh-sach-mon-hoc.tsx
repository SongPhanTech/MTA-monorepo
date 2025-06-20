import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Subject } from '@workspace/db'
import {
    useCreateSubject,
    useFindManyOrganizationType,
    useFindUniqueSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, TreeSelect, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSubject = Subject
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutSubjectListModal = () => {
    const [form] = Form.useForm<PutSubject>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSubjectListModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: organizationTypes = [] } = useFindManyOrganizationType({
        include: {
            organizations: true,
        },
    })

    const treeData =
        organizationTypes.map((organizationType) => ({
            title: organizationType.name,
            value: organizationType.id,
            selectable: false,
            children:
                organizationType.organizations.map((organization) => ({
                    title: organization.name,
                    value: organization.id,
                })) || [],
        })) || []

    const { mutateAsync: createSubject } = useCreateSubject()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function onOk(output?: PutSubject) {
        if (!output) return
        try {
            showSpinner()

            const payload = {
                code: output.code,
                name: output.name,
                description: output.description,
                active: output.active,
                information: output.information,
                managementOrganizationId: output.managementOrganizationId,
            }

            if (id) {
                await updateSubject({
                    data: payload,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubject({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({ queryKey: ['Subject'] })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: subject } = useFindUniqueSubject(
        { where: { id } },
        { enabled: !!id }
    )

    useEffect(() => {
        if (subject) {
            form.setFieldsValue({
                ...subject,
            })
        }
    }, [subject, form])

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
            {/* <Col span={12}>
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
            </Col> */}
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên môn học" required>
                    <Input placeholder="Nhập tên môn học" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã">
                    <Input placeholder="Nhập mã" />
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem form={form} name="infomation" label="Thông tin">
                    <Input placeholder="Nhập thông tin" />
                </FormItem>
            </Col> */}
            <Col span={24}>
                <Form.Item
                    name="managementOrganizationId"
                    label="Đơn vị quản lý"
                >
                    <TreeSelect
                        treeData={treeData}
                        showSearch
                        placeholder="Chọn đơn vị quản lý"
                        style={{ width: '100%' }}
                        allowClear
                        treeDefaultExpandAll
                        filterTreeNode={(input, node) => {
                            const isLeaf = !node.children
                            return (
                                isLeaf &&
                                (node.title as string)
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            )
                        }}
                        // onChange={( extra ) => {
                        //     const node = extra.triggerNode;
                        //     if (node.props.children) {
                        //         form.setFieldsValue({ managementOrganizationId: undefined });
                        //     }
                        // }}
                    />
                </Form.Item>
            </Col>
            {/* {id && (
                <Col span={24}>
                    <FormItem
                        form={form}
                        name="active"
                        label="Trạng thái"
                    >
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { label: 'Đang hoạt động', value: true },
                                { label: 'Ngừng đào tạo', value: false },
                            ]}
                            allowClear
                        />
                    </FormItem>
                </Col>
            )} */}
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSubjectListModal
