import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import { ExamStatus } from '@workspace/db'
import {
    useCountExamSession,
    useFindManyExamFax,
    useFindManyExamSession,
    useFindUniqueExam,
} from '@workspace/db/hooks'
import { useSaveExamSessions } from '@workspace/libs/api/exam'
import { Button, Col, Flex, message, Row, Select } from 'antd'
import { Edit, Eye, EyeOff } from 'lucide-react'
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
        score: undefined,
    })
    const [editedData, setEditedData] = useState<Record<string, { fax?: string }>>({})
    const [showScores, setShowScores] = useState(false)

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
                      examFax: {
                          fax: {
                              contains: filters.fax,
                              mode: 'insensitive' as const,
                          },
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
                examFax: true,
            },
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            examFax: {
                                score: filters.score,
                            },
                        },
                    ],
                    !!filters.score
                ),
                {
                    student: {
                        userProfile: {
                            firstName: 'asc',
                        },
                    },
                },
            ],
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

    const { mutateAsync: saveExamSessions } = useSaveExamSessions()
    async function handleUpdateExamSession() {
        try {
            showSpinner()

            const updates = Object.entries(editedData).map(([id, values]) => {
                return {
                    id,
                    examFaxId: values.fax ?? null,
                }
            })

            if (updates.length === 0) {
                message.info('Không có dữ liệu nào thay đổi')
                return
            }

            const res = await saveExamSessions({ data: updates })

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

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    const { data: faxData } = useFindManyExamFax(
        {
            where: {
                examId: id,
            },
        },
        { enabled: !!id }
    )

    const isFinished = useMemo(() => {
        if (!id) return true
        return initialValue?.status === ExamStatus.FINISHED
    }, [id, initialValue?.status])

    const usedFaxIds = useMemo(() => {
        return data
            .map((d) => {
                if (d.id in editedData) {
                    return editedData[d.id]?.fax ?? null
                }
                return d.examFax?.id
            })
            .filter(Boolean)
    }, [data, editedData])

    const availableFax = useMemo(() => {
        return faxData?.filter((f) => !usedFaxIds.includes(f.id)) ?? []
    }, [faxData, usedFaxIds])

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
                                    onClick={() => setShowScores((prev) => !prev)}
                                    disabled={
                                        data.length === 0 ||
                                        !data.some((item) => item.examFax && item.examFax)
                                    }
                                >
                                    {showScores ? <EyeOff /> : <Eye />}
                                    {showScores ? 'Ẩn điểm' : 'Xem điểm'}
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleUpdateExamSession}
                                    disabled={!isFinished}
                                >
                                    <Edit />
                                    Lưu
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
                                render: (_, record) => {
                                    const hasEdited = record.id in editedData
                                    const currentFaxId = hasEdited
                                        ? editedData[record.id]?.fax
                                        : record.examFax?.id

                                    const currentFaxLabel =
                                        faxData?.find((f) => f.id === currentFaxId)?.fax ||
                                        record.examFax?.fax

                                    const options = [
                                        ...(currentFaxId &&
                                        !availableFax.find((f) => f.id === currentFaxId)
                                            ? [{ value: currentFaxId, label: currentFaxLabel }]
                                            : []),
                                        ...availableFax.map((f) => ({
                                            value: f.id,
                                            label: f.fax,
                                        })),
                                    ]

                                    return (
                                        <Select
                                            className="w-full"
                                            value={currentFaxId ?? undefined}
                                            options={options}
                                            onChange={(value) =>
                                                setEditedData((prev) => ({
                                                    ...prev,
                                                    [record.id]: {
                                                        ...prev[record.id],
                                                        fax: value ?? null,
                                                    },
                                                }))
                                            }
                                            disabled={!isFinished}
                                            allowClear
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Điểm',
                                dataIndex: 'score',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                render: (_, record) =>
                                    showScores ? (record?.examFax?.score?.toString() ?? '') : '***',
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
