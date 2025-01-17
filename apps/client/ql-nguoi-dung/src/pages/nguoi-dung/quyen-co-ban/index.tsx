import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutQuyenCoBanModal } from '@components/modal'
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
        tag: PutQuyenCoBanModal.name,
    })

    const handleModal = () => {
        onOpen()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Quyền cơ bản
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
                                title: 'Tên quyền cơ bản',
                                dataIndex: 'permissionName',
                            },
                            {
                                title: 'Mã quyền',
                                dataIndex: 'permissionCode',
                            },
                            {
                                title: 'Phân hệ',
                                dataIndex: 'subSystem',
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                width: 150,
                                align: 'center',
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
                        data={[
                            {
                                id: 1,
                                permissionName: 'Thêm điểm',
                                permissionCode: 'them_diem',
                                subSystem: 'Quản lý đào tạo',
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 2,
                                permissionName: 'Xóa điểm',
                                permissionCode: 'xoa_diem',
                                subSystem: 'Quản lý đào tạo',
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 3,
                                permissionName: 'Thêm người dùng',
                                permissionCode: 'them_nguoi_dung',
                                subSystem: 'Quản lý người dùng',
                                createdAt: '16-01-2025',
                            },
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
