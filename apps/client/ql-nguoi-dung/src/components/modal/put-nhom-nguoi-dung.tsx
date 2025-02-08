import FormItem from '@components/commons/form-item';
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal';
import Select from '@components/commons/select';
import useDisclosure from '@hooks/disclosure';
import {
    useFindManyRole,
    useFindManyUser,
    useFindUniqueGroup,
} from '@workspace/db/hooks';
import { Col, Form, Input, Table } from 'antd';
import { useEffect } from 'react';
export type PutNhomNguoiDungFormType = {
    id?: string;
    name: string;
    users: string[];
    roles: string[];
} & PutModalFormType;
const PutNhomNguoiDungModal = () => {
    const [form] = Form.useForm<PutNhomNguoiDungFormType>();
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutNhomNguoiDungModal.name,
        onClose: form.resetFields,
    });
    const { data: group } = useFindUniqueGroup({
        where: {
            id: input,
        },
        include: {
            users: true,
            roles: true,
        },
    });

    const { data: users = [] } = useFindManyUser();
    const { data: roles = [] } = useFindManyRole();

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (group) {
            form.setFieldsValue({
                id: group.id,
                name: group.name,
                users: group.users.map((user) => user.id),
                roles: group.roles.map((role) => role.id),
            });
        }
    }, [group]);

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={
                input ? 'Chỉnh sửa nhóm người dùng' : 'Thêm mới nhóm người dùng'
            }
        >
            <Col span={12}>
                <FormItem form={form} name='id' hidden>
                    <Input />
                </FormItem>
                <FormItem
                    form={form}
                    name='name'
                    label='Tên nhóm người dùng'
                    required
                >
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name='roles' label='Vai trò'>
                    <Select
                        mode='multiple'
                        allowClear
                        placeholder='Chọn vai trò'
                        options={roles.map((role) => ({
                            label: role.name,
                            value: role.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name='users' label='Người dùng'>
                    <Select
                        showSearch
                        mode='multiple'
                        allowClear
                        placeholder='Chọn người dùng'
                        optionFilterProp='label'
                        filterSort={(optionA, optionB) =>
                            (optionA?.label ?? '')
                                .toLowerCase()
                                .localeCompare(
                                    (optionB?.label ?? '').toLowerCase()
                                )
                        }
                        options={users.map((user) => ({
                            label: user.name,
                            value: user.id,
                        }))}
                    />
                </FormItem>
            </Col>
            {input && (
                <Col span={24}>
                    <Table
                        bordered
                        columns={[
                            {
                                title: 'STT',
                                dataIndex: 'index',
                                align: "center",
                                width: 10,
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Người dùng',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Tên đăng nhập',
                                dataIndex: 'userName',
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                            },
                        ]}
                        pagination={false}
                        dataSource={group?.users}
                    />
                </Col>
            )}
        </PutFormModal>
    );
};

export default PutNhomNguoiDungModal;
