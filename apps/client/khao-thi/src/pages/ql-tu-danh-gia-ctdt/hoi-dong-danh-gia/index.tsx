import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutEvaluationCouncil } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountEvaluationCouncil,
    useFindManyEvaluationCouncil,
    useUpdateEvaluationCouncil,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncil() {
    const router = useRouter()
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

    const { data, refetch } = useFindManyEvaluationCouncil({
        include: {
            period: true,
            members: true,
            evaluationCriterion: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountEvaluationCouncil({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutEvaluationCouncil } = useDisclosure<string>({
        tag: PutEvaluationCouncil.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateEvaluationCouncil } = useUpdateEvaluationCouncil()
    async function handleDeleteEvaluationCouncil(id: string) {
        try {
            showSpinner()
            await updateEvaluationCouncil({
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
                                        onOpenPutEvaluationCouncil()
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
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên hội đồng',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                                fixed: 'left',
                            },
                            {
                                title: 'Đợt đánh giá CTDT',
                                dataIndex: 'period',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.period?.name || ''
                                },
                            },
                            {
                                title: 'Số thành viên trong HĐ',
                                dataIndex: 'members',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.members?.length || ''
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
                                                <Tooltip title={'Xem chi tiết'} placement="top">
                                                    <EyeOutlined
                                                        style={{ fontSize: '16px' }}
                                                        onClick={() => {
                                                            router.push(
                                                                `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA}/${record?.id}`
                                                            )
                                                        }}
                                                    />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutEvaluationCouncil(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteEvaluationCouncil(
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

EvaluationCouncil.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
