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
    Card,
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
    const permissions = Form.useWatch('permissions', form) ?? []

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
            const permissionGroup = Object.groupBy(
                role.permissions,
                ({ name }) => name
            )
            form.setFieldsValue({
                id: role.id,
                description: role.description || '',
                name: role.name,
                groups: role.groups.map((group) => group.id),
                permissions: Object.entries(permissionGroup).map(
                    ([name, permissions]) => ({
                        id: name,
                        value: name,
                        label:
                            quyenCoBanFlat
                                .find((q) => q.id === name)
                                ?.label?.toString() || '',
                        permissionTypes: permissions?.map(
                            ({ permissionType }) => permissionType
                        ),
                    })
                ),
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
            className="w-3/4 z-10"
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
                        value: string[] = [],
                        prev: PutVaiTroFormType['permissions'] = []
                    ) => {
                        return value.map((item) => {
                            const quyen = quyenCoBanFlat.find(
                                (q) => q.id === item
                            )
                            const prevItem = prev.find((p) => p.id === item)
                            return {
                                id: item,
                                value: item,
                                permissionTypes: [],
                                label: quyen?.label || '',
                                ...prevItem,
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
            <Col span={24} className="flex flex-wrap gap-4">
                {permissions.map(({ label, permissionTypes, id }) => {
                    const checkedList = permissionTypes ?? []
                    const checkAll =
                        PERMISSION_TYPE.length === checkedList.length
                    const indeterminate =
                        checkedList.length > 0 &&
                        checkedList.length < PERMISSION_TYPE.length

                    const onChange = (list: $Enums.PermissionType[]) => {
                        form.setFieldsValue({
                            permissions: permissions.map((item) => {
                                if (item.id === id) {
                                    return {
                                        ...item,
                                        permissionTypes: list,
                                    }
                                }
                                return item
                            }),
                        })
                    }
                    const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
                        const list = e.target.checked
                            ? PERMISSION_TYPE.map((e) => e.value)
                            : []
                        onChange(list)
                    }
                    return (
                        <Card key={id} title={label} style={{ width: 300 }}>
                            <div className="flex flex-col justify-center items-center">
                                <Checkbox
                                    indeterminate={indeterminate}
                                    onChange={onCheckAllChange}
                                    checked={checkAll}
                                >
                                    Chọn tất cả
                                </Checkbox>
                                <Divider />
                                <Checkbox.Group
                                    className="gap-2 justify-between"
                                    options={PERMISSION_TYPE}
                                    value={checkedList}
                                    onChange={onChange}
                                />
                            </div>
                        </Card>
                    )
                })}
            </Col>
        </PutFormModal>
    )
}

export default PutVaiTroModal
