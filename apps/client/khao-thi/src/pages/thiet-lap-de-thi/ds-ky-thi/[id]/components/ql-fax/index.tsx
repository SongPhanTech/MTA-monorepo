import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import { ExamStatus } from '@workspace/db'
import { useCountExamFax, useFindManyExamFax, useFindUniqueExam } from '@workspace/db/hooks'
import { useSaveExamFaxes } from '@workspace/libs/api/exam'
import { Button, Col, Flex, Input, InputNumber, message, Row } from 'antd'
import { Edit, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ExamFaxProps {
    id: string
}

export default function ExamFax({ id }: ExamFaxProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        fax: '',
        score: undefined,
    })
    const [editedData, setEditedData] = useState<Record<string, { fax?: string; score?: number }>>(
        {}
    )

    const { onOpen: onOpenModaLSinhFax } = useDisclosure<string>({
        tag: 'ModalSinhFax',
        onClose: () => {
            refetch()
            refetchCount()
        },
    })

    const where = useMemo(
        () => ({
            examId: id,
            ...(filters.fax && {
                fax: {
                    contains: filters.fax,
                    mode: 'insensitive' as const,
                },
            }),
        }),
        [id, filters.fax]
    )

    const { data = [], refetch } = useFindManyExamFax(
        {
            where,
            include: {},
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            score: filters.score,
                        },
                    ],
                    !!filters.score
                ),
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: count, refetch: refetchCount } = useCountExamFax(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        { enabled: !!id }
    )

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    const isFinished = useMemo(() => {
        if (!id) return true
        return initialValue?.status === ExamStatus.FINISHED
    }, [id, initialValue?.status])

    const { mutateAsync: updateManyExamFaxes } = useSaveExamFaxes()
    async function handleUpdateExamFaxes() {
        try {
            showSpinner()

            const updates = Object.entries(editedData).map(([id, values]) => {
                const original = data.find((d) => d.id === id)

                const scoreValue = values.score ?? original?.score ?? null

                return {
                    id,
                    fax: values.fax ?? original?.fax ?? null,
                    score: scoreValue !== null ? Number(scoreValue) : null,
                }
            })

            if (updates.length === 0) {
                message.info('Không có dữ liệu nào thay đổi')
                return
            }

            const res = await updateManyExamFaxes({ data: updates })

            if (res.status === 400) {
                message.error(`${res.data.message}`)
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
                            <strong>
                                {!isFinished &&
                                    'Chỉ có thể sửa khi kỳ thi ở trạng thái: Đã kết thúc'}
                            </strong>
                        </Col>
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    disabled={!isFinished}
                                    onClick={() => onOpenModaLSinhFax(id)}
                                >
                                    <Shuffle />
                                    Sinh phách tự động
                                </Button>
                                <Button
                                    type="primary"
                                    disabled={!isFinished}
                                    onClick={handleUpdateExamFaxes}
                                >
                                    <Edit />
                                    Cập nhật
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="key"
                        filters={filters}
                        setFilters={setFilters}
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
                                title: 'Fax',
                                dataIndex: 'fax',
                                width: 120,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => (
                                    <Input
                                        value={editedData[record.id]?.fax ?? record.fax ?? ''}
                                        onChange={(e) =>
                                            setEditedData((prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                    ...prev[record.id],
                                                    fax: e.target.value,
                                                },
                                            }))
                                        }
                                        disabled={!isFinished}
                                    />
                                ),
                            },
                            {
                                title: 'Điểm',
                                dataIndex: 'score',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                render: (_, record) => (
                                    <InputNumber
                                        type="number"
                                        value={editedData[record.id]?.score ?? record.score ?? ''}
                                        onChange={(e) =>
                                            setEditedData((prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                    ...prev[record.id],
                                                    score: Number(e),
                                                },
                                            }))
                                        }
                                        disabled={!isFinished}
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
