import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutNguoiDungModal } from '@components/modal'
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
        tag: PutNguoiDungModal.name,
    })

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
                                title: 'Tên vai trò',
                                dataIndex: 'roleName',
                                align: 'left',
                            },
                            {
                                title: 'Mã vai trò',
                                dataIndex: 'roleCode',
                            },
                            {
                                title: 'Số quyền cơ bản',
                                dataIndex: 'roleCount',
                                width: 150,
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái vai trò',
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
                        data={[
                            {
                                id: 1,
                                roleName: 'Quản lý điểm',
                                roleCode: 'quan_ly_diem',
                                roleCount: 10,
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 2,
                                roleName: 'Quản lý tải',
                                roleCode: 'quan_ly_tai',
                                roleCount: 8,
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 3,
                                roleName: 'Quản lý hệ thống',
                                roleCode: 'quan_ly_he_thong',
                                roleCount: 15,
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 4,
                                roleName: 'Quản lý danh mục dùng chung',
                                roleCode: 'quan_ly_danh_muc_dung_chung',
                                roleCount: 12,
                                createdAt: '16-01-2025',
                            },
                            {
                                id: 5,
                                roleName: 'Quản lý nhân sự',
                                roleCode: 'quan_ly_nhan_su',
                                roleCount: 20,
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
