import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PutHocHamModal from '@components/modal/quan-ly-ho-so/modals/put-hoc-ham'
import useSpinner from '@hooks/spinner'
import { formatDate } from '@lib/utils'
import type { HocHam } from '@workspace/db'
import { useFindManyHocHam, useUpdateHocHam } from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Typography } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title } = Typography

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

    return (
        <div className="mt-7">
            <Row justify="space-between" align="middle">
                <Col span={12}>
                    <Title level={4} className="mb-0">
                        Học hàm
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
                            title: 'Chức danh chuyên môn',
                            align: 'center',
                            width: 180,
                            fixed: 'left',
                            render: (_, record) => record?.academicRankType?.sTen || '',
                        },
                        {
                            title: 'Nơi cấp',
                            align: 'center',
                            width: 160,
                            render: (_, record) => record?.noiCap || '',
                        },
                        {
                            title: 'Số quyết định',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.soQuyetDinh || '',
                        },
                        {
                            title: 'Thời gian bắt đầu',
                            align: 'center',
                            width: 140,
                            render: (_, record) => formatDate(record.from) || '',
                        },
                        {
                            title: 'Thời gian kết thúc',
                            align: 'center',
                            width: 140,
                            render: (_, record) => formatDate(record.to) || '',
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
            )}
        </div>
    )
}
