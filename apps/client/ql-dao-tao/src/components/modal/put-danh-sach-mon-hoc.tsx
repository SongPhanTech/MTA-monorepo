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
import { Col, Form, Input, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import useTrimText from '@hooks/trimText'
import { buildOrgTree } from '@lib/utils'
import { whereOrganization } from '@workspace/libs/constants'
import TreeSelect from '@/components/commons/tree-select'
export type PutSubject = Subject
dayjs.locale('vi')
type PutSubjectInput = {
    id?: string
    isLocked?: boolean
}
const PutSubjectListModal = () => {
    const [form] = Form.useForm<PutSubject>()
    const { trimObjectFields } = useTrimText()
    const { isOpen, onClose, input } = useDisclosure<PutSubjectInput>({
        tag: 'PutSubjectListModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
         orderBy: { iSTT: 'desc' }
    })
    const treeData = buildOrgTree(manageOrgData)
    const normalize = (str = '') =>
        str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
    const { mutateAsync: createSubject } = useCreateSubject()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function onOk(output?: PutSubject) {
        if (!output) return
        try {
            showSpinner()

            const data = trimObjectFields(output)

            if (input?.id) {
                await updateSubject({
                    data,
                    where: { id: input.id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubject({
                    data,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({ queryKey: ['Subject'] })
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

    const { data: subject } = useFindUniqueSubject(
        { where: { id: input?.id } },
        { enabled: !!input?.id }
    )

    useEffect(() => {
        if (subject) {
            form.setFieldsValue({
                ...subject,
            })
        } else {
            form.setFieldsValue({
                active: true,
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
            title={input?.id ? 'Sửa nhóm môn học' : 'Thêm nhóm môn học'}
            className="w-[60vw]"
            okButtonProps={{ disabled: input?.isLocked }}
            cancelButtonProps={{ disabled: input?.isLocked }}
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên nhóm môn học" required>
                    <Input placeholder="Nhập tên môn học" readOnly={input?.isLocked} />
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem form={form} name="code" label="Mã môn học" required>
                    <Input placeholder="Nhập mã môn học" />
                </FormItem>
            </Col> */}
            {/* <Col span={12}>
                <FormItem form={form} name="infomation" label="Thông tin">
                    <Input placeholder="Nhập thông tin" />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <Form.Item name="managementOrganizationId" label="Đơn vị quản lý">
                    <TreeSelect
                        treeData={treeData}
                        placeholder="Chọn đơn vị quản lý"
                        style={{ width: '100%' }}
                        treeDefaultExpandAll
                        showSearch={!input?.isLocked}
                        filterTreeNode={(input, node) =>
                            normalize(node.searchText).includes(normalize(input))
                        }
                        {...(input?.isLocked
                            ? {
                                  allowClear: false,
                                  showArrow: false,
                                  open: false,
                              }
                            : {})}
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" readOnly={input?.isLocked} />
                </FormItem>
            </Col>
            {input?.id && (
                <Col span={12}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
                        <Radio.Group buttonStyle="solid" disabled={input?.isLocked}>
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutSubjectListModal
