import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import useSpinner from '@hooks/spinner'
import { Button, Col, Flex, Row, Typography } from 'antd'

const { Title } = Typography

export default function TrinhDoLyLuanChinhTriForm() {
    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {}

    const hasData = true

    return (
        <div className="mt-7">
            <Row justify="space-between" align="middle">
                <Col span={12}>
                    <Title level={4} className="mb-0">
                        Trình độ lý luận chính trị
                    </Title>
                </Col>
                <Col span={12}>
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

            {hasData && (
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
                            title: 'Tên thân nhân',
                            align: 'center',
                            width: 180,
                            fixed: 'left',
                            render: (_, record) => record?.name || '',
                        },
                        {
                            title: 'Tên mối quan hệ',
                            align: 'center',
                            width: 160,
                            render: (_, record) => record?.dM_MoiQuanHe?.name || '',
                        },
                        {
                            title: 'Năm sinh',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.birthYear || '',
                        },
                        {
                            title: 'Nghề nghiệp',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.job || '',
                        },
                        {
                            title: 'Thông tin khác',
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
            )}
        </div>
    )
}
