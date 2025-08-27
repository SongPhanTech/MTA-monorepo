import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSupervisorPaymentRecord, PutUpdatePaymentStatus } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { usePaymentStatusOptions } from '@hooks/paymentStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { PaymentStatus } from '@workspace/db'
import {
    useCountSupervisorPaymentRecord,
    useDeleteSupervisorPaymentRecord,
    useFindManySupervisorPaymentRecord,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function SupervisorPaymentRecordPage() {
    const { getPaymentStatusColor, getPaymentStatusLabel, paymentStatusOptions } =
        usePaymentStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        name: undefined,
        transactionCode: undefined,
        paymentStatus: undefined,
        paymentDate: undefined,
        role: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.transactionCode
                ? {
                      transactionCode: {
                          contains: filters.transactionCode,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name
                ? { expert: { name: { contains: filters.name, mode: 'insensitive' as const } } }
                : {}),
            ...(filters.paymentStatus
                ? Array.isArray(filters.paymentStatus)
                    ? { status: { in: filters.paymentStatus } }
                    : { status: { equals: filters.paymentStatus } }
                : {}),
            ...(filters.paymentDate?.length === 2
                ? {
                      paymentDate: {
                          gte: dayjs(filters.paymentDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.paymentDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(selectedSemesterId
                ? {
                      thesisProject: {
                          subjectClass: { semesterId: selectedSemesterId },
                      },
                  }
                : {}),
        }),
        [
            filters.name,
            filters.transactionCode,
            filters.paymentStatus,
            filters.paymentDate,
            selectedSemesterId,
        ]
    )

    const { data: supervisorPaymentData } = useFindManySupervisorPaymentRecord({
        where: {
            ...where,
        },
        include: {
            thesisProject: {
                include: {
                    subjectClass: true,
                },
            },
            expert: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSupervisorPaymentRecord({
        where: {
            ...where,
        },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen: openPaymentRecord } = useDisclosure<{ paymentRecordId: string }>({
        tag: PutSupervisorPaymentRecord.name,
    })

    const { onOpen: openUpdatePaymentStatus, isOpen } = useDisclosure<{
        paymentRecordIds: string[]
        isSupervisor: boolean
    }>({
        tag: PutUpdatePaymentStatus.name,
    })

    useEffect(() => {
        if (!isOpen) {
            setSelectedRowKeys([])
        }
    }, [isOpen])

    const { mutateAsync: deletePaymentRecord } = useDeleteSupervisorPaymentRecord()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await deletePaymentRecord({
                where: {
                    id,
                },
            })
            message.success('Xóa thành công')
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
                    <Row gutter={[0, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={10}>
                                    <TreeSelectSemester
                                        style={{ width: '250px' }}
                                        filterTimeNow={true}
                                        onChange={(val) => setSelectedSemesterId(val)}
                                    />
                                </Col>
                            </Flex>
                        </Col>
                        <Col>
                            <Flex justify="end" gap={4}>
                                <Button
                                    onClick={() =>
                                        openUpdatePaymentStatus({
                                            paymentRecordIds: selectedRowKeys as string[],
                                            isSupervisor: true,
                                        })
                                    }
                                    disabled={selectedRowKeys.length === 0}
                                    type="primary"
                                >
                                    Cập nhật trạng thái
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="payment-record"
                        filters={filters}
                        setFilters={setFilters}
                        data={supervisorPaymentData}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                            getCheckboxProps: (record) => {
                                return {
                                    disabled: record.status === PaymentStatus.PAID,
                                    style:
                                        record.status === PaymentStatus.PAID
                                            ? { display: 'none' }
                                            : {},
                                }
                            },
                        }}
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
                                title: 'Tên chuyên gia',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record.expert.name,
                            },
                            {
                                title: 'Đề tài',
                                dataIndex: 'title',
                                width: 150,
                                type: 'input',
                                align: 'center',
                                render: (_, record) => record.thesisProject.title,
                            },
                            {
                                title: 'Mã giao dịch',
                                dataIndex: 'transactionCode',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số tiền thanh toán',
                                dataIndex: 'amount',
                                width: 150,
                                align: 'center',
                                render: (record) => record?.toString(),
                            },
                            {
                                title: 'Thời gian thanh toán',
                                dataIndex: 'paymentDate',
                                align: 'center',
                                width: 160,
                                type: 'date',
                                render: (_, record) =>
                                    record?.paymentDate
                                        ? dayjs(record?.paymentDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'paymentStatus',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                options: paymentStatusOptions,
                                render: (_, record) => {
                                    const label = getPaymentStatusLabel(record?.status)
                                    const color = getPaymentStatusColor(record?.status)
                                    return <Tag color={color}>{label}</Tag>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={() => {
                                                        openPaymentRecord({
                                                            paymentRecordId: id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
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

SupervisorPaymentRecordPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
