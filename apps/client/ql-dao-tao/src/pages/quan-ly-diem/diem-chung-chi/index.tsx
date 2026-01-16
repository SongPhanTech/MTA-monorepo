import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { FixedClass, TrainingCourse } from '@workspace/db/client'
import {
    useCountStudent,
    useFindManyCertificate,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { useCertificateScore } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Select, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Modal, message, Row, Tooltip } from 'antd'
import _ from 'lodash'
import { InfoIcon } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ArchivedCertificate() {
    const { can } = useAbility()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        count: undefined,
        trainingCourseId: undefined,
        fixedClassId: undefined,
        certificateId: undefined,
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
        {
            where: {
                trainingObjectTypeId,
                deletedAt: null,
                active: true,
            },
            orderBy: { name: 'asc' },
        },
        { enabled: !!trainingObjectTypeId }
    )

    const { data: fixedClassData = [] } = useFindManyFixedClass(
        {
            where: {
                trainingCourse: {
                    trainingObjectTypeId,
                    deletedAt: null,
                    active: true,
                    ...(filters.trainingCourseId ? { id: filters.trainingCourseId } : {}),
                },
            },
            include: {
                trainingCourse: true,
            },
        },
        { enabled: !!trainingObjectTypeId }
    )

    const { data: trainingFieldData = [] } = useFindManyTrainingField()

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: TrainingCurriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { data: certificatesData = [] } = useFindManyCertificate({
        orderBy: { name: 'asc' },
    })

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutCertificateArchivedModal',
    })

    const { onOpen: onOpenCertificateList } = useDisclosure<{
        studentId: string
        studentName: string
        certificates: any[]
    }>({
        tag: 'ModalDanhSachChungChi',
    })

    const { onOpen: onOpenConvertCertificate } = useDisclosure<{
        studentIds: string[]
        studentNames: string[]
    }>({
        tag: 'ModalChuyenDoiChungChiThanhDiem',
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateArchivedCertificate({
                where: {
                    id,
                },
                data: {
                    status: 'CANCEL',
                },
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

    const where = useMemo(() => {
        const conditions: any = {}

        if (filters.name) {
            conditions.fullname = {
                contains: filters.name,
                mode: 'insensitive' as const,
            }
        }

        if (filters.fixedClassId) {
            conditions.fixedClassId = filters.fixedClassId
        } else if (filters.trainingCourseId) {
            conditions.fixedClass = {
                trainingCourseId: filters.trainingCourseId,
            }
        } else {
            // Mặc định lọc theo trainingObjectTypeId nếu không có filter khác
            conditions.fixedClass = {
                trainingCourse: {
                    trainingObjectTypeId,
                },
            }
        }

        if (filters.certificateId) {
            conditions.archivedCertificate = {
                some: {
                    certificateId: filters.certificateId,
                    deletedAt: null,
                },
            }
        }

        return conditions
    }, [filters, trainingObjectTypeId])

    // Lấy danh sách học viên có chứng chỉ
    const { data: dataTable = [], refetch } = useFindManyStudent({
        where,
        include: {
            userProfile: {
                include: { rank: true },
            },
            fixedClass: {
                include: {
                    trainingCourse: {
                        include: {
                            trainingObjectType: true,
                        },
                    },
                    curriculumVersion: {
                        include: {
                            curriculum: {
                                include: {
                                    trainingMajor: {
                                        include: {
                                            trainingField: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: {
                                include: {
                                    trainingField: true,
                                },
                            },
                        },
                    },
                },
            },
            curriculumVersionParallel: true,
            archivedCertificate: {
                where: {
                    deletedAt: null,
                },
                include: {
                    certificate: true,
                    studentSubjectScore: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
        orderBy: [{ userProfile: { firstName: 'asc' } }, { userProfile: { lastName: 'asc' } }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountStudent({
        where,
    })

    const rowSelection = {
        selectedRowKeys,
        getCheckboxProps: (record: any) => ({
            // Cho phép chọn tất cả học viên có chứng chỉ
            disabled: !record.archivedCertificate || record.archivedCertificate.length === 0,
        }),
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }

    const handleOpenAprove = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn phê duyệt những giải thường được chọn không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleAprove('APPROVED')
            },
        })
    }
    const handleOpenReject = () => {
        Modal.confirm({
            title: 'Xác nhận',
            content: 'Bạn có chắc chắn muốn từ chối những giải thường được chọn không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                handleAprove('REJECTED')
            },
        })
    }
    const { mutateAsync: updateCertificateScore } = useCertificateScore()
    const handleAprove = async (status: string) => {
        try {
            if (selectedRowKeys?.length > 0) {
                // Lấy tất cả các chứng chỉ PENDING từ các học viên được chọn
                const certificateIds: string[] = []
                selectedRowKeys.forEach((studentId) => {
                    const student = dataTable.find((s: any) => s.id === studentId)
                    if (student?.archivedCertificate) {
                        student.archivedCertificate.forEach((cert: any) => {
                            if (cert.status === 'PENDING') {
                                certificateIds.push(cert.id)
                            }
                        })
                    }
                })

                if (certificateIds.length === 0) {
                    message.warning('Không có chứng chỉ nào cần phê duyệt')
                    return
                }

                const res = await updateCertificateScore({
                    data: { archivedCertificateIds: certificateIds },
                })
                if (res?.status === 200) {
                    message.success('Phê duyệt thành công')
                    refetch()
                    setSelectedRowKeys([])
                    return
                }
            }
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
    }

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={16}>
                        <Flex gap={8}>
                            <Select
                                className="w-full"
                                placeholder="Chọn khóa học"
                                options={trainingCourseData.map((i: TrainingCourse) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                                onChange={(val) =>
                                    setFilters({
                                        ...filters,
                                        trainingCourseId: val,
                                    })
                                }
                                value={filters.trainingCourseId}
                                allowClear
                            />
                            <Select
                                className="w-full"
                                placeholder="Chọn lớp quản lý"
                                options={fixedClassData.map((i: FixedClass) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                                onChange={(val) =>
                                    setFilters({
                                        ...filters,
                                        fixedClassId: val,
                                    })
                                }
                                value={filters.fixedClassId}
                                allowClear
                            />
                            <Select
                                className="w-full"
                                placeholder="Chọn chứng chỉ"
                                options={certificatesData.map((i: any) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                                onChange={(val) =>
                                    setFilters({
                                        ...filters,
                                        certificateId: val,
                                    })
                                }
                                value={filters.certificateId}
                                allowClear
                            />
                        </Flex>
                    </Col>
                    <Col span={8}>
                        <Flex justify="end">
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                'THEM'
                            ) && (
                                <>
                                    <Button
                                        onClick={handleOpenReject}
                                        disabled={!selectedRowKeys.length}
                                        type="default"
                                    >
                                        Từ chối
                                    </Button>
                                    <Button
                                        className="ml-3"
                                        onClick={handleOpenAprove}
                                        disabled={!selectedRowKeys.length}
                                        type="primary"
                                    >
                                        Phê duyệt
                                    </Button>
                                    <Button
                                        className="ml-3"
                                        onClick={() => {
                                            if (selectedRowKeys.length === 0) {
                                                message.warning(
                                                    'Vui lòng chọn ít nhất một học viên'
                                                )
                                                return
                                            }
                                            const studentNames = dataTable
                                                .filter((s: any) => selectedRowKeys.includes(s.id))
                                                .map((s: any) =>
                                                    `${s?.userProfile?.lastName || ''} ${s?.userProfile?.firstName || ''}`.trim()
                                                )
                                            onOpenConvertCertificate({
                                                studentIds: selectedRowKeys as string[],
                                                studentNames,
                                            })
                                        }}
                                        disabled={!selectedRowKeys.length}
                                        type="default"
                                    >
                                        Chuyển đổi CC → Điểm
                                    </Button>
                                </>
                            )}
                            {can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                                'THEM'
                            ) && (
                                <Button onClick={handleModal} type="primary" className="ml-3">
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
                    id="training-category"
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    rowSelection={rowSelection}
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
                            title: 'Mã học viên',
                            dataIndex: ['userProfile', 'code'],
                            align: 'center',
                            width: 130,
                            fixed: 'left',
                            type: 'input',
                        },
                        {
                            title: 'Họ và tên',
                            dataIndex: 'name',
                            align: 'center',
                            width: 180,
                            fixed: 'left',
                            type: 'input',
                            render: (__, record) => {
                                return `${record?.userProfile?.lastName || ''} ${record?.userProfile?.firstName || ''}`.trim()
                            },
                        },
                        {
                            title: 'SĐT',
                            align: 'center',
                            width: 120,
                            dataIndex: 'phone',
                            type: 'input',
                            render: (__, record) =>
                                record.userProfile?.phoneNumber
                                    ? record.userProfile?.phoneNumber
                                    : '',
                        },
                        {
                            title: 'Lớp',
                            align: 'center',
                            width: 120,
                            dataIndex: 'fixedClassId',
                            type: 'select',
                            options: fixedClassData.map((item: FixedClass) => ({
                                label: item.name,
                                value: item.id,
                            })),
                            render: (__, record) => {
                                if (!record.fixedClass) return '-'
                                return (
                                    <Tooltip title={record.fixedClass?.name}>
                                        {record.fixedClass?.code}
                                    </Tooltip>
                                )
                            },
                        },
                        {
                            title: 'Khóa',
                            align: 'center',
                            width: 100,
                            dataIndex: 'trainingCourseId',
                            type: 'select',
                            options: trainingCourseData.map((item: TrainingCourse) => ({
                                label: item.name,
                                value: item.id,
                            })),
                            render: (__, record) => {
                                const trainingCourse = record?.fixedClass?.trainingCourse
                                return trainingCourse ? trainingCourse?.name : '-'
                            },
                        },
                        {
                            title: 'Ngành',
                            align: 'center',
                            width: 160,
                            dataIndex: 'trainingFieldId',
                            type: 'select',
                            options: trainingFieldData.map((item: any) => ({
                                label: item.name,
                                value: item.id,
                            })),
                            render: (__, record) => {
                                return (
                                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                        ?.trainingField?.name || '-'
                                )
                            },
                        },
                        {
                            title: 'Chuyên ngành',
                            align: 'center',
                            width: 180,
                            dataIndex: 'trainingMajorId',
                            type: 'select',
                            options: trainingMajorData.map((item: any) => ({
                                label: item.name,
                                value: item.id,
                            })),
                            render: (__, record) => {
                                return (
                                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                        ?.name || '-'
                                )
                            },
                        },
                        {
                            title: 'Tổng CC',
                            dataIndex: 'certificateCount',
                            align: 'center',
                            width: 90,
                            render: (__, record) => {
                                return record?.archivedCertificate?.length || 0
                            },
                        },
                        {
                            title: 'CC đã duyệt',
                            dataIndex: 'approvedCount',
                            align: 'center',
                            width: 110,
                            render: (__, record) => {
                                return (
                                    record?.archivedCertificate?.filter(
                                        (cert: any) => cert.status === 'APPROVED'
                                    )?.length || 0
                                )
                            },
                        },
                        {
                            title: 'CC chờ duyệt',
                            dataIndex: 'pendingCount',
                            align: 'center',
                            width: 110,
                            render: (__, record) => {
                                return (
                                    record?.archivedCertificate?.filter(
                                        (cert: any) => cert.status === 'PENDING'
                                    )?.length || 0
                                )
                            },
                        },
                        {
                            title: 'CC bị từ chối',
                            dataIndex: 'rejectedCount',
                            align: 'center',
                            width: 120,
                            render: (__, record) => {
                                return (
                                    record?.archivedCertificate?.filter(
                                        (cert: any) => cert.status === 'REJECTED'
                                    )?.length || 0
                                )
                            },
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                                const studentName =
                                    `${record?.userProfile?.lastName || ''} ${record?.userProfile?.firstName || ''}`.trim()
                                return (
                                    <Row className="justify-center gap-2">
                                        <InfoIcon
                                            onClick={() => {
                                                onOpenCertificateList({
                                                    studentId: record.id,
                                                    studentName,
                                                    certificates: record?.archivedCertificate || [],
                                                })
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                    </Row>
                                )
                            },
                        },
                    ]}
                    data={dataTable}
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
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
            </Col>
        </Row>
    )
}

ArchivedCertificate.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
