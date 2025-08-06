import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { ModalSinhDeThiTuDong, PutExamBank, PutTestStructureRule } from '@components/modal'
import { ModalExamBank } from '@components/sub-pages'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountExamBank,
    useCountTestStructureRule,
    useFindManyExamBank,
    useFindManyKnowledgeBlock,
    useFindManyTestStructureRule,
    useFindUniqueExam,
    useUpdateExamBank,
    useUpdateTestStructureRule,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TestStructureRule() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const examId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [examBankModal, setExamBankModal] = useState({
        visible: false,
        examBankId: '',
        questionBankId: '',
        examCode: '',
    })
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

    const { onOpen: onOpenPutExamBank } = useDisclosure<{ examId: string; id: string }>({
        tag: PutExamBank.name,
    })

    const openExamBankModal = (examBankId: string, questionBankId: string, examCode: string) => {
        setExamBankModal({
            visible: true,
            examBankId,
            questionBankId,
            examCode,
        })
    }

    const closeExamBankModal = () => {
        setExamBankModal({
            visible: false,
            examBankId: '',
            questionBankId: '',
            examCode: '',
        })
    }

    const { data: initialValue } = useFindUniqueExam(
        {
            where: { id: examId },
            include: {
                questionBank: {
                    include: {
                        subjectVersion: true,
                    },
                },
            },
        },
        { enabled: !!examId }
    )

    const commonWhere = useMemo(
        () => ({
            examId,
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
        [examId, filters.knowledgeBlockId, filters.questionType]
    )

    const { data = [] } = useFindManyTestStructureRule(
        {
            where: commonWhere,
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
        { enabled: !!examId }
    )

    const { data: count } = useCountTestStructureRule(
        {
            where: {
                ...commonWhere,
                deletedAt: null,
            },
        },
        { enabled: !!examId }
    )

    const { data: examData = [], refetch } = useFindManyExamBank(
        {
            where: { examId },
            orderBy: { examCode: 'asc' },
            include: {
                questions: {
                    select: {
                        question: { select: { point: true } },
                    },
                },
                _count: { select: { questions: true } },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!examId }
    )

    const { data: countExam, refetch: refetchCount } = useCountExamBank(
        {
            where: {
                examId,
                deletedAt: null,
            },
        },
        { enabled: !!examId }
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { subjectVersionId: initialValue?.questionBank?.subjectVersionId },
    })

    const { mutateAsync: updateTestStructureRule } = useUpdateTestStructureRule()
    async function handleDeleteTestStructureRule(id: string) {
        try {
            showSpinner()
            await updateTestStructureRule({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: updateExamBank } = useUpdateExamBank()
    async function handleDeleteExamBank(id: string) {
        try {
            showSpinner()
            await updateExamBank({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { onOpen: onOpenModalSinhDeThiTuDong } = useDisclosure<string>({
        tag: ModalSinhDeThiTuDong.name,
        onClose: () => {
            refetch()
            refetchCount()
        },
    })

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    initialValue?.code,
                    initialValue?.title,
                    initialValue?.questionBank?.name,
                    initialValue?.duration && `${initialValue?.duration} phút`,
                    initialValue?.passScore && `Điểm đạt: ${initialValue?.passScore} điểm`,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <strong>Cấu hình tạo tự động</strong>
                        </Col>
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenPutTestStructureRule({
                                            id: '',
                                            examId,
                                            subjectVersionId:
                                                initialValue?.questionBank?.subjectVersionId || '',
                                        })
                                    }
                                >
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => onOpenModalSinhDeThiTuDong(examId)}
                                >
                                    <BookPlus />
                                    Tạo đề tự động
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
                                    getQuestionTypeLabel(record?.questionType) || 'Chưa xác định',
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
                                                            examId,
                                                            subjectVersionId:
                                                                initialValue?.questionBank
                                                                    ?.subjectVersionId || '',
                                                        })
                                                    }
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteTestStructureRule(
                                                                record.id
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
            <Row gutter={[16, 0]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <strong>Đề thi</strong>
                        </Col>
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    type="primary"
                                    onClick={() => onOpenPutExamBank({ examId, id: '' })}
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
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã đề',
                                align: 'center',
                                fixed: 'left',
                                dataIndex: 'examCode',
                            },
                            {
                                title: 'Số câu hỏi',
                                align: 'center',
                                dataIndex: ['_count', 'questions'],
                            },
                            {
                                title: 'Tổng điểm',
                                align: 'center',
                                render: (__, record) => {
                                    let total = 0
                                    if (!record?.questions) {
                                        return '-'
                                    }
                                    for (const q of record.questions) {
                                        total += q.question.point || 0
                                    }
                                    return total
                                },
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                fixed: 'right',
                                render: (__, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <ViewIcon
                                                    onClick={() =>
                                                        openExamBankModal(
                                                            record.id,
                                                            initialValue?.questionBankId ?? '',
                                                            record?.examCode ?? ''
                                                        )
                                                    }
                                                />
                                                <EditIcon
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                    onClick={() =>
                                                        onOpenPutExamBank({ examId, id: record.id })
                                                    }
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteExamBank(record.id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={examData}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: countExam,
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
            <ModalExamBank
                open={examBankModal.visible}
                onCancel={closeExamBankModal}
                examBankId={examBankModal.examBankId}
                questionBankId={examBankModal.questionBankId}
                subjectVersionName={initialValue?.questionBank?.subjectVersion?.name || ''}
                examCode={examBankModal.examCode}
            />
        </div>
    )
}

TestStructureRule.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                {
                    title: 'Thiết lập đề thi',
                },
                {
                    title: 'Danh sách kỳ thi',
                    href: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI,
                },
                {
                    title: 'Kỳ thi',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
