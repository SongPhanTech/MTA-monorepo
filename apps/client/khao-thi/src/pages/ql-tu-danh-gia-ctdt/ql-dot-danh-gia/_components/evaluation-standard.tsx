import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { emptyObjectIf } from '@workspace/constant'
import { useCountEvaluationStandard, useFindManyEvaluationStandard } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Form, Input, Row } from 'antd'
import { BookPlus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationStandardTab() {
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        searchText: '',
    })

    const { onOpen } = useDisclosure<{
        id?: string
    }>({
        tag: 'PutTieuChuanTieuChi',
    })

    const where = useMemo(
        () => ({
            ...(filters.searchText && {
                name: {
                    contains: filters.searchText,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.name && {
                criteria: {
                    some: {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                },
            }),
        }),
        [filters.searchText, filters.name]
    )

    const { data } = useFindManyEvaluationStandard({
        where: {
            ...where,
            deletedAt: null,
            periodId: selectedEvaluationPeriodId,
        },
        include: {
            criteria: {
                where: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                order: filters.order,
                            },
                        ],
                        !!filters.order
                    ),
                    { order: 'asc' },
                ],
            },
        },
        orderBy: [{ order: 'asc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountEvaluationStandard({
        where: {
            ...where,
            deletedAt: null,
            periodId: selectedEvaluationPeriodId,
        },
    })

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Row gutter={[8, 8]} align="middle" justify="space-between">
                    <Col flex="auto" style={{ maxWidth: '400px' }}>
                        <Form.Item name="searchText" className="mb-0">
                            <Input
                                id="search"
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        searchText: e.target.value,
                                    })
                                }
                                className="py-0 h-8"
                                placeholder="Tìm kiếm tiêu chuẩn đánh giá CTĐT"
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
                    <Col>
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                            'THEM'
                        ) && (
                            <Button
                                type="primary"
                                onClick={() => {
                                    onOpen()
                                }}
                            >
                                <BookPlus />
                                Thêm mới
                            </Button>
                        )}
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <TableCollapse
                    rowKey="id"
                    scroll={{
                        x: 'false',
                    }}
                    headerTitleKey={({ order, name }) => {
                        const parts = [order, name].filter(Boolean)
                        return `Tiêu chuẩn ${parts.join(' - ')}`
                    }}
                    childrenFieldName="criteria"
                    defaultExpandAll
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    columns={[
                        {
                            title: 'Thứ tự',
                            dataIndex: 'order',
                            width: 150,
                            align: 'center',
                            type: 'order',
                        },
                        {
                            title: 'Tiêu chí',
                            dataIndex: 'name',
                            type: 'input',
                            width: 300,
                        },
                    ]}
                    data={data}
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
    )
}
