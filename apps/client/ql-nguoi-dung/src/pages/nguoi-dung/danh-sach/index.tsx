import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutUserModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useDisclosure from '@hooks/disclosure'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Divider, Flex, Form, Input, Row, Tooltip } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const router = useRouter()
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen } = useDisclosure({
        tag: PutUserModal.name,
    })

    const handleModal = () => {
        onOpen()
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
                                <Button type="primary">Thêm mới</Button>
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
                                align: 'left',
                            },
                            {
                                title: 'Tên đăng nhập',
                                dataIndex: 'username',
                                width: 180
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 250
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'contact',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái tài khoản',
                                dataIndex: 'status',
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
                                                onConfirm: () => {
                                                    console.log('delete')
                                                },
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        data={ [
                            {
                                id: 1,
                                name: 'Nguyễn Văn A',
                                username: 'nguyenvana',
                                email: 'nguyenvana@example.com',
                                contact: '2025-01-10',
                                status: 'Hoạt động'
                            },
                            {
                                id: 2,
                                name: 'Trần Thị B',
                                username: 'tranthib',
                                email: 'tranthib@example.com',
                                contact: '2025-01-11',
                                status: 'Ngưng hoạt động'
                            },
                            {
                                id: 3,
                                name: 'Lê Văn C',
                                username: 'levanc',
                                email: 'levanc@example.com',
                                contact: '2025-01-12',
                                status: 'Hoạt động'
                            },
                            {
                                id: 4,
                                name: 'Phạm Thị D',
                                username: 'phamthid',
                                email: 'phamthid@example.com',
                                contact: '2025-01-13',
                                status: 'Khóa'
                            },
                            {
                                id: 5,
                                name: 'Hoàng Văn E',
                                username: 'hoangvane',
                                email: 'hoangvane@example.com',
                                contact: '2025-01-14',
                                status: 'Hoạt động'
                            }
                        ]}
                    />
                </Col>
            </Row>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
