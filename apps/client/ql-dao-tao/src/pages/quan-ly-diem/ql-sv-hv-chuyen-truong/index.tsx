import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, SCORE_CONVERT_STATUS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import type { $Enums } from '@workspace/db'
import {
    useCountStudentScoreConvert,
    useFindManyStudentScoreConvert,
    useUpdateStudentScoreConvert,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row, Select, Tag } from 'antd'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type LeafStatus = keyof typeof $Enums.ScoreConvertStatus
type AggregateStatus = LeafStatus | 'PARTIAL'

function computeAggregateStatus(items: { status: LeafStatus }[]): AggregateStatus | null {
    if (!items || items.length === 0) {
        return null
    }
    const hasPending = items.some((i) => i.status === 'PENDING')
    const hasApproved = items.some((i) => i.status === 'APPROVED')
    const hasRejected = items.some((i) => i.status === 'REJECTED')
    if (hasPending) return 'PENDING'
    if (hasApproved && hasRejected) return 'PARTIAL'
    if (hasApproved) return 'APPROVED'
    return 'REJECTED'
}

export default function StudentScoreConvertPage() {
    const { can, canSome } = useAbility()
    const { onOpen } = useDisclosure<string>({
        tag: 'PutStudentScoreConvertModal',
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: updateStudentScoreConvert } = useUpdateStudentScoreConvert()
    const [filters, setFilters] = useState<{
        name?: string
        code?: string
        formStatus?: AggregateStatus
    }>({})
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const handleModal = () => {
        onOpen()
    }
    const where = useMemo(() => {
        const byName = !filters.name
            ? {}
            : {
                  student: {
                      userProfile: {
                          OR: ['firstName', 'lastName', 'fullname'].map((field) => ({
                              [field]: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          })),
                      },
                  },
              }
        const byCode = !filters.code
            ? {}
            : {
                  student: {
                      code: { contains: filters.code },
                  },
              }
        const st = filters.formStatus
        let byStatus = {}
        if (st) {
            switch (st) {
                case 'PENDING':
                    byStatus = { subjectScoreConvert: { some: { status: 'PENDING' } } }
                    break
                case 'APPROVED':
                    byStatus = {
                        AND: [
                            { subjectScoreConvert: { some: { status: 'APPROVED' } } },
                            { subjectScoreConvert: { none: { status: 'PENDING' } } },
                            { subjectScoreConvert: { none: { status: 'REJECTED' } } },
                        ],
                    }
                    break
                case 'REJECTED':
                    byStatus = {
                        AND: [
                            { subjectScoreConvert: { some: { status: 'REJECTED' } } },
                            { subjectScoreConvert: { none: { status: 'PENDING' } } },
                            { subjectScoreConvert: { none: { status: 'APPROVED' } } },
                        ],
                    }
                    break
                case 'PARTIAL':
                    byStatus = {
                        AND: [
                            { subjectScoreConvert: { some: { status: 'APPROVED' } } },
                            { subjectScoreConvert: { some: { status: 'REJECTED' } } },
                            { subjectScoreConvert: { none: { status: 'PENDING' } } },
                        ],
                    }
                    break
            }
        }
        return { deletedAt: null, ...byName, ...byCode, ...byStatus }
    }, [filters])

    const { data = [], refetch } = useFindManyStudentScoreConvert({
        where,
        include: {
            subjectScoreConvert: { select: { status: true } },
            student: { include: { userProfile: true } },
            _count: {
                select: { subjectScoreConvert: true },
            },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count = 0 } = useCountStudentScoreConvert({ where })

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateStudentScoreConvert({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa phiếu thành công')
            refetch()
        } catch (error: any) {
            message.error(error?.info?.message || 'Đã xảy ra lỗi')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Select
                                allowClear
                                placeholder="Chọn trạng thái"
                                style={{ width: 200 }}
                                options={Object.entries(SCORE_CONVERT_STATUS).map(
                                    ([value, label]) => ({
                                        label,
                                        value,
                                    })
                                )}
                                onChange={(value) => {
                                    setFilters((prev) => ({ ...prev, formStatus: value }))
                                    setCurrentPage(1)
                                }}
                            />
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        filters={{
                            name: filters.name,
                            code: filters.code,
                        }}
                        setFilters={(value) => {
                            setFilters((prev) => ({ ...prev, ...value }))
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * numberOfPages,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                type: 'input',
                                width: 150,
                                align: 'center',
                                render: (_, record) => record.student.code ?? '',
                            },
                            {
                                title: 'Sinh viên',
                                type: 'input',
                                dataIndex: 'name',
                                align: 'center',
                                render: (_, record) => {
                                    return record.student.userProfile?.fullname || ''
                                },
                            },
                            {
                                title: 'Ngày tạo',
                                align: 'center',
                                width: 150,
                                render: (_, record) =>
                                    record.createdAt ? formatDate(record.createdAt) : undefined,
                            },
                            {
                                title: 'Số môn',
                                width: 100,
                                align: 'center',
                                render: (_, record) => record._count.subjectScoreConvert,
                            },
                            {
                                title: 'Mô tả',
                                align: 'left',
                                dataIndex: 'description',
                                width: 250,
                            },
                            {
                                title: 'Trạng thái phiếu',
                                align: 'center',
                                width: 200,
                                render: (_, record) => {
                                    const status = computeAggregateStatus(
                                        record.subjectScoreConvert || []
                                    )
                                    if (!status) {
                                        return '_'
                                    }
                                    const colorMap: Record<AggregateStatus, string> = {
                                        PENDING: 'gold',
                                        APPROVED: 'green',
                                        REJECTED: 'red',
                                        PARTIAL: 'blue',
                                    }
                                    return (
                                        <Tag color={colorMap[status]}>
                                            {SCORE_CONVERT_STATUS[status]}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(id),
                                                }}
                                            />
                                        )}
                                    </Row>
                                ),
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

StudentScoreConvertPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
