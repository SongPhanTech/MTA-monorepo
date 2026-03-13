import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Subject } from '@workspace/db/client'
import {
    useCreateSubject,
    useFindManyDM_DonVi,
    useFindUniqueSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
import { whereOrganization } from '@workspace/libs/constants'
import TreeSelect from '@/components/commons/tree-select'
export type PutSubjectFormType = Subject
dayjs.locale('vi')
const PutSubjectModal = () => {
    const [form] = Form.useForm<PutSubjectFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutSubjectModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createSubject } = useCreateSubject()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function onOk(output?: PutSubjectFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSubject({
                    data: {
                        name: output.name.trim(),
                        managementOrganizationId: output.managementOrganizationId,
                        information: output.information,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubject({
                    data: {
                        name: output.name.trim(),
                        managementOrganizationId: output.managementOrganizationId,
                        information: output.information,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Subject'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: level } = useFindUniqueSubject({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
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
                <FormItem form={form} name="name" label="Tên nhóm môn học" required>
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
                        placeholder="Chọn đơn vị quản lý"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="information" label="Thông tin">
                    <Input.TextArea placeholder="Nhập thông tin" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSubjectModal
