import FormItem from '@components/commons/form-item'
import PutFormModal, {
    type PutModalFormType,
} from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import useDisclosure from '@hooks/disclosure'
import useQuyenCoBan from '@hooks/quyen-co-ban'
import { PERMISSION_TYPE } from '@workspace/constant'
import type { $Enums } from '@workspace/db'
import { useFindManyGroup, useFindUniqueRole } from '@workspace/db/hooks'
import {
    Checkbox,
    type CheckboxProps,
    Col,
    Divider,
    Form,
    Input,
    Row,
    TreeSelect,
} from 'antd'
import { useEffect } from 'react'
export type PutVaiTroFormType = {
    id?: string
    name: string
    groups: string[]
    permissions: Array<{
        permissionTypes: $Enums.PermissionType[]
        id: string
        label: string
    }>
} & PutModalFormType
const PutVaiTroModal = () => {
    const { isOpen, onClose, onOk, input } = useDisclosure<string>({
        tag: PutVaiTroModal.name,
    })
    const { data: quyenCoBan, dataFlat: quyenCoBanFlat } = useQuyenCoBan()
    const [form] = Form.useForm<PutVaiTroFormType>()
    const permissions = Form.useWatch('permissions', form)
    const { data: role } = useFindUniqueRole({
        where: {
            id: input,
        },
        include: {
            groups: true,
            permissions: true,
        },
    })

    const { data: groups = [] } = useFindManyGroup()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (input && role) {
            form.setFieldsValue({
                id: role.id,
                description: role.description || '',
                name: role.name,
                groups: role.groups.map((group) => group.id),
                permissions: Object.entries(
                    Object.groupBy(role.permissions, ({ name }) => name)
                ).map(([name, permissions]) => ({
                    name,
                    permissionTypes: permissions?.map(
                        ({ permissionType }) => permissionType
                    ),
                })),
            })
        }
    }, [role, input])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            title={input ? 'Chỉnh sửa vai trò' : 'Thêm mới vai trò'}
            className="w-3/4"
        >
            <FormItem form={form} name="id" hidden>
                <Input />
            </FormItem>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên vai trò" required>
                    <Input />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="groups"
                    label="Nhóm người dùng"
                    required
                >
                    <Select
                        mode="multiple"
                        showSearch
                        options={groups.map((group) => ({
                            label: group.name,
                            value: group.id,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    normalize={(
                        current: string[],
                        prev: PutVaiTroFormType['permissions']
                    ) => {
                        return current.flatMap((id) => {
                            const findQuyenCoBan = quyenCoBanFlat.find(
                                (item) => item.id === id
                            )
                            return {
                                id,
                                value: id,
                                permissionTypes:
                                    prev?.find((item) => item.id === id)
                                        ?.permissionTypes ?? [],
                                ...findQuyenCoBan,
                                children: undefined,
                            }
                        })
                    }}
                    name="permissions"
                    label="Quyền"
                    required
                >
                    <TreeSelect
                        showSearch
                        treeCheckable
                        showCheckedStrategy="SHOW_CHILD"
                        treeData={quyenCoBan.map((item) => ({
                            label: item.label,
                            value: item.id,
                            children: item.children?.map((child) => ({
                                label: child.label,
                                value: child.id,
                            })),
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 20,
                            align: 'center',
                            dataIndex: 'index',
                        },
                        {
                            title: 'Mã',
                            dataIndex: 'id',
                            key: 'id',
                        },
                        {
                            title: 'Tên',
                            dataIndex: 'label',
                        },
                        {
                            title: 'Loại quyền',
                            render: (_, { id }) => {
                                const checkedList =
                                    permissions?.find((item) => item.id === id)
                                        ?.permissionTypes ?? []
                                const checkAll =
                                    PERMISSION_TYPE.length ===
                                    checkedList.length
                                const indeterminate =
                                    checkedList.length > 0 &&
                                    checkedList.length < PERMISSION_TYPE.length
                                const onChange = (
                                    list: $Enums.PermissionType[]
                                ) => {
                                    const payload = permissions
                                        ? permissions.map((item) => {
                                              if (item.id === id) {
                                                  return {
                                                      ...item,
                                                      permissionTypes: list,
                                                  }
                                              }
                                              return item
                                          })
                                        : [
                                              {
                                                  id,
                                                  permissionTypes: list,
                                              },
                                          ]
                                    form.setFieldValue('permissions', payload)
                                }

                                const onCheckAllChange: CheckboxProps['onChange'] =
                                    (e) => {
                                        const list = e.target.checked
                                            ? PERMISSION_TYPE.map(
                                                  (item) => item.value
                                              )
                                            : []
                                        onChange(list)
                                    }

                                return (
                                    <Row className="justify-center">
                                        <Checkbox
                                            indeterminate={indeterminate}
                                            onChange={onCheckAllChange}
                                            checked={checkAll}
                                        >
                                            Chọn tất cả
                                        </Checkbox>
                                        <Divider />
                                        <Checkbox.Group
                                            options={PERMISSION_TYPE}
                                            value={checkedList}
                                            onChange={onChange}
                                        />
                                    </Row>
                                )
                            },
                        },
                    ]}
                    data={permissions}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutVaiTroModal
