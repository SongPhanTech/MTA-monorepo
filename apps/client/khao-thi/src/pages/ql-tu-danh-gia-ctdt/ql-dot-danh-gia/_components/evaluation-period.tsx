import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, EVALUATION_PERIOD_STATUS_LABELS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import {
    useCountEvaluationPeriod,
    useFindManyEvaluationPeriod,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { type Key, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import ExportReport from './export-report'
import { useSchoolYearStore } from '@components/selecter-school-year'

export default function EvaluationPeriod() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        startDate: undefined,
        endDate: undefined,
    })
    const { id: schoolYearId } = useSchoolYearStore()

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const where = useMemo(
        () => ({
            deletedAt: null,
            ...(schoolYearId ? { schoolYearId } : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.startDate?.length === 2
                ? {
                      startDate: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      endDate: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }),
        [filters.name, filters.startDate, filters.endDate, schoolYearId]
    )

    const { data, refetch } = useFindManyEvaluationPeriod({
        where,
        include: {
            council: {
                select: {
                    id: true,
                    name: true,
                    members: true,
                },
            },
            schoolYear: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count, refetch: refetchCount } = useCountEvaluationPeriod({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutEvaluationPeriod } = useDisclosure<string>({
        tag: 'PutEvaluationPeriod',
        onClose() {
            refetch()
            refetchCount()
        },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
    async function handleDeleteEvaluationPeriod(id: string) {
        try {
            showSpinner()
            await updateEvaluationPeriod({
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

    return (
        <div>
            <Row gutter={[16, 8]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        <Col span={24}>
                            <Flex justify="end" gap={8}>
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                    'THEM'
                                ) && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => {
                                            onOpenPutEvaluationPeriod()
                                        }}
                                    >
                                        <BookPlus />
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        className="h-[calc(100vh-200px)]"
                        rowSelection={{
                            type: 'radio',
                            selectedRowKeys: [selectedEvaluationPeriodId as Key],
                            onChange: (selectedRowKeys) => {
                                evaluationPeriodStore.setState({
                                    selectedEvaluationPeriodId: selectedRowKeys[0] as string,
                                })
                            },
                        }}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    evaluationPeriodStore.setState({
                                        selectedEvaluationPeriodId: record.id,
                                    })
                                },
                            }
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
                                title: 'Tên',
                                dataIndex: 'name',
                                width: 250,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => {
                                    return <div className="text-left">{record.name}</div>
                                },
                            },
                            {
                                title: 'Hội đồng đánh giá',
                                width: 250,
                                render: (_, record) => {
                                    return <div className="text-left">{record.council?.name}</div>
                                },
                            },
                            {
                                title: (
                                    <Tooltip title="Số lượng thành viên">
                                        <span>SLTV</span>
                                    </Tooltip>
                                ),
                                width: 70,
                                align: 'center',
                                render: (_, record) => {
                                    return <div>{record.council?.members?.length || 0}</div>
                                },
                            },
                            {
                                title: 'Năm học',
                                width: 180,
                                render: (_, record) => record?.schoolYear?.name,
                            },
                            {
                                title: 'Ngày bắt đầu',
                                dataIndex: 'startDate',
                                width: 120,
                                type: 'date',
                                render: (_, record) =>
                                    record?.startDate
                                        ? dayjs(record?.startDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                dataIndex: 'endDate',
                                width: 120,
                                type: 'date',
                                render: (_, record) =>
                                    record?.endDate
                                        ? dayjs(record?.endDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Mô tả',
                                align: 'center',
                                width: 150,
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return <div className="line-clamp-2">{value}</div>
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                render: (_, record) => {
                                    const statusInfo =
                                        EVALUATION_PERIOD_STATUS_LABELS[record.status]
                                    return (
                                        <Tag color={statusInfo?.color || 'default'}>
                                            {statusInfo?.label || record.status}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                width: 100,
                                fixed: 'right',
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                    'SUA',
                                    'XOA',
                                    'XEM_CHI_TIET'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center items-center gap-2">
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                    'XUAT_EXCEL'
                                                ) && <ExportReport id={record?.id} />}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onOpenPutEvaluationPeriod(record?.id)
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDeleteEvaluationPeriod(
                                                                    record?.id
                                                                )
                                                                e?.stopPropagation()
                                                            },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                )}
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

EvaluationPeriod.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
