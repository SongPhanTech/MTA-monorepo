// @ts-nocheck
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { ExamStatus } from '@workspace/db'
import { useCountExamSession, useFindManyExamSession, useFindUniqueExam } from '@workspace/db/hooks'
import { useSaveExamSessions } from '@workspace/libs/api/exam'
import { Button, Col, Flex, Input, message, Row } from 'antd'
import { Edit, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'

interface ExamSessionProps {
    id: string
}

export default function ExamSession({ id }: ExamSessionProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        code: '',
        fax: '',
    })
    const [editedData, setEditedData] = useState<Record<string, { fax?: string; score?: number }>>(
        {}
    )

    const where = useMemo(
        () => ({
            examId: id,
            ...(filters.name && filters.name !== ''
                ? {
                      student: {
                          userProfile: {
                              fullname: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.code && filters.code !== ''
                ? {
                      student: {
                          code: {
                              contains: filters.code,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.fax && filters.fax !== ''
                ? {
                      fax: {
                          contains: filters.fax,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [id, filters.name, filters.code, filters.fax]
    )

    const { data = [], refetch } = useFindManyExamSession(
        {
            where,
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
            orderBy: {
                student: {
                    userProfile: {
                        firstName: 'asc',
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: count } = useCountExamSession(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        { enabled: !!id }
    )

    const { mutateAsync: updateManyExamSession } = useSaveExamSessions()
    async function handleUpdateExamSession() {
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

            const res = await updateManyExamSession({ data: updates })

            if (res.status === 400) {
                message.error(`${res.data.message}`)
                return
            }

            message.success('Cập nhật thành công')
            setEditedData({})
            refetch()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

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

    const handleAutoGenerateFax = () => {
        if (!data.length) {
            message.warning('Không có sinh viên nào trong bảng')
            return
        }

        const usedFax = new Set<string>()
        const newEditedData: Record<string, { fax?: string; score?: number }> = {}

        data.forEach((s) => {
            const existingFax = editedData[s.id]?.fax ?? s.fax
            if (existingFax) usedFax.add(existingFax)
        })

        data.forEach((s) => {
            let fax = editedData[s.id]?.fax ?? s.fax
            if (!fax) {
                do {
                    fax = Math.floor(100000 + Math.random() * 900000).toString()
                } while (usedFax.has(fax))
                usedFax.add(fax)
            }

            newEditedData[s.id] = {
                ...editedData[s.id],
                fax,
            }
        })

        setEditedData(newEditedData)
        message.success('Đã sinh phách tự động, vui lòng nhấn Cập nhật để lưu')
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Button disabled={!isFinished} onClick={handleAutoGenerateFax}>
                                    <Shuffle />
                                    Sinh phách tự động
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleUpdateExamSession}
                                    disabled={!isFinished}
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname || '',
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
                                    <Input
                                        type="number"
                                        value={editedData[record.id]?.score ?? record.score ?? ''}
                                        onChange={(e) =>
                                            setEditedData((prev) => ({
                                                ...prev,
                                                [record.id]: {
                                                    ...prev[record.id],
                                                    score: Number(e.target.value),
                                                },
                                            }))
                                        }
                                        disabled={!isFinished}
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
