import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useCountEvaluationMemberRole, useFindManyEvaluationMemberRole } from '@workspace/db/hooks'
import { Button, Col, Flex, Input, Row, Typography } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const CouncilPosition = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { data = [] } = useFindManyEvaluationMemberRole({
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { onOpen } = useDisclosure<{
        id?: string
    }>({
        tag: '',
    })

    const { data: count } = useCountEvaluationMemberRole()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24} className="mb-0">
                    <Typography.Title level={4}>Chức vụ hội đồng</Typography.Title>
                </Col>
                <Col span={24}>
                    <Flex justify={'space-between'} align="center">
                        <Input className="w-[20rem]" />
                        <Button type="primary">Thêm mới</Button>
                    </Flex>
                </Col>

                <Col span={24}>
                    <Table
                        data={data}
                        columns={[
                            {
                                title: 'STT',
                                align: 'center',
                                width: 80,
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * numberOfPages,
                            },
                            {
                                name: 'Tên chức vụ',
                                align: 'center',
                                width: 150,
                                render: (_, record) => record?.name || '',
                            },
                            {
                                name: 'Thao tác',
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <EditIcon />
                                            <DeleteIcon />
                                        </Row>
                                    )
                                },
                            },
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default CouncilPosition
