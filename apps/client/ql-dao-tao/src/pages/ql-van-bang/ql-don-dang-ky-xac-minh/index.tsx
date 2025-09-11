import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useDiplomaVerificationStatusOptions } from '@hooks/diplomaVerificationStatus'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { type DiplomaVerificationApplication, DiplomaVerificationStatus } from '@workspace/db'
import {
    useCountDiplomaVerificationApplication,
    useFindManyDiplomaVerificationApplication,
    useUpdateDiplomaVerificationApplication,
} from '@workspace/db/hooks'
import { Col, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { FileSearch } from 'lucide-react'
import type { AnyObject } from 'node_modules/@casl/ability/dist/types/types'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function QLDONDANGKY() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const {
        diplomaVerificationStatusOptions,
        getDiplomaVerificationStatusLabel,
        getDiplomaVerificationStatusColor,
    } = useDiplomaVerificationStatusOptions()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        idCardNumber: undefined,
        dateOfBirth: undefined,
        phone: undefined,
        email: undefined,
        diplomaVerificationStatus: undefined,
        diplomaNumber: '',
        originalDiplomaNumber: '',
    })

    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      fullname: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.idCardNumber && filters.idCardNumber !== ''
                ? {
                      idCardNumber: {
                          contains: filters.idCardNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.phone && filters.phone !== ''
                ? {
                      phoneNumber: {
                          contains: filters.phone,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.email && filters.email !== ''
                ? {
                      email: {
                          contains: filters.email,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.dateOfBirth?.length === 2
                ? {
                      dateOfBirth: {
                          gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.diplomaVerificationStatus
                ? Array.isArray(filters.diplomaVerificationStatus)
                    ? {
                          status: {
                              in: filters.diplomaVerificationStatus,
                          },
                      }
                    : {
                          status: {
                              equals: filters.diplomaVerificationStatus,
                          },
                      }
                : {}),
            ...(filters.diplomaNumber
                ? {
                      diplomaNumber: {
                          contains: filters.diplomaNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.originalDiplomaNumber
                ? {
                      originalDiplomaNumber: {
                          contains: filters.originalDiplomaNumber,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [
            filters.name,
            filters.idCardNumber,
            filters.phone,
            filters.email,
            filters.dateOfBirth,
            filters.diplomaVerificationStatus,
            filters.originalDiplomaNumber,
            filters.diplomaNumber,
        ]
    )

    const { data = [], refetch } = useFindManyDiplomaVerificationApplication({
        where,
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountDiplomaVerificationApplication({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateDiplomaVerificationApplication } =
        useUpdateDiplomaVerificationApplication()
    const handleUpdateInProgress = async (record: DiplomaVerificationApplication) => {
        try {
            showSpinner()
            if (
                record?.status === DiplomaVerificationStatus.IN_PROGRESS ||
                record?.status === DiplomaVerificationStatus.APPROVED
            )
                return
            await updateDiplomaVerificationApplication({
                where: { id: record?.id },
                data: { status: DiplomaVerificationStatus.IN_PROGRESS },
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

    const { onOpen: onOpenModalTraCuuVanBang } = useDisclosure<{
        data: DiplomaVerificationApplication
    }>({
        tag: 'ModalTraCuuVanBang',
    })

    const { onOpen: onOpenPutStatusQLTraCuuVanBang } = useDisclosure<string>({
        tag: 'PutStatusQLTraCuuVanBang',
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
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
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (_, record) => record?.fullname,
                            },
                            {
                                title: 'Căn cước công dân',
                                dataIndex: 'idCardNumber',
                                width: 170,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'dateOfBirth',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (_, record) =>
                                    record?.dateOfBirth &&
                                    dayjs(record?.dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.phoneNumber,
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số hiệu văn bằng',
                                dataIndex: 'diplomaNumber',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số vào sổ gốc văn bằng',
                                dataIndex: 'originalDiplomaNumber',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Chuyên ngành đào tạo',
                                dataIndex: 'trainingMajor',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Bậc đào đạo',
                                dataIndex: 'trainingLevel',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Hình thức đào tạo',
                                dataIndex: 'trainingForm',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Xếp loại tốt nghiệp',
                                dataIndex: 'classification',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Năm khóa học bắt đầu',
                                dataIndex: 'trainingCourseStartYear',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Năm khóa học kết thúc',
                                dataIndex: 'trainingCourseEndYear',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Ngày cấp bằng',
                                dataIndex: 'diplomaIssueDate',
                                width: 150,
                                align: 'center',
                                render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
                            },
                            {
                                title: 'Lý do nộp đơn',
                                dataIndex: 'reason',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'diplomaVerificationStatus',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                type: 'select',
                                options: diplomaVerificationStatusOptions,
                                render: (__, record) => {
                                    return (
                                        <Tag
                                            color={getDiplomaVerificationStatusColor(
                                                record?.status
                                            )}
                                        >
                                            {getDiplomaVerificationStatusLabel(record?.status)}
                                        </Tag>
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
                                        const rec = record as Exclude<typeof record, AnyObject>
                                        return (
                                            <Row className="justify-center gap-2">
                                                <Tooltip title={'Tra cứu'} placement="top">
                                                    <FileSearch
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleUpdateInProgress(rec)
                                                            onOpenModalTraCuuVanBang({
                                                                data: rec,
                                                            })
                                                        }}
                                                        size={16}
                                                        strokeWidth={1.5}
                                                    />
                                                </Tooltip>
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutStatusQLTraCuuVanBang(record.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
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

QLDONDANGKY.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
