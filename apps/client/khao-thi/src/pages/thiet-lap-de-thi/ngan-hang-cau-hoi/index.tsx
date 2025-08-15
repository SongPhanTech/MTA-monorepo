import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutQuestionBank } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountQuestionBank,
    useFindManyQuestionBank,
    useFindManySubjectVersion,
    useUpdateQuestionBank,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function QuestionBank() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        subjectVersionId: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.subjectVersionId
                ? {
                      subjectVersionId: {
                          in: filters.subjectVersionId,
                      },
                  }
                : {}),
        }),
        [filters.code, filters.name, filters.subjectVersionId]
    )

    const { data = [], refetch } = useFindManyQuestionBank({
        where,
        include: { subjectVersion: true },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountQuestionBank({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutQuestionBank } = useDisclosure<string>({
        tag: PutQuestionBank.name,
    })

    const handleModal = () => {
        onOpenPutQuestionBank()
    }

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateQuestionBank } = useUpdateQuestionBank()
    async function handleDeleteQuestionBank(id: string) {
        try {
            showSpinner()
            await updateQuestionBank({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: subjectVersionData = [] } = useFindManySubjectVersion({
        orderBy: { name: 'asc' },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end" gap={4}>
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        onRowClick={({ id }) => {
                            router.push(
                                `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI}/${id}`
                            )
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã ngân hàng câu hỏi',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Tên ngân hàng câu hỏi',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                            },
                            {
                                title: 'Phiên bản môn học',
                                dataIndex: 'subjectVersionId',
                                width: 200,
                                align: 'center',
                                type: 'select',
                                options: subjectVersionData.map((i) => {
                                    const name = i.name || ''
                                    const period = i.period ? ` (${i.period} tiết)` : ''
                                    const credit = i.credit ? `, ${i.credit} tín chỉ` : ''
                                    return {
                                        value: i.id,
                                        label: `${name}${period}${credit}`,
                                    }
                                }),
                                render: (_, record) => {
                                    return (
                                        `${record?.subjectVersion?.name}(${record?.subjectVersion.period} tiết), ${record?.subjectVersion.credit} tín chỉ` ||
                                        ''
                                    )
                                },
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
                                                <Tooltip title="Danh sách câu hỏi" placement="top">
                                                    <EyeOutlined className="text-sm cursor-pointer" />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutQuestionBank(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteQuestionBank(record?.id)
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => {
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

QuestionBank.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
