import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PutHocHamModal from '@components/modal/quan-ly-ho-so/modals/put-hoc-ham'
import useSpinner from '@hooks/spinner'
import type { HocHam } from '@workspace/db'
import { useFindManyHocHam, useUpdateHocHam } from '@workspace/db/hooks'
import { Button, Col, Collapse, Flex, message, Row, Typography } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title, Text } = Typography

export default function HocHamForm() {
    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen } = useDisclosure<Partial<HocHam>>({
        tag: PutHocHamModal.name,
    })

    const { data: hocHamData = [], refetch } = useFindManyHocHam({
        include: {
            academicRankType: true,
        },
    })
    const { mutate: updateHocHam } = useUpdateHocHam()

    const handleModal = () => {
        onOpen()
    }

    const hasData = hocHamData && hocHamData.length > 0

    const handleDeleteHocHam = async (id: string) => {
        try {
            showSpinner()
            await updateHocHam({
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
                            title: 'Học vị',
                            align: 'center',
                            width: 120,
                            fixed: 'left',
                            render: (_, record) => record?.academicDegreeType?.sTen || '',
                        },
                        {
                            title: 'Lĩnh vực',
                            align: 'center',
                            width: 200,
                            render: (_, record) => record.linhVuc || '',
                        },
                        {
                            title: 'Trường',
                            align: 'center',
                            width: 200,
                            render: (_, record) => record?.truong?.name || '',
                        },
                        {
                            title: 'Quốc gia',
                            align: 'center',
                            width: 120,
                            render: (_, record) => record?.nationality?.sTen || '',
                        },
                        {
                            title: 'Năm nhận',
                            align: 'center',
                            width: 120,
                            render: (_, record) => record.year || '',
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
                                            onConfirm: () => handleDeleteHocHam(record.id),
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Row>
                            ),
                        },
                    ]}
                    dataSource={hocHamData}
                    pagination={false}
                />
            </div>
        )
    }

    return (
        <div className="mt-5">
            <Collapse
                items={[
                    {
                        key: 'hoc-ham',
                        label: (
                            <Title level={4} className="mb-0">
                                Học hàm
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                bordered={false}
                expandIconPosition="end"
            />
        </div>
    )
}
