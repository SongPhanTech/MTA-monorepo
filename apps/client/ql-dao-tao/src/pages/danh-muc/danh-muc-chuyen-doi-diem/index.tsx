import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutConvertScore } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountScoreConvert,
    useFindManyTrainingCourse,
    useUpdateScoreConvert,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
    active: string | undefined
}

const DataActive = [
    { value: 'true', name: 'Đang áp dụng' },
    { value: 'false', name: 'Không áp dụng' },
    { value: 'all', name: 'Tất cả' },
]

export default function TrainingFieldPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        active: 'true',
    })

    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            scoreConverts: {
                some: {
                    active:
                        filters.active === 'true'
                            ? true
                            : filters.active === 'false'
                              ? false
                              : undefined,
                    ...(filters.searchText && filters.searchText.trim() !== ''
                        ? {
                              AND: [
                                  {
                                      base10Min: {
                                          lte: Number(filters.searchText),
                                      },
                                  },
                                  {
                                      base10Max: {
                                          gte: Number(filters.searchText),
                                      },
                                  },
                              ],
                          }
                        : {}),
                },
            },
        },
        include: {
            scoreConverts: {
                orderBy: [
                    { trainingCourse: { createdAt: 'desc' } },
                    { base10Max: 'desc' },
                ],
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    const { data: count } = useCountScoreConvert({
        where: {
            active:
                filters.active === 'true'
                    ? true
                    : filters.active === 'false'
                      ? false
                      : undefined,
            ...(filters.searchText && filters.searchText.trim() !== ''
                ? {
                      AND: [
                          { base10Min: { lte: Number(filters.searchText) } },
                          { base10Max: { gte: Number(filters.searchText) } },
                      ],
                  }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutConvertScore.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: UpdateScoreConvert } = useUpdateScoreConvert()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await UpdateScoreConvert({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Form.Item name="searchText">
                                    <Input
                                        id="search"
                                        type="number"
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'searchText',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Tìm kiếm điểm"
                                        style={{
                                            width: 300,
                                            marginRight: 8,
                                            height: 32,
                                        }}
                                        prefix={
                                            <Search
                                                size={16}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item name="active" initialValue="true">
                                    <Select
                                        id="active"
                                        placeholder="Chọn trạng thái"
                                        style={{ width: 200 }}
                                        options={DataActive.map((item) => ({
                                            label: item.name,
                                            value:
                                                item.value === undefined
                                                    ? undefined
                                                    : item.value.toString(),
                                        }))}
                                        onChange={(value) =>
                                            handleFilterChange('active', value)
                                        }
                                    />
                                </Form.Item>
                            </Flex>
                        </Col>
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
                    <TableCollapse
                        data={data}
                        columns={[
                            {
                                title: 'Điểm hệ 10 từ',
                                dataIndex: 'base10Min',
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ 10 đến',
                                dataIndex: 'base10Max',
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ 4',
                                dataIndex: 'base4',
                                align: 'center',
                            },
                            {
                                title: 'Điểm chữ',
                                align: 'center',
                                dataIndex: 'letter',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không áp dụng</Tag>
                                    ) : (
                                        <Tag color="success">Đang áp dụng</Tag>
                                    )
                                },
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
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        defaultExpandAll
                        headerTitleKey={'name'}
                        currentPage={currentPage}
                        childrenFieldName="scoreConverts"
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
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

TrainingFieldPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
