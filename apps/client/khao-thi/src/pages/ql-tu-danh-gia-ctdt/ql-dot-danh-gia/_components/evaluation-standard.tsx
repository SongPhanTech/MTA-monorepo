import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useCountStandardPeriod, useFindManyStandardPeriod } from '@workspace/db/hooks'
import { Button, Col, Row } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationStandardTab() {
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const { onOpen } = useDisclosure<{
        id?: string
        refetch?: () => void
    }>({
        tag: 'PutTieuChuanTieuChi',
    })

    const where = useMemo(
        () => ({
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
        [filters.name]
    )

    const { data, isLoading, refetch } = useFindManyStandardPeriod(
        {
            where: {
                ...where,
                periodId: selectedEvaluationPeriodId,
            },
            include: {
                criteria: true,
            },
            orderBy: {
                order: 'asc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!selectedEvaluationPeriodId,
        }
    )

    const { data: count } = useCountStandardPeriod({
        where: {
            ...where,
            periodId: selectedEvaluationPeriodId,
        },
    })

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Row gutter={[8, 8]} align="middle" justify="end">
                    <Col>
                        {!data || data.length === 0 ? (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    onOpen({
                                        refetch,
                                    })
                                }}
                            >
                                Thêm mới
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    onOpen({ id: data[0]?.id, refetch })
                                }}
                            >
                                Chỉnh sửa
                            </Button>
                        )}
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <TableCollapse
                    rowKey="id"
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
                    loading={isLoading}
                    scroll={{ y: 'calc(100vh - 260px)' }}
                    columns={[
                        {
                            title: 'Thứ tự',
                            dataIndex: 'order',
                            width: 50,
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
