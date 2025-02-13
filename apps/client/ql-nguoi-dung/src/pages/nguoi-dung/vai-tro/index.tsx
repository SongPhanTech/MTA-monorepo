import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutVaiTroModal } from '@components/modal'
import type { PutVaiTroFormType } from '@components/modal/put-vai-tro'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useDisclosure from '@hooks/disclosure'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    useCountRole,
    useCreateRole,
    useFindManyRole,
    useUpdateRole,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tooltip,
    message,
} from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Page() {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManyRole({
        skip: (currentPage - 1) * numberOfPages,
        take: numberOfPages,
        include: {
            permissions: true,
            groups: true,
        },
    })
    const { data: count } = useCountRole()

    const router = useRouter()
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string, PutVaiTroFormType>({
        tag: PutVaiTroModal.name,
        onOk,
    })
    const { mutateAsync: mutateUpdateRole } = useUpdateRole()
    const { mutateAsync: mutateCreateRole } = useCreateRole()
    async function onOk(output?: PutVaiTroFormType) {
        if (!output) return
        showSpinner()
        try {
            if (output.id) {
                await mutateUpdateRole({
                    where: {
                        id: output.id,
                    },
                    data: {
                        name: output.name,
                        permissions: {
                            connectOrCreate: output.permissions.flatMap(
                                (item) =>
                                    item.permissionTypes.map((type) => ({
                                        where: {
                                            name_permissionType: {
                                                name: item.id,
                                                permissionType: type,
                                            },
                                        },
                                        create: {
                                            name: item.id,
                                            permissionType: type,
                                        },
                                    }))
                            ),
                        },
                        groups: {
                            connect: output.groups.map((item) => ({
                                id: item,
                            })),
                        },
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await mutateCreateRole({
                    data: {
                        name: output.name,
                        permissions: {
                            connectOrCreate: output.permissions.flatMap(
                                (item) =>
                                    item.permissionTypes.map((type) => ({
                                        where: {
                                            name_permissionType: {
                                                name: item.id,
                                                permissionType: type,
                                            },
                                        },
                                        create: {
                                            name: item.id,
                                            permissionType: type,
                                        },
                                    }))
                            ),
                        },
                        groups: {
                            connect: output.groups.map((item) => ({
                                id: item,
                            })),
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            refetch()
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    async function handleDelete(id: string) {
        showSpinner()
        try {
            await mutateUpdateRole({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleModal = () => {
        onOpen()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Vai trò
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button type="primary" onClick={handleModal}>
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                        {/* row filter */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        debouncedSearchText(e.target.value)
                                    }
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên vai trò',
                                dataIndex: 'name',
                                align: 'left',
                            },
                            {
                                title: 'Nhóm người dùng',
                                dataIndex: 'groups',
                                width: 200,
                                align: 'center',
                                render: (_, { groups }) => groups.length,
                            },
                            {
                                title: 'Quyền cơ bản',
                                dataIndex: 'permissions',
                                width: 200,
                                align: 'center',
                                render: (_, { permissions }) =>
                                    permissions.length,
                            },
                            {
                                title: 'Ngày tạo',
                                width: 200,
                                align: 'center',
                                render: (_, { createdAt }) =>
                                    formatDateReadable(createdAt),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () =>
                                                    handleDelete(id),
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
