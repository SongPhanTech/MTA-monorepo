import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Subject } from '@workspace/db'
import {
    useCreateSubject,
    useFindManyOrganization,
    useFindUniqueSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
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

    const { data: organization } = useFindManyOrganization();

    const { mutateAsync: createSubject } = useCreateSubject()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function onOk(output?: PutSubject) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSubject({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        active: output.active,
                        information: output.information,
                        managementOrganizationId: output.managementOrganizationId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubject({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        active: output.active,
                        information: output.information,
                        managementOrganizationId: output.managementOrganizationId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Subject'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: subject } = useFindUniqueSubject({
        where: { id },
    })
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
                <FormItem form={form} name="name" label="Tên môn học">
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
                <FormItem
                    form={form}
                    name="managementOrganizationId"
                    label="Đơn vị quản lý"
                >
                    <Select
                        placeholder="Chọn đơn vị quản lý"
                        options={organization?.map(item => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
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
