import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamStatusOptions } from '@hooks/exam-status'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountExam,
    useFindManyExam,
    useFindManyQuestionBank,
    useUpdateExam,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Checkbox, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, Pencil } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

function Exam() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const {
        options: examStatusOptions,
        getExamStatusLabel,
        getExamStatusColor,
    } = useExamStatusOptions()
    const [filters, setFilters] = useState<FilterProps>({
        title: '',
        startTime: undefined,
        endTime: undefined,
        duration: undefined,
        passScore: undefined,
        examStatus: undefined,
        questionBankId: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.title && filters.title !== ''
                ? {
                      title: {
                          contains: filters.title,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.startTime?.length === 2
                ? {
                      startTime: {
                          gte: dayjs(filters.startTime?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startTime?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endTime?.length === 2
                ? {
                      endTime: {
                          gte: dayjs(filters.endTime?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endTime?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.examStatus && filters.examStatus.length > 0
                ? {
                      status: { in: filters.examStatus },
                  }
                : {}),
            ...(filters.questionBankId
                ? {
                      questionBankId: Array.isArray(filters.questionBankId)
                          ? { in: filters.questionBankId }
                          : filters.questionBankId,
                  }
                : {}),
        }),
        [
            filters.title,
            filters.startTime,
            filters.endTime,
            filters.examStatus,
            filters.questionBankId,
        ]
    )

    const { data = [] } = useFindManyExam({
        where,
        include: {
            questionBank: true,
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        duration: filters.duration,
                    },
                ],
                !!filters.duration
            ),
            ...emptyObjectIf(
                [
                    {
                        passScore: filters.passScore,
                    },
                ],
                !!filters.passScore
            ),
            { duration: 'desc' },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountExam({
        where: { ...where, deletedAt: null },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateExam } = useUpdateExam()
    async function handleDeleteExam(id: string) {
        try {
            showSpinner()
            await updateExam({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
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

    const { data: questionBankData } = useFindManyQuestionBank()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button
                                    onClick={() => {
                                        router.push(
                                            `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/create`
                                        )
                                    }}
                                    type="primary"
                                >
                                    <BookPlus />
                                    Thêm kỳ thi
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        onRowClick={({ id }) => {
                            router.push(`${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI}/${id}`)
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
                                title: 'Tên kỳ thi',
                                dataIndex: 'title',
                                fixed: 'left',
                                width: 220,
                                type: 'input',
                            },
                            {
                                title: 'Phiên bản ngân hàng câu hỏi',
                                dataIndex: 'questionBankId',
                                fixed: 'left',
                                width: 220,
                                type: 'select',
                                options: questionBankData?.map(({ id, name }) => ({
                                    value: id,
                                    label: name,
                                })),
                                render: (_, record) => record?.questionBank?.name || 'Chưa có',
                            },
                            {
                                title: 'Thời gian bắt dầu',
                                dataIndex: 'startTime',
                                align: 'center',
                                width: 150,
                                type: 'date',
                                render: (value) => dayjs(value).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Thời gian kết thúc',
                                dataIndex: 'endTime',
                                align: 'center',
                                width: 150,
                                type: 'date',
                                render: (value) => dayjs(value).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Thời gian thi',
                                dataIndex: 'duration',
                                align: 'center',
                                width: 150,
                                type: 'order',
                                render: (value) => {
                                    return <span>{value ? `${value} phút` : ''}</span>
                                },
                            },
                            {
                                title: 'Điểm đạt',
                                dataIndex: 'passScore',
                                align: 'center',
                                width: 100,
                                type: 'order',
                            },
                            {
                                title: 'Xáo trộn câu hỏi',
                                dataIndex: 'shuffleQuestions',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Xáo trộn đáp án',
                                dataIndex: 'shuffleAnswers',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Hiển thị kết quả ngay',
                                dataIndex: 'showResult',
                                align: 'center',
                                width: 100,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'examStatus',
                                align: 'center',
                                fixed: 'right',
                                width: 100,
                                type: 'select',
                                options: examStatusOptions,
                                render: (__, record) => {
                                    return (
                                        <Tag color={getExamStatusColor(record?.status)}>
                                            {getExamStatusLabel(record?.status)}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Chỉnh sửa" placement="top">
                                            <Pencil
                                                size={16}
                                                strokeWidth={1.5}
                                                className="text-sm cursor-pointer text-blue-700"
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: (e) => {
                                                    handleDeleteExam(id)
                                                    e?.stopPropagation()
                                                },
                                                onCancel: (e) => {
                                                    e?.stopPropagation()
                                                },
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </Row>
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

export default Exam
