import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import {
    ModalGraduationCriteria,
    PutAcademicRanking,
    PutCloneAcademicRanking,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { RankingContext, type TrainingCourse } from '@workspace/db'
import {
    useCountTrainingCourse,
    useDeleteAcademicRankingConvert,
    useFindManyTrainingCourse,
    useUpdateManyAcademicRankingConvert,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { Copy, Eye, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
}

export default function GraduationRankingPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data = [], refetch } = useFindManyTrainingCourse({
        where: {
            academicRankingConvert: {
                every: {
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
            academicRankingConvert: {
                where: {
                    context: RankingContext.GRADUATION,
                },
                orderBy: [{ trainingCourse: { createdAt: 'desc' } }, { base10Max: 'desc' }],
            },
        },
        orderBy: {
            name: 'asc',
        },
    })

    const { data: count } = useCountTrainingCourse({})

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{ id: string; type: string }>({
        tag: PutAcademicRanking.name,
    })

    const { onOpen: onOpenCopy } = useDisclosure<{ record: TrainingCourse }>({
        tag: PutCloneAcademicRanking.name,
    })

    const { onOpen: onOpenGraduationCriteria } = useDisclosure<string>({
        tag: ModalGraduationCriteria.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = (type: string) => {
        onOpen({ id: '', type })
    }

    const handleOpenModalGraduationCriteria = (record: any) => {
        onOpenGraduationCriteria(record.id)
    }

    const { mutateAsync: deleteAcademicRanking } = useDeleteAcademicRankingConvert()
    const { mutateAsync: updateManyAcademicRanking } = useUpdateManyAcademicRankingConvert()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await deleteAcademicRanking({
                where: {
                    id,
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleDeleteMultil(record: TrainingCourse) {
        try {
            showSpinner()

            await updateManyAcademicRanking({
                where: {
                    trainingCourseId: record.id,
                    context: RankingContext.GRADUATION,
                },
                data: {
                    deletedAt: new Date(),
                },
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
                                            handleFilterChange('searchText', e.target.value)
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
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button
                                    onClick={() => handleModal(RankingContext.GRADUATION)}
                                    type="primary"
                                >
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        data={data}
                        headerTitleKey={'name'}
                        childrenFieldName="academicRankingConvert"
                        onRowClick={(record) => handleOpenModalGraduationCriteria(record)}
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
                                title: 'Điểm hệ 4 từ',
                                dataIndex: 'base4Min',
                                align: 'center',
                            },
                            {
                                title: 'Điểm hệ 4 đến',
                                dataIndex: 'base4Max',
                                align: 'center',
                            },
                            {
                                title: 'Xếp loại',
                                dataIndex: 'classification',
                                width: 120,
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                render: (record) => {
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
                                                <Tooltip title="Chi tiết tiêu chí" placement="top">
                                                    <Eye
                                                        size={16}
                                                        strokeWidth={1.5}
                                                        className="text-base cursor-pointer"
                                                    />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        onOpen({
                                                            id,
                                                            type: RankingContext.GRADUATION,
                                                        })
                                                        e.stopPropagation()
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDelete(id)
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        headerRight={(record) => (
                            <Row className="justify-center gap-2 mr-2">
                                <Tooltip title="Nhân bản">
                                    <Copy
                                        onClick={onOpenCopy.bind(null, {
                                            record,
                                        })}
                                        size={16}
                                        strokeWidth={1.5}
                                        className="text-sm cursor-pointer"
                                    />
                                </Tooltip>

                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDeleteMultil(record),
                                    }}
                                />
                            </Row>
                        )}
                        currentPage={currentPage}
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

GraduationRankingPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
