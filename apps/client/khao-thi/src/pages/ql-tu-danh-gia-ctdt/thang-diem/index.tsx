import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountScoreScaleCatalog,
    useFindManyScoreScaleCatalog,
    useUpdateScoreScaleCatalog,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ScoreScaleCatalog() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [filters.name]
    )

    const { data, refetch } = useFindManyScoreScaleCatalog({
        where,
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountScoreScaleCatalog({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutScoreScaleCatalog } = useDisclosure<string>({
        tag: 'PutScoreScaleCatalog',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateScoreScaleCatalog } = useUpdateScoreScaleCatalog()
    async function handleDeleteScoreScaleCatalog(id: string) {
        try {
            showSpinner()
            await updateScoreScaleCatalog({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Thêm mới */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        onOpenPutScoreScaleCatalog()
                                    }}
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
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 30,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Điểm thấp nhất',
                                dataIndex: 'minValue',
                                width: 100,
                            },
                            {
                                title: 'Điểm cao nhất',
                                dataIndex: 'maxValue',
                                width: 100,
                            },
                            {
                                title: 'Điểm đạt',
                                dataIndex: 'passFrom',
                                width: 100,
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
                                                        onOpenPutScoreScaleCatalog(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteScoreScaleCatalog(
                                                                record?.id
                                                            )
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

ScoreScaleCatalog.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
