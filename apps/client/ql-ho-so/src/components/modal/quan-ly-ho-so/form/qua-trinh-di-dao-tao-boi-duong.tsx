import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PutTinHocModal from '@components/modal/quan-ly-ho-so/modals/put-tin-hoc'
import type { DomProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { Button, Col, Collapse, Flex, Row, Typography } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title, Text } = Typography

export default function QuaTrinhDiDaoTaoBoiDuongForm({ expland, setExpland }: DomProps) {
    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen } = useDisclosure({
        tag: PutTinHocModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const hasData = true

    const renderContent = () => {
        if (!hasData) {
            return (
                <Row justify="space-between" align="middle">
                    <Col>
                        <Text type="secondary">Không có dữ liệu</Text>
                    </Col>
                    <Col>
                        <Button
                            onClick={handleModal}
                            icon={<PlusOutlined />}
                            className="border-green-700 text-green-700 hover:bg-green-50"
                        >
                            Thêm mới
                        </Button>
                    </Col>
                </Row>
            )
        }

        return (
            <div>
                <Row justify="space-between" align="middle">
                    <Col span={24}>
                        <Flex justify="end">
                            <Button
                                onClick={handleModal}
                                icon={<PlusOutlined />}
                                className="border-green-700 text-green-700 hover:bg-green-50"
                            >
                                Thêm mới
                            </Button>
                        </Flex>
                    </Col>
                </Row>

                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Khóa đào tạo, bồi dưỡng tập huấn',
                            align: 'center',
                            width: 180,
                            fixed: 'left',
                            render: (_, record) => record?.name || '',
                        },
                        {
                            title: 'Đơn vị tổ chức',
                            align: 'center',
                            width: 160,
                            render: (_, record) => record?.dM_MoiQuanHe?.name || '',
                        },
                        {
                            title: 'Loại',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.birthYear || '',
                        },
                        {
                            title: 'Từ ngày',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.job || '',
                        },
                        {
                            title: 'Đến ngày',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.information || '',
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => (
                                <Row className="justify-center gap-2">
                                    <EditIcon
                                        className="text-sm text-blue-700 cursor-pointer"
                                        // onClick={onOpen.bind(null, record)}
                                    />
                                    <DeleteIcon
                                        popConfirm={
                                            {
                                                // onConfirm: () => handleDeleteRelative(record.id),
                                            }
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Row>
                            ),
                        },
                    ]}
                    // dataSource={relatives}
                    pagination={false}
                />
            </div>
        )
    }

    return (
        <div>
            <Collapse
                items={[
                    {
                        key: 'quaTrinhDiDaoTaoBoiDuong',
                        label: (
                            <Title level={4} className="mb-0">
                                Quá trình được cử đi đào tạo bồi dưỡng
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                bordered={false}
                expandIconPosition="end"
                className="bg-transparent"
                activeKey={expland}
                onChange={(value) => {
                    setExpland([...value])
                }}
            />
        </div>
    )
}
