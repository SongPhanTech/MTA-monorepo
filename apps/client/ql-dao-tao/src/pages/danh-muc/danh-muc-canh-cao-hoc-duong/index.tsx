import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutDisciplinaryWarningReason } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountDisciplinaryWarningReason,
    useFindManyDisciplinaryWarningReason,
    useUpdateDisciplinaryWarningReason,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
}

export default function DisciplinaryWarningReason() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data = [], refetch } = useFindManyDisciplinaryWarningReason({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),
        },
        orderBy: {
            createdAt: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountDisciplinaryWarningReason({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
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
    const { onOpen: onOpenPutDisciplinaryWarningReason } = useDisclosure<string>({
        tag: PutDisciplinaryWarningReason.name,
    })

    const handleModal = () => {
        onOpenPutDisciplinaryWarningReason()
    }

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateDisciplinaryWarningReason } = useUpdateDisciplinaryWarningReason()
    async function handleDeleteDisciplinaryWarningReason(id: string) {
        try {
            showSpinner()
            await updateDisciplinaryWarningReason({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
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
                        <Flex>
                            <Col span={8}>
                                <Form.Item name="searchText">
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            handleFilterChange('searchText', e.target.value)
                                        }
                                        className="py-0 w-[300px]"
                                        placeholder="Tìm kiếm cảnh cáo học đường"
                                        prefix={
                                            <Search
                                                size={15}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                        </Flex>

                        <Col span={4}>
                            <Flex justify="end" gap={4}>
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
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
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã tiêu chí',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Mức nâng',
                                dataIndex: 'severityLevel',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Mô tả',
                                width: 200,
                                align: 'center',
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return (
                                        <Tooltip title={value}>
                                            <div className="line-clamp-2">{value}</div>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                fixed: 'right',
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
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
                                                    onClick={() =>
                                                        onOpenPutDisciplinaryWarningReason(
                                                            record?.id
                                                        )
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteDisciplinaryWarningReason(
                                                                record?.id
                                                            ),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

DisciplinaryWarningReason.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
