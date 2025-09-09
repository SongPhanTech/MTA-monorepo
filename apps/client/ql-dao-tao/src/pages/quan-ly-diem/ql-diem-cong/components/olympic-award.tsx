import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountArchivedAward,
    useFindManyArchivedAward,
    useUpdateArchivedAward,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function OplympicAwards() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        bonusScore: undefined,
        count: undefined,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutOlympicScoreModal',
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateArchivedAward } = useUpdateArchivedAward()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateArchivedAward({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: dataTable = [], refetch } = useFindManyArchivedAward({
        where: {
            name: { contains: filters.name, mode: 'insensitive' },
        },
        include: { _count: true },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        bonusScore: filters.bonusScore,
                    },
                ],
                !!filters.bonusScore
            ),
            ...emptyObjectIf(
                [
                    {
                        studentSubjectScore: {
                            _count: filters.count,
                        },
                    },
                ],
                !!filters.count
            ),
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountArchivedAward({
        where: {
            name: { contains: filters.name, mode: 'insensitive' },
        },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24} className="mt-3">
                            <Flex justify="space-between">
                                <Col span={6}>
                                    {/* <Form.Item className="mb-0" name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            allowClear
                                        />
                                    </Form.Item> */}
                                </Col>
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>

                        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên giải thưởng',
                                dataIndex: 'name',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Điểm cộng',
                                dataIndex: 'bonusScore',
                                width: 250,
                                align: 'center',
                                type: 'order',
                            },
                            {
                                title: 'Số SV đã được cộng',
                                dataIndex: 'count',
                                width: 250,
                                align: 'center',
                                type: 'order',
                                render: (__, record) => {
                                    return record._count?.studentSubjectScore
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id, _count }) => {
                                    if (!_count?.studentSubjectScore) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataTable}
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}
