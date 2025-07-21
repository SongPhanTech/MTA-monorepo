import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilte'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutKnowledgeBlock } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSubjectVersion,
    useFindManySubjectVersion,
    useUpdateKnowledgeBlock,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function KnowledgeBlock() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        subjectVersionId: undefined,
    })

    const { data, refetch } = useFindManySubjectVersion({
        include: { knowledgeBlocks: { include: { questions: true } } },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectVersion()

    const { onOpen: onOpenPutKnowledgeBlock } = useDisclosure<{
        id: string
        subjectVersionId: string
    }>({
        tag: PutKnowledgeBlock.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateKnowledgeBlock } = useUpdateKnowledgeBlock()
    async function handleDeleteKnowledgeBlock(id: string) {
        try {
            showSpinner()
            await updateKnowledgeBlock({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary">
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        id="knowledge-block"
                        headerTitleKey={({ code, name }) =>
                            `${[code, name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="knowledgeBlocks"
                        currentPage={currentPage}
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã',
                                dataIndex: 'code',
                                align: 'center',
                                width: 100,
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Tên chương',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Số lượng câu hỏi',
                                width: 200,
                                align: 'center',
                                render: (_, record) => record?.questions?.length || 0,
                            },
                            {
                                title: 'Mô tả',
                                width: 200,
                                align: 'center',
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return (
                                        <Tooltip title={value}>
                                            <div className="line-clamp-2">{value}</div>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutKnowledgeBlock({
                                                            id: record.id,
                                                            subjectVersionId:
                                                                record.subjectVersionId,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteKnowledgeBlock(record?.id)
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                <CreateIcon
                                    onClick={() => {
                                        onOpenPutKnowledgeBlock({
                                            id: '',
                                            subjectVersionId: id,
                                        })
                                    }}
                                    title="Thêm mới chương mục"
                                />
                            </div>
                        )}
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

KnowledgeBlock.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
