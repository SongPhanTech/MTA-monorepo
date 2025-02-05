import { EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import {
    fetchCreateUser,
    fetchUpdateUser,
    useListUsers,
} from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutNguoiDungModal } from '@components/modal'
import type { PutUserFormType } from '@components/modal/put-nguoi-dung'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useDisclosure from '@hooks/disclosure'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable } from '@lib/utils'
import {
    useCountUser,
    useFindManyUser,
    useUpdateUser,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Tooltip,
    message,
} from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data, refetch } = useListUsers({})
    const { data: count } = useCountUser()
    const router = useRouter()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string, PutUserFormType>({
        tag: PutNguoiDungModal.name,
        onOk,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output?: PutUserFormType) {
        if (!output) return
        try {
            showSpinner()
            if (output.id) {
                await fetchUpdateUser({
                    pathParams: {
                        id: output.id,
                    },
                    body: {
                        // username ko sửa
                        email: String(output.email),
                        name: output.name,
                        description: output.description,
                        groupIds: [],
                        ...(output.password && {
                            password: String(output.password),
                        }),
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await fetchCreateUser({
                    body: {
                        email: String(output.email),
                        password: String(output.password),
                        userName: output.username,
                        name: output.name,
                        description: output.description,
                        groupIds: [],
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch()
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'User'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateUser } = useUpdateUser()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateUser({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    async function handleLockAcc(id: string, accountLocked: boolean) {
        if (!id) return
        try {
            showSpinner()
            await fetchUpdateUser({
                pathParams: {
                    id: id,
                },
                body: {
                    accountLocked: !accountLocked,
                },
            })
            message.success('Cập nhật thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
        refetch()
        onClose()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Danh sách tài khoản
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
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
                                title: 'Họ và tên',
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
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                render: (_, { createdAt }) =>
                                    createdAt
                                        ? formatDateReadable(createdAt)
                                        : '',
                            },
                            {
                                title: 'Trạng thái tài khoản',
                                dataIndex: 'accountLocked',
                                align: 'center',
                                width: 150,
                                render: (value, record) => {
                                    return value ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">
                                            Đang hoạt động
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id, accountLocked }) => (
                                    <Row className="justify-center gap-2">
                                        {!accountLocked ? (
                                            <Tooltip
                                                title="Khóa"
                                                placement="leftTop"
                                            >
                                                <LockOutlined
                                                    onClick={() =>
                                                        handleLockAcc(id,Boolean(accountLocked))
                                                    }
                                                    className="text-sm text-red-500 cursor-pointer"
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                title="Mở khóa"
                                                placement="leftTop"
                                            >
                                                <UnlockOutlined
                                                    onClick={() =>
                                                        handleLockAcc(id,Boolean(accountLocked))
                                                    }
                                                    className="text-sm text-green-500 cursor-pointer"
                                                />
                                            </Tooltip>
                                        )}
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
                        data={data?.data || []}
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
