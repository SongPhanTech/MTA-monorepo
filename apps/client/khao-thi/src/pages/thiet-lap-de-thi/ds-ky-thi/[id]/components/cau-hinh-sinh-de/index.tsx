import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import NoExamBank from '@components/icons/icon-no-exambank'
import { ModalSinhDeThiTuDong, PutTestStructureRule } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import { ExamStatus } from '@workspace/db'
import {
    useCountTestStructureRule,
    useDeleteTestStructureRule,
    useFindManyKnowledgeBlock,
    useFindManyTestStructureRule,
    useFindUniqueExam,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface TestStructureRuleProps {
    id: string
}

export default function TestStructureRule({ id }: TestStructureRuleProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        knowledgeBlockId: undefined,
        count: undefined,
        questionPoint: undefined,
    })

    const { onOpen: onOpenPutTestStructureRule } = useDisclosure<{
        id: string
        examId: string
        subjectVersionId: string
    }>({
        tag: PutTestStructureRule.name,
    })

    const { onOpen: onOpenModalSinhDeThiTuDong } = useDisclosure<string>({
        tag: ModalSinhDeThiTuDong.name,
    })

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id },
            include: {
                questionBank: true,
            },
        },
        { enabled: !!id }
    )

    const where = useMemo(
        () => ({
            examId: id,
            ...(filters.knowledgeBlockId
                ? Array.isArray(filters.knowledgeBlockId)
                    ? { knowledgeBlockId: { in: filters.knowledgeBlockId } }
                    : { knowledgeBlockId: filters.knowledgeBlockId }
                : {}),
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      questionType: { in: filters.questionType },
                  }
                : {}),
        }),
        [id, filters.knowledgeBlockId, filters.questionType]
    )

    const { data = [] } = useFindManyTestStructureRule(
        {
            where,
            include: {
                knowledgeBlock: true,
            },
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            count: filters.count,
                        },
                    ],
                    !!filters.count
                ),
                ...emptyObjectIf(
                    [
                        {
                            questionPoint: filters.questionPoint,
                        },
                    ],
                    !!filters.questionPoint
                ),
                { questionPoint: 'asc' },
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: count } = useCountTestStructureRule(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        { enabled: !!id }
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { subjectVersionId: initialValue?.questionBank?.subjectVersionId },
    })

    const { mutateAsync: deleteTestStructureRule } = useDeleteTestStructureRule()
    async function handleDeleteTestStructureRule(id: string) {
        try {
            showSpinner()
            await deleteTestStructureRule({
                where: { id },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const isDraft = useMemo(() => {
        if (!id) return true
        return initialValue?.status === ExamStatus.DRAFT
    }, [id, initialValue?.status])

    return (
        <div>
            {data.length > 0 ? (
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="end">
                            <Col span={12}>
                                <strong>
                                    {!isDraft && 'Chỉ có thể sửa khi kỳ thi ở trạng thái: Bản nháp'}
                                </strong>
                            </Col>
                            <Col span={12}>
                                <Flex justify="end" gap={4}>
                                    <Button
                                        onClick={() => onOpenModalSinhDeThiTuDong(id)}
                                        disabled={!isDraft}
                                    >
                                        <Shuffle />
                                        Sinh đề tự động
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            onOpenPutTestStructureRule({
                                                id: '',
                                                examId: id,
                                                subjectVersionId:
                                                    initialValue?.questionBank?.subjectVersionId ||
                                                    '',
                                            })
                                        }
                                        disabled={!isDraft}
                                    >
                                        <BookPlus />
                                        Thêm mới
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
                                    title: 'Chương mục',
                                    dataIndex: 'knowledgeBlockId',
                                    width: 200,
                                    align: 'center',
                                    type: 'select',
                                    options: knowledgeBlockData?.map(({ id, name }) => ({
                                        value: id,
                                        label: name,
                                    })),
                                    render: (__, record) => {
                                        return record?.knowledgeBlock?.name || 'Chưa xác định'
                                    },
                                },
                                {
                                    title: 'Loại câu hỏi',
                                    dataIndex: 'questionType',
                                    width: 200,
                                    align: 'center',
                                    type: 'select',
                                    options: questionTypeOptions,
                                    render: (__, record) =>
                                        getQuestionTypeLabel(record?.questionType) ||
                                        'Chưa xác định',
                                },
                                {
                                    title: 'Số lượng câu hỏi',
                                    dataIndex: 'count',
                                    width: 200,
                                    align: 'center',
                                    type: 'order',
                                },
                                {
                                    title: 'Điểm từng câu',
                                    dataIndex: 'questionPoint',
                                    width: 200,
                                    align: 'center',
                                    type: 'order',
                                },
                                {
                                    title: 'Thao tác',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (__, record) => {
                                        if (record?.id) {
                                            return (
                                                <Row className="justify-center gap-2">
                                                    <EditIcon
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                        onClick={() =>
                                                            onOpenPutTestStructureRule({
                                                                id: record.id,
                                                                examId: id,
                                                                subjectVersionId:
                                                                    initialValue?.questionBank
                                                                        ?.subjectVersionId || '',
                                                            })
                                                        }
                                                        disabled={!isDraft}
                                                    />
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: () =>
                                                                handleDeleteTestStructureRule(
                                                                    record.id
                                                                ),
                                                        }}
                                                        disabled={!isDraft}
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
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <NoExamBank />
                    <span className="text-[#4A4A4A] text-[13px]">
                        Chưa có cấu hình đề thi nào. Vui lòng thêm mới cấu hình đề thi.
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            onClick={() =>
                                onOpenPutTestStructureRule({
                                    id: '',
                                    examId: id,
                                    subjectVersionId:
                                        initialValue?.questionBank?.subjectVersionId || '',
                                })
                            }
                            disabled={!isDraft}
                        >
                            <BookPlus />
                            Thêm cấu hình đề thi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
