import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
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
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import ExportReport from './export-report'
import { useSchoolYearStore } from '@components/selecter-school-year'
import type { Prisma } from '@workspace/db/client'
import { cn } from '@lib/utils'
import type { UploadedFileItem } from '@components/commons/documentPaths'
import { getMinioUrl } from '@workspace/libs/utils'

export type EvaluationPeriodType = Prisma.EvaluationPeriodGetPayload<{
    include: {
        council: {
            select: {
                id: true
                name: true
                members: true
            }
        }
        schoolYear: {
            select: {
                name: true
            }
        }
        documentFiles: {
            select: {
                id: true
                name: true
                path: true
                size: true
            }
        }
        _count: {
            select: {
                documentFiles: true
            }
        }
    }
}>

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
            documentFiles: {
                select: {
                    id: true,
                    name: true,
                    path: true,
                    size: true,
                },
            },
            _count: {
                select: {
                    documentFiles: true,
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
        },
    })

    const { onOpen: onOpenPutEvaluationPeriod } = useDisclosure<string>({
        tag: 'PutEvaluationPeriod',
        onClose() {
            refetch()
            refetchCount()
        },
    })

    const { onOpen: onOpenPreview } = useDisclosure<{
        uri: string
        name?: string
        mimeType?: string
    }>({
        tag: 'XemTaiLieu',
    })

    const handlePreviewFile = async (file: UploadedFileItem) => {
        try {
            return onOpenPreview({
                uri: getMinioUrl(file.path),
                name: file.name,
                mimeType: file.name.split('.').pop() || file.mimeType,
            })
        } catch (error) {
            console.error('Error opening file:', error)
            message.error('Không thể mở file')
        }
    }

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
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    evaluationPeriodStore.setState({
                                        selectedEvaluationPeriodId: record.id,
                                    })
                                },
                                className: cn(
                                    selectedEvaluationPeriodId === record.id
                                        ? '!bg-orange-200 hover:!bg-orange-200 [&>td]:!bg-orange-200 [&>td]:hover:!bg-orange-200'
                                        : ''
                                ),
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
                                title: 'Tài liệu hội đồng',
                                align: 'center',
                                width: 120,
                                render: (_, record) => record?._count?.documentFiles || 0,
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
                        expandable={{
                            expandedRowRender: (record) => (
                                <div className="p-4 bg-gray-50">
                                    <p className="mb-4 font-semibold">Tài liệu hội đồng:</p>
                                    {record.documentFiles && record.documentFiles.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {record.documentFiles.map(
                                                (file: {
                                                    id: string
                                                    name: string
                                                    path: string
                                                }) => (
                                                    <div
                                                        key={file.id}
                                                        className="border rounded-lg p-2 bg-white shadow-sm"
                                                    >
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <div className="text-4xl">
                                                                {file.name.endsWith('.pdf') ? (
                                                                    <span className="text-red-500">
                                                                        📄
                                                                    </span>
                                                                ) : file.name.endsWith('.xlsx') ||
                                                                  file.name.endsWith('.xls') ? (
                                                                    <span className="text-green-500">
                                                                        📊
                                                                    </span>
                                                                ) : (
                                                                    <span>📁</span>
                                                                )}
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-medium truncate max-w-[200px]">
                                                                    {file.name}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2 mt-2">
                                                                <Button
                                                                    size="small"
                                                                    icon={<span>👁️</span>}
                                                                    onClick={() => {
                                                                        window.open(
                                                                            file.path,
                                                                            '_blank'
                                                                        )
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="small"
                                                                    icon={<span>⬇️</span>}
                                                                    onClick={() => {
                                                                        const link =
                                                                            document.createElement(
                                                                                'a'
                                                                            )
                                                                        link.href = file.path
                                                                        link.download = file.name
                                                                        link.click()
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Không có mô tả</p>
                                    )}
                                </div>
                            ),
                            expandIcon: ({ expanded, onExpand, record }) =>
                                expanded ? (
                                    <span
                                        onClick={(e) => onExpand(record as EvaluationPeriodType, e)}
                                    >
                                        <ChevronDown />
                                    </span>
                                ) : (
                                    <span
                                        onClick={(e) => onExpand(record as EvaluationPeriodType, e)}
                                    >
                                        <ChevronUp />
                                    </span>
                                ),
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
