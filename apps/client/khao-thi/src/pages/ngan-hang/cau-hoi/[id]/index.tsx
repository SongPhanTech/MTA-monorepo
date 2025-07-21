import { EllipsisOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutQuestion } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useQuestionTypeOptions } from '@hooks/question-type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountQuestion,
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

export default function Question() {
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const questionBankId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: questionTypeOptions, getQuestionTypeLabel } = useQuestionTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        questionType: undefined,
        content: '',
        explanation: '',
        point: undefined,
    })

    const { onOpen: onOpenPutQuestion } = useDisclosure<{ id: string; questionBankId: string }>({
        tag: PutQuestion.name,
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

    const commonWhere = useMemo(
        () => ({
            questionBankId,
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.questionType && filters.questionType.length > 0
                ? {
                      type: { in: filters.questionType },
                  }
                : {}),
            ...(filters.content && filters.content !== ''
                ? {
                      content: {
                          contains: filters.content,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.explanation && filters.explanation !== ''
                ? {
                      explanation: {
                          contains: filters.explanation,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        }),
        [questionBankId, filters.code, filters.questionType, filters.content, filters.explanation]
    )

    const commonOrderBy = useMemo(
        () => [
            ...emptyObjectIf(
                [
                    {
                        point: filters.point,
                    },
                ],
                !!filters.point
            ),
            { point: 'asc' },
        ],
        [filters.point]
    )

    const queryOptions = useMemo(
        () => ({
            enabled: !!questionBankId,
        }),
        [questionBankId]
    )

    const { data } = useFindManyQuestion(
        {
            where: commonWhere,
            orderBy: commonOrderBy,
        },
        queryOptions
    )

    const { data: count } = useCountQuestion(
        {
            where: {
                ...commonWhere,
                deletedAt: null,
            },
            orderBy: commonOrderBy,
        },
        queryOptions
    )

    const { mutateAsync: updateQuestion } = useUpdateQuestion()
    async function handleDeleteQuestion(id: string) {
        try {
            showSpinner()
            await updateQuestion({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const itemsDownload = [
        {
            key: 'import',
            label: 'Nhập dữ liệu bằng excel',
            onClick: () => {},
            // onClick: () => setImportModalVisible(true),
        },
        {
            key: 'update',
            label: 'Tải file mẫu excel',
            onClick: () => {},
            // onClick: () => onOpenTrainingBlock,
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
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã',
                                dataIndex: 'code',
                                width: 80,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record) => {
                                    return record?.code
                                },
                            },
                            {
                                title: 'Nội dung câu hỏi',
                                dataIndex: 'content',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                render: (__, record) => {
                                    return record?.content
                                },
                            },
                            {
                                title: 'Loại câu hỏi',
                                dataIndex: 'questionType',
                                width: 120,
                                align: 'center',
                                type: 'select',
                                options: questionTypeOptions,
                                render: (__, record) =>
                                    getQuestionTypeLabel(record?.type) || 'Chưa xác định',
                            },
                            {
                                title: 'Điểm số',
                                dataIndex: 'point',
                                width: 100,
                                align: 'center',
                                type: 'order',
                            },
                            {
                                title: 'Giải thích đáp án',
                                dataIndex: 'explanation',
                                width: 200,
                                type: 'input',
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
                                width: 100,
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
        </div>
    )
}

Question.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Ngân hàng câu hỏi', href: ROUTER_PATH.KHAO_THI.NGAN_HANG_CAU_HOI },
                {
                    title: 'Câu hỏi',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
