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
                                align: 'center',
                            },
                            {
                                title: 'Tên',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Tóm tắt chức năng, nhiệm vụ',
                                dataIndex: 'summaryTask',
                            },
                            {
                                title: 'Thông tin liên lạc',
                                dataIndex: 'contact',
                            },
                            {
                                title: 'Chức danh lãnh đạo lực lượng',
                                dataIndex: 'leaderPosition',
                            },
                            {
                                title: 'Lịch sử tham gia các sự kiện',
                                dataIndex: 'participationHistory',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip
                                            title="Xem chi tiết khung hồ sơ"
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
                                code: 'A001',
                                name: 'Bánh mì',
                                nature: 'Thực phẩm',
                                origin: 'Việt Nam',
                                processingInformation:
                                    'Dùng kháng sinh + Oresol',
                                image: 'https://i.ex-cdn.com/vntravellive.com/files/news/2023/05/15/luu-ngay-5-quan-banh-mi-ngon-nen-thu-tai-sai-gon-151953.jpg',
                            },
                            {
                                id: 2,
                                code: 'A002',
                                name: 'Nước ép cam',
                                nature: 'Đồ uống',
                                origin: 'Việt Nam',
                                processingInformation:
                                    'Dùng kháng sinh + Oresol',
                                image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPBbpn-hdvOh9_DvcIF0P_8rb2ipc4EX2m2w&s',
                            },
                            {
                                id: 3,
                                code: 'A003',
                                name: 'Trái cây tươi',
                                nature: 'Thực phẩm',
                                origin: 'Nhật Bản',
                                processingInformation:
                                    'Dùng kháng sinh + Oresol',
                                image: 'https://tfruit.com.vn/wp-content/uploads/2019/09/hoa-qu%E1%BA%A3-s%E1%BA%A1ch.jpg',
                            },
                            {
                                id: 4,
                                code: 'A004',
                                name: 'Cà phê hòa tan',
                                nature: 'Đồ uống',
                                origin: 'Brazil',
                                processingInformation:
                                    'Dùng kháng sinh + Oresol',
                                image: 'https://cdn.tuoitre.vn/zoom/700_700/tto/i/s626/2016/05/05/untitled-22-1462437661.jpg',
                            },
                            {
                                id: 5,
                                code: 'A005',
                                name: 'Sữa tươi',
                                nature: 'Đồ uống',
                                origin: 'Úc',
                                processingInformation:
                                    'Dùng kháng sinh + Oresol',
                                image: 'https://thichsua.com/wp-content/uploads/2020/10/sua-tuoi-khong-duonh-co-tac-dung-gi.jpg',
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
