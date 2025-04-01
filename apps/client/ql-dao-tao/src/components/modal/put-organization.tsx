import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Organization, OrganizationType } from '@workspace/db'
import {
    useCreateOrganization,
    useFindUniqueOrganization,
    useFindManyOrganizationType,
    useUpdateOrganization
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
export type PutOrganizationType = Organization
const PutOrganizationModal = () => {
    const [form] = Form.useForm<PutOrganizationType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutOrganizationModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data = [], refetch } = useFindManyOrganizationType({
            take: 1000,
            skip: 0,
    })
    console.log(data)

    const { mutateAsync: createLevel } = useCreateOrganization()
    const { mutateAsync: updateLevel } = useUpdateOrganization()
    async function onOk(output?: PutOrganizationType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateLevel({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createLevel({
                    data: {
                        typeId:output.typeId,
                        address: output.address,
                        code : output.code,
                        name: output.name,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Rank'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueOrganization({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa đơn vị'
                    : 'Thêm mới đơn vị'
            }
            className="w-[30vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã đơn vị"
                    required
                >
                    <Input placeholder='Nhập mã đơn vị' />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên đơn vị"
                    required
                >
                    <Input placeholder="Nhập tên đơn vị" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="typeId"
                    label="Loại đơn vị"
                    required
                >
                    <Select placeholder='Chọn loại đơn vị' options={data.map((i: OrganizationType) =>{
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="address"
                    label="Địa chỉ"
                    required
                >
                    <Input placeholder="Nhập địa chỉ" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutOrganizationModal
