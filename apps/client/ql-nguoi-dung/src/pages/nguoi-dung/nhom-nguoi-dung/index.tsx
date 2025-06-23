import { EyeOutlined } from '@ant-design/icons'
import { fetchCreateGroup, fetchUpdateGroup } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutNhomNguoiDungModal } from '@components/modal'
import type { PutNhomNguoiDungFormType } from '@components/modal/put-nhom-nguoi-dung'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDateReadable } from '@lib/utils'
import {
    useCountGroup,
    useFindManyGroup,
    useUpdateGroup,
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
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function Page() {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const router = useRouter()
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure({
        tag: PutNhomNguoiDungModal.name,
        onOk,
    })
    const { data = [], refetch } = useFindManyGroup({
        skip: (currentPage - 1) * numberOfPages,
        take: numberOfPages,
        include: { users: true, roles: true },
    })
    const { data: count } = useCountGroup()

    async function onOk(output?: PutNhomNguoiDungFormType) {
        if (!output) return
        try {
            showSpinner()
            if (output.id) {
                await fetchUpdateGroup({
                    pathParams: {
                        id: output.id,
                    },
                    body: {
                        name: output.name,
                        userIds: output.users.map((user) => user),
                        roleIds: output.roles.map((role) => role),
                    },
                })
                message.success('Cập nhật thông tin nhóm người dùng')
            } else {
                await fetchCreateGroup({
                    body: {
                        name: output.name,
                        userIds: output.users.map((user) => user),
                        roleIds: output.roles.map((role) => role),
                    },
                })
                message.success('Tạo nhóm người dùng')
            }
            refetch()
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const { mutateAsync: mutateUpdateGroup } = useUpdateGroup()
    async function handleDelete(id: string) {
        showSpinner()
        try {
            await mutateUpdateGroup({
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
                Nhóm người dùng
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
                                title: 'Nhóm người dùng',
                                dataIndex: 'name',
                                align: 'left',
                            },
                            {
                                title: 'Người dùng',
                                dataIndex: 'users',
                                width: 150,
                                align: 'center',
                                render: (value) => value.length,
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
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
