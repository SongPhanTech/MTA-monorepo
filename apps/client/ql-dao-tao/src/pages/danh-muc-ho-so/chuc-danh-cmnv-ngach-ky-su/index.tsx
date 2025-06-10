import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Flex, Row } from 'antd'
import { useState } from 'react'

const fakeData = [
    {
        id: 1,
        code: 'CN001',
        name: 'Công nghệ thông tin1',
        description: 'Chuyên ngành về công nghệ thông tin',
    },
    {
        id: 2,
        code: 'CN002',
        name: 'Công nghệ thông tin2',
        description: 'Chuyên ngành về công nghệ thông tin',
    },
    {
        id: 3,
        code: 'CN003',
        name: 'Công nghệ thông tin3',
        description: 'Chuyên ngành về công nghệ thông tin',
    },
    {
        id: 4,
        code: 'CN004',
        name: 'Công nghệ thông tin4',
        description: 'Chuyên ngành về công nghệ thông tin',
    },
]

export default function ProfessionalTitleOfEngineer() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {}

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>Filter</Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        columns={[
                            {
                                title: 'STT',
                                width: 30,
                                align: 'center',
                                fixed: 'left',
                                render: (_, record, index) =>
                                    index +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE +
                                    1,
                            },
                            {
                                title: 'Mã chuyên ngành',
                                width: 80,
                                align: 'center',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên chuyên ngành',
                                width: 150,
                                align: 'center',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Mô tả',
                                width: 150,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                                                <DeleteIcon />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={fakeData}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: fakeData.length,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

ProfessionalTitleOfEngineer.getLayout = function getLayout(
    page: React.ReactElement
) {
    return <DefaultLayout>{page}</DefaultLayout>
}
