import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { SubjectGroup } from '@workspace/db'
import {
    useCreateSubjectGroup,
    useFindManyOrganization,
    useFindUniqueSubjectGroup,
    useUpdateSubjectGroup,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutSubjectGroupFormType = SubjectGroup
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
dayjs.locale('vi')
const PutSubjectGroupModal = () => {
    const [form] = Form.useForm<PutSubjectGroupFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSubjectGroupModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createSubjectGroup } = useCreateSubjectGroup()
    const { mutateAsync: updateSubjectGroup } = useUpdateSubjectGroup()
    async function onOk(output?: PutSubjectGroupFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSubjectGroup({
                    data: {
                        name: output.name,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        infomation: output.infomation,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubjectGroup({
                    data: {
                        name: output.name,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        infomation: output.infomation,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SubjectGroup'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueSubjectGroup({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()
    const treeData = buildOrgTree(manageOrgData)

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa nhóm môn học' : 'Thêm mới nhóm môn học'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên nhóm môn học"
                    required
                >
                    <Input placeholder="Nhập tên nhóm môn học" />
                </FormItem>
            </Col>
            <Col span={24}>
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
            <Col span={24}>
                <FormItem form={form} name="infomation" label="Thông tin">
                    <Input.TextArea placeholder="Nhập thông tin" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSubjectGroupModal
