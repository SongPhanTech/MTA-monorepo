import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useCountExamPaper, useFindManyExamPaper } from '@workspace/db/hooks'
import { Col, Flex, InputNumber, message, Row } from 'antd'
import { useMemo, useState } from 'react'

interface ExamFaxProps {
    id: string
}

export default function ManageExamCode({ id }: ExamFaxProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        examCode: '',
        score: undefined,
    })
    const [editedData, setEditedData] = useState<Record<string, { id?: string; score?: number }>>(
        {}
    )

    const where = useMemo(
        () => ({
            examId: id,
            ...(filters.examCode && {
                examCode: {
                    contains: filters.examCode,
                    mode: 'insensitive' as const,
                },
            }),
            deletedAt: null,
        }),
        [id, filters.examCode]
    )

    const { data = [], refetch } = useFindManyExamPaper(
        {
            where,
            include: {
                studentSubjectScore: { select: { examScore: true } },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: count, refetch: refetchCount } = useCountExamPaper({ where }, { enabled: !!id })

    async function handleUpdateExamFaxes() {
        try {
            showSpinner()

            const updates = Object.entries(editedData).map(([id, values]) => {
                const original = data.find((d) => d.id === id)
                const scoreValue = values.score ?? original?.studentSubjectScore.examScore ?? null

                return {
                    id,
                    score: scoreValue !== null ? Number(scoreValue) : null,
                }
            })

            if (updates.length === 0) {
                message.info('Không có dữ liệu nào thay đổi')
                return
            }

            message.success('Cập nhật thành công')
            setEditedData({})
            refetch()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                {/* <Button
                                    type="primary"
                                    disabled={!isFinished}
                                    onClick={handleUpdateExamFaxes}
                                >
                                    <Edit />
                                    Cập nhật
                                </Button> */}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="key"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Phách',
                                dataIndex: 'examCode',
                                width: 120,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Điểm',
                                dataIndex: 'score',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => (
                                    <InputNumber
                                        min={0}
                                        type="number"
                                        value={
                                            editedData[record.id]?.score ??
                                            record.studentSubjectScore.examScore ??
                                            ''
                                        }
                                        onChange={(e) =>
                                            setEditedData((prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                    ...prev[record.id],
                                                    score: Number(e),
                                                },
                                            }))
                                        }
                                        className="w-full"
                                    />
                                ),
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
        </div>
    )
}
