import { EyeOutlined } from '@ant-design/icons'
import { useCreateUser } from '@api/open-api/appComponents'
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

    const { data = [], refetch } = useFindManyUser({
        skip: (currentPage - 1) * numberOfPages,
        take: numberOfPages,
    })
    const { data: count } = useCountUser()
    const router = useRouter()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string, PutUserFormType>({
        tag: PutNguoiDungModal.name,
        onOk,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: fetchCreateUser } = useCreateUser()

    async function onOk(output?: PutUserFormType) {
        if (!output) return
        try {
            showSpinner()
            await fetchCreateUser({
                body: {
                    email: String(output.email),
                    password: output.password,
                    userName: output.username,
                    name: output.name,
                    description: output.description,
                    groupIds: [],
                },
            })
            refetch()
            onClose()
        } catch (error) {
            message.error(error?.message)
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
            message.error(error?.message)
        }
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
                                    formatDateReadable(createdAt),
                            },
                            {
                                title: 'Trạng thái tài khoản',
                                dataIndex: '',
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
