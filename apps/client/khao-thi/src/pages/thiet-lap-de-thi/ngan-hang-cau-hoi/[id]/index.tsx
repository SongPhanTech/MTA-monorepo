import { EllipsisOutlined } from '@ant-design/icons'
import HtmlTruncate from '@components/commons/html-truncate'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { WordImportModal } from '@components/sub-pages'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import { type Question, QuestionType } from '@workspace/db'
import {
    useCountQuestion,
    useCreateManyQuestion,
    useFindManyDifficulty,
    useFindManyKnowledgeBlock,
    useFindManyQuestion,
    useFindUniqueQuestionBank,
    useUpdateQuestion,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Dropdown, Flex, Menu, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { env } from '@/env'

export default function QuestionPage() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const questionBankId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        content: '',
        explanation: '',
        point: undefined,
        difficultyId: undefined,
        knowledgeBlockId: undefined,
    })

    const { onOpen: onOpenPutQuestion } = useDisclosure<{
        id: string
        questionBankId: string
        subjectVersionId: string
    }>({
        tag: 'PutQuestionModal',
    })

    const { data: initialValue } = useFindUniqueQuestionBank(
        {
            where: { id: questionBankId },
            include: {
                subjectVersion: true,
            },
        },
        { enabled: !!questionBankId }
    )

    const where = useMemo(
        () => ({
            questionBankId,
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      type: { in: filters.questionType },
                  }
                : {}),
            ...(filters.content && filters.content !== ''
                ? {
                      content: {
                          contains: filters.content,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.explanation && filters.explanation !== ''
                ? {
                      explanation: {
                          contains: filters.explanation,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.difficultyId
                ? Array.isArray(filters.difficultyId)
                    ? { difficultyId: { in: filters.difficultyId } }
                    : { difficultyId: filters.difficultyId }
                : {}),
            ...(filters.knowledgeBlockId
                ? Array.isArray(filters.knowledgeBlockId)
                    ? { knowledgeBlockId: { in: filters.knowledgeBlockId } }
                    : { knowledgeBlockId: filters.knowledgeBlockId }
                : {}),
        }),
        [
            questionBankId,
            filters.questionType,
            filters.content,
            filters.explanation,
            filters.difficultyId,
            filters.knowledgeBlockId,
        ]
    )

    const queryOptions = useMemo(
        () => ({
            enabled: !!questionBankId,
        }),
        [questionBankId]
    )

    const { data } = useFindManyQuestion(
        {
            where,
            include: {
                knowledgeBlock: true,
                difficulty: true,
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            point: filters.point,
                        },
                    ],
                    !!filters.point
                ),
                { point: 'asc' },
                { createdAt: 'desc' },
            ],
        },
        queryOptions
    )

    const { data: count } = useCountQuestion(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        queryOptions
    )

    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: { subjectVersionId: initialValue?.subjectVersionId },
    })

    const { data: difficultyData } = useFindManyDifficulty({
        orderBy: { level: 'asc' },
    })

    const { mutateAsync: updateQuestion } = useUpdateQuestion()
    async function handleDeleteQuestion(id: string) {
        try {
            showSpinner()
            await updateQuestion({
                where: { id },
                data: { deletedAt: new Date() },
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

    const { mutateAsync: createManyQuestions } = useCreateManyQuestion()

    const handleImportSuccess = async (questions: Partial<Question>[]) => {
        try {
            showSpinner()
            await createManyQuestions({
                data: questions
                    .filter((q) => typeof q.content === 'string' && q.content.trim() !== '')
                    .map((q) => ({
                        ...q,
                        content: q.content as string,
                        questionBankId,
                        type: q.type || QuestionType.ESSAY,
                        isAutoGraded: q.isAutoGraded || false,
                    })),
            })
            message.success(`Đã thêm ${questions.length} câu hỏi thành công`)
            setImportModalVisible(false)
        } catch (error) {
            message.error('Có lỗi xảy ra khi thêm câu hỏi')
        } finally {
            hideSpinner()
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(
                `${env.NEXT_PUBLIC_ASSET_PREFIX}/files/file-mau-import-cau-hoi.docx`
            )
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = 'file-mau-import-cau-hoi.docx'
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)

            message.success('Đang tải file mẫu...')
        } catch (error) {
            message.error('Không thể tải file mẫu')
            console.error('Lỗi tải file:', error)
        }
    }

    const itemsDownload = [
        {
            key: 'import',
            label: 'Nhập dữ liệu bằng word',
            onClick: () => setImportModalVisible(true),
        },
        {
            key: 'update',
            label: 'Tải file mẫu',
            onClick: handleDownloadTemplate,
        },
    ]
    const menuDownload = (
        <Menu>
            {itemsDownload.map((item) => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    )

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[initialValue?.code, initialValue?.name, initialValue?.subjectVersion?.name]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button
                                        className="text-primary border-primary mr-2 min-w-[32px]"
                                        icon={<EllipsisOutlined />}
                                    />
                                </Dropdown>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenPutQuestion({
                                            id: '',
                                            questionBankId,
                                            subjectVersionId: initialValue?.subjectVersionId || '',
                                        })
                                    }
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
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Nội dung câu hỏi',
                                dataIndex: 'content',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                render: (html: string) => (
                                    <HtmlTruncate key="explanation">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: html
                                                    ? renderWithMath(html)
                                                    : '<i>Chưa có nội dung</i>',
                                            }}
                                        />
                                    </HtmlTruncate>
                                ),
                            },
                            {
                                title: 'Loại câu hỏi',
                                dataIndex: 'questionType',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                options: questionTypeOptions,
                                render: (__, record) =>
                                    getQuestionTypeLabel(record?.type) || 'Chưa xác định',
                            },
                            {
                                title: 'Chương mục',
                                dataIndex: 'knowledgeBlockId',
                                width: 100,
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
                                title: 'Độ khó',
                                dataIndex: 'difficultyId',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                options: difficultyData?.map(({ id, name, level }) => ({
                                    value: id,
                                    label: `${name} (level ${level})`,
                                })),
                                render: (__, record) => {
                                    if (!record?.difficulty) {
                                        return 'Chưa xác định'
                                    }
                                    if (!record.difficulty.name) {
                                        return `Level ${record.difficulty.level || 'N/A'}`
                                    }
                                    if (!record.difficulty.level) {
                                        return record.difficulty.name
                                    }
                                    return `${record.difficulty.name} (level ${record.difficulty.level})`
                                },
                            },
                            {
                                title: 'Điểm số',
                                dataIndex: 'point',
                                width: 80,
                                align: 'center',
                                type: 'order',
                                render: (__, record) => {
                                    if (!record?.point) {
                                        return ''
                                    }
                                    return `${record.point} điểm`
                                },
                            },
                            {
                                title: 'Giải thích đáp án',
                                dataIndex: 'explanation',
                                width: 300,
                                type: 'input',

                                render: (html: string) => (
                                    <HtmlTruncate key="explanation">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: html
                                                    ? renderWithMath(html)
                                                    : '<i>Chưa có nội dung</i>',
                                            }}
                                        />
                                    </HtmlTruncate>
                                ),
                            },
                            // {
                            //     title: 'Tự động chấm điểm',
                            //     dataIndex: 'isAutoGraded',
                            //     align: 'center',
                            //     width: 120,
                            //     render: (value) => {
                            //         return (
                            //             <div className="flex items-center justify-center">
                            //                 <Checkbox checked={value} disabled />
                            //             </div>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 80,
                                align: 'center',
                                fixed: 'right',
                                render: (__, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                    onClick={() =>
                                                        onOpenPutQuestion({
                                                            id: record.id,
                                                            questionBankId,
                                                            subjectVersionId:
                                                                initialValue?.subjectVersionId ||
                                                                '',
                                                        })
                                                    }
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteQuestion(record.id),
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
            <WordImportModal
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onImportSuccess={(questions) => {
                    handleImportSuccess(questions)
                }}
            />
        </div>
    )
}

QuestionPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                {
                    title: 'Thiết lập đề thi',
                },
                {
                    title: 'Ngân hàng câu hỏi',
                    href: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                },
                {
                    title: 'Câu hỏi',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
