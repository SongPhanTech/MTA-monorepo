import Table, { type TableParamsAntdType } from '@components/commons/table'
import { Button, Col, Flex, Form, Input, Row, Tag } from 'antd'
import _ from 'lodash'
import { useMemo, useState } from 'react'

function TabDoiTuongKhaoSat() {
    const [tableParams, setTableParams] = useState<TableParamsAntdType>({
        pagination: {
            current: 1,
            pageSize: 10,
            total: 100,
        },
    })
    const [filters, setFilters] = useState({
        search: '',
        status: null,
    })
    const handleTableChange = (pagination: TableParamsAntdType) => {
        setTableParams((prev) => ({
            ...prev,
            pagination: { ...prev.pagination, ...pagination },
        }))
    }
    // const { onOpen, onClose } = useDisclosure()
    const handleSearchChange = useMemo(
        () =>
            _.debounce((value: string) => {
                setFilters((prev) => ({ ...prev, search: value }))
                setTableParams((prev) => ({
                    ...prev,
                    pagination: { ...prev.pagination, current: 1 },
                }))
            }, 500),
        []
    )
    const handleModal = () => {
        // onOpen()
    }
    const data = useMemo(() => {
        const totalItems = 100
        const start =
            (tableParams.pagination.current - 1) *
            tableParams.pagination.pageSize
        return Array.from(
            { length: tableParams.pagination.pageSize },
            (_, index) => {
                const i = start + index + 1
                return {
                    key: i,
                    name: `Đối tượng ${i}`,
                    startDate: `2024-01-${(i % 28) + 1}`,
                    endDate: `2024-02-${(i % 28) + 1}`,
                    trang_thai: i % 2 === 0,
                }
            }
        )
    }, [tableParams])
    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap="16px"
                    >
                        <Form.Item
                            label="Tìm kiếm"
                            name="search"
                            style={{ marginBottom: 0 }}
                        >
                            <Input
                                id="search"
                                style={{ width: 300 }}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Tìm kiếm ..."
                            />
                        </Form.Item>

                        <Button onClick={handleModal} type="primary">
                            Thêm mới
                        </Button>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (value, record, index) =>
                                    (tableParams.pagination.current - 1) *
                                        tableParams?.pagination?.pageSize +
                                    index +
                                    1,
                            },
                            {
                                title: 'Tên đối tượng khảo sát',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'trang_thai',
                                align: 'center',
                                width: 150,
                                render: (value, record) => {
                                    return value ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">
                                            Đang hoạt động
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                            },
                        ]}
                        data={data}
                        pagination={tableParams.pagination}
                        onChange={handleTableChange}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default TabDoiTuongKhaoSat
