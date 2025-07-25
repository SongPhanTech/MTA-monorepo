import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PutThongTinThanNhan from '@components/modal/quan-ly-ho-so/modals/put-thong-tin-than-nhan'
import useSpinner from '@hooks/spinner'
import type { Relative } from '@workspace/db'
import { useFindManyRelative, useUpdateRelative } from '@workspace/db/hooks'
import { Button, Col, Collapse, message, Row, Typography } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title, Text } = Typography

export default function ThongTinThanNhanForm() {
    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen } = useDisclosure<Partial<Relative>>({
        tag: PutThongTinThanNhan.name,
    })

    const { data: relatives = [], refetch } = useFindManyRelative({
        include: {
            dM_MoiQuanHe: true,
        },
    })
    const { mutateAsync: updateRelative } = useUpdateRelative()

    const handleModal = () => {
        onOpen()
    }

    const hasData = relatives && relatives.length > 0

    const handleDeleteRelative = async (id: string) => {
        try {
            showSpinner()
            await updateRelative({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

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
                <Row justify="end">
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
                                        onClick={onOpen.bind(null, record)}
                                    />
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () => handleDeleteRelative(record.id),
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Row>
                            ),
                        },
                    ]}
                    dataSource={relatives}
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
                        key: 'thong-tin-than-nhan',
                        label: (
                            <Title level={4} className="mb-0">
                                Thông tin thân nhân
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                bordered={false}
                expandIconPosition="end"
                className="bg-transparent"
            />
        </div>
    )
}
