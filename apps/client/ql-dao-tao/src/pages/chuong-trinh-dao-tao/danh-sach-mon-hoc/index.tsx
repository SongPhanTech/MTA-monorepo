import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import { HistorySubjectVersionType } from '@components/modal/put-phien-ban-mon-hoc'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { ExamType } from '@workspace/db/client'
import {
    useCountSubject,
    useCreateSubjectVersionHistory,
    useFindManyDM_DonVi,
    useFindManySubject,
    useFindUniqueTrainingObjectType,
    useUpdateManySubjectVersion,
    useUpdateSubject,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    message,
    Popconfirm,
    Row,
    Tag,
    Tooltip,
    Typography,
} from 'antd'
import _ from 'lodash'
import { BookPlus, History, LockKeyhole, LockKeyholeOpen, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
export default function SubjectList() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [isLocked, setIsLocked] = useState(true)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        managementOrganizationId: undefined,
        examType: undefined,
        active: undefined,
        code: '',
        name: '',
        credit: undefined,
        period: undefined,
        numberOfTheory: undefined,
        numberOfPractical: undefined,
        numberOfSelfStudy: undefined,
        numberOfPractice: undefined,
        numberOfReview: undefined,
        numberOfExam: undefined,
        numberOfOther: undefined,
        isTeaching: undefined,
    })

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: selectedTrainingObjectType } = useFindUniqueTrainingObjectType(
        {
            where: { id: trainingObjectTypeId },
            select: { name: true },
        },
        {
            enabled: !!trainingObjectTypeId,
        }
    )
    const { getExamTypeLabel, options: examTypeFilters } = useExamTypeOptions()
    const { mutateAsync: updateManySubjectVersion } = useUpdateManySubjectVersion()
    async function handleToggleLock() {
        try {
            showSpinner()
            await updateManySubjectVersion({
                data: { isLocked: !isLocked },
            })

            message.success(isLocked ? 'Mở khoá thành công' : 'Khoá thành công')
            setIsLocked(!isLocked)
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
    const { data: organization = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(organization)

    const where = useMemo(() => {
        const subjectVersionFilter = {
            ...(filters.name && {
                name: { contains: filters.name, mode: 'insensitive' as const },
            }),
            ...(filters.code && {
                code: { contains: filters.code, mode: 'insensitive' as const },
            }),
            ...(filters.isTeaching !== undefined &&
                filters.isTeaching.length === 1 && {
                    subjectClass: filters.isTeaching[0]
                        ? { some: { active: true, deletedAt: null } }
                        : { none: {} },
                }),
        }

        return {
            ...(trainingObjectTypeId
                ? {
                      subjectVersion: {
                          some: { trainingObjectTypeId },
                      },
                  }
                : {}),
            ...(filters.searchText
                ? { name: { contains: filters.searchText, mode: 'insensitive' as const } }
                : {}),
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.examType
                ? {
                      subjectVersion: { some: { examType: { in: filters.examType } } },
                  }
                : {}),
            ...(filters.active?.length === 1
                ? {
                      subjectVersion: {
                          some: { active: filters.active[0] },
                      },
                  }
                : {}),
            ...(Object.keys(subjectVersionFilter).length > 0 && {
                subjectVersion: { some: subjectVersionFilter },
            }),
        }
    }, [trainingObjectTypeId, filters])

    const { data: SubjectData, refetch } = useFindManySubject({
        where,
        include: {
            _count: true,
            subjectVersion: {
                orderBy: [
                    ...emptyObjectIf([{ credit: filters.credit }], !!filters.credit),
                    ...emptyObjectIf([{ period: filters.period }], !!filters.period),
                    ...emptyObjectIf(
                        [{ numberOfTheory: filters.numberOfTheory }],
                        !!filters.numberOfTheory
                    ),
                    ...emptyObjectIf(
                        [{ numberOfPractical: filters.numberOfPractical }],
                        !!filters.numberOfPractical
                    ),
                    ...emptyObjectIf(
                        [{ numberOfSelfStudy: filters.numberOfSelfStudy }],
                        !!filters.numberOfSelfStudy
                    ),
                    ...emptyObjectIf(
                        [{ numberOfPractice: filters.numberOfPractice }],
                        !!filters.numberOfPractice
                    ),
                    ...emptyObjectIf(
                        [{ numberOfReview: filters.numberOfReview }],
                        !!filters.numberOfReview
                    ),
                    ...emptyObjectIf(
                        [{ numberOfExam: filters.numberOfExam }],
                        !!filters.numberOfExam
                    ),
                    ...emptyObjectIf(
                        [{ numberOfOther: filters.numberOfOther }],
                        !!filters.numberOfOther
                    ),
                    {
                        createdAt: 'desc',
                    },
                ],
                include: {
                    subjectClass: {
                        where: {
                            active: true,
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                        },
                    },
                },
            },
            managementOrganization: true,
        },

        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubject({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    useEffect(() => {
        if (SubjectData) {
            const hasAnyUnlockedVersion = SubjectData.some((subject) =>
                subject.subjectVersion.some((version) => version.isLocked === false)
            )

            setIsLocked(!hasAnyUnlockedVersion)
        }
    }, [SubjectData])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{ id: string; isLocked: boolean }>({
        tag: 'PutSubjectListModal',
    })
    const { onOpen: onOpenHistory } = useDisclosure<{ id: string; isLocked: boolean }>({
        tag: 'ModalViewHistoryChange',
    })

    const { onOpen: onOpenSubjectVersion } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
        isLocked?: boolean
    }>({
        tag: 'PutVersionSubjectModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const handleHistory = () => {
        onOpenHistory()
    }

    const handleModalSubjectVersion = (
        subjectId: string,
        subjectVersionId: string,
        isLocked: boolean
    ) => {
        onOpenSubjectVersion({ subjectId, subjectVersionId, isLocked })
    }

    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    const { mutateAsync: createSubjectVersionHistory } = useCreateSubjectVersionHistory()
    async function handleDelete(record: any) {
        try {
            showSpinner()
            await updateSubjectVersion({
                where: {
                    id: record.id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            const historyData = {
                subjectVersion: {
                    connect: {
                        id: record.id,
                    },
                },
                content: 'Xóa môn học',
                action: HistorySubjectVersionType.DELETE,
                updatedBy: {
                    connect: {
                        id: window?.contextData?.userId 
                    },
                },
            }
            await createSubjectVersionHistory({ data: historyData })
            message.success('Xóa thành công')
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
    const handleLogHistory = (record: any) => {
        // console.log(record)
    }

    async function handleDeleteSubject(id: string) {
        try {
            showSpinner()
            await updateSubject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
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

    const handleFilterChange = (key: string, value: string | ExamType[] | boolean) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    const pageTitle = 'Danh sách môn học'
    return (
        <div>
            <Row>
                <Col span={24} className="mb-0">
                    <Typography.Title level={4}>{pageTitle}</Typography.Title>
                </Col>
            </Row>
            <Row gutter={[8, 0]}>
                <Col span={24}>
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    searchText: e.target.value,
                                                })
                                            }
                                            className="py-0 h-8"
                                            placeholder="Tìm kiếm môn học"
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        className="mb-0"
                                        name="managementOrganizationId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <TreeSelect
                                            placeholder="Chọn đơn vị quản lý"
                                            allowClear
                                            showSearch
                                            maxTagCount={'responsive'}
                                            treeDefaultExpandAll
                                            treeData={treeData}
                                            onChange={(val) =>
                                                handleFilterChange('managementOrganizationId', val)
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleHistory} type="primary">
                                        <History />
                                        Lịch sử
                                    </Button>
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
                                    'THEM'
                                ) && (
                                    <Popconfirm
                                        placement="bottomRight"
                                        title={`Bạn có chắc muốn ${isLocked ? 'mở' : 'khoá'} chỉnh sửa môn học không?`}
                                        onConfirm={handleToggleLock}
                                        okText="Đồng ý"
                                        cancelText="Hủy"
                                    >
                                        <Button type="primary">
                                            {isLocked ? <LockKeyhole /> : <LockKeyholeOpen />}
                                            {isLocked ? 'Đã khoá' : 'Đang mở'}
                                        </Button>
                                    </Popconfirm>
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_QL_MON_HOC,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        <BookPlus />
                                        Thêm
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ name, managementOrganization }) =>
                            `${[name, managementOrganization?.sTen].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjectVersion"
                        currentPage={currentPage}
                        defaultExpandAll
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: 'code',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên phiên bản MH',
                                dataIndex: 'name',
                                width: 200,
                                type: 'input',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: 'codeTkb',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'credit',
                                width: 150,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                    'period',
                                ],
                            },
                            {
                                title: 'Số tiết',
                                dataIndex: 'period',
                                width: 150,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'LT',
                                dataIndex: 'numberOfTheory',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'period',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'BT',
                                dataIndex: 'numberOfPractical',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'period',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'ThL',
                                dataIndex: 'numberOfSelfStudy',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'period',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'TN, TH',
                                dataIndex: 'numberOfPractice',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'period',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'Ôn',
                                dataIndex: 'numberOfReview',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'period',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'KT, Thi',
                                dataIndex: 'numberOfExam',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'period',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                width: 150,
                                type: 'select',
                                align: 'center',
                                options: examTypeFilters.map((opt) => ({
                                    label: opt.label,
                                    value: opt.value,
                                })),
                                render: (value: ExamType) => getExamTypeLabel(value),
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                width: 200,
                                render: (record) => <div className="line-clamp-2">{record}</div>,
                            },
                            {
                                title: 'Đã mở LMH',
                                align: 'center',
                                dataIndex: 'isTeaching',
                                width: 120,
                                fixed: 'right',
                                type: 'select',
                                options: [
                                    { value: true, label: 'Đã đưa vào giảng dạy' },
                                    { value: false, label: 'Chưa đưa vào giảng dạy' },
                                ],
                                render: (_, record) => (record.subjectClass?.length ? '✅' : ''),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                options: [
                                    { label: 'Đang đào tạo', value: true },
                                    { label: 'Ngừng đào tạo', value: false },
                                ],
                                type: 'select',
                                render: (record) => {
                                    return !record ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                    'THEM',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    const { id: subjectVersionId, subjectId, subjectClass } = record
                                    if (isLocked) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                    'XEM'
                                                ) && (
                                                    <ViewIcon
                                                        onClick={() =>
                                                            handleModalSubjectVersion(
                                                                subjectId,
                                                                subjectVersionId,
                                                                isLocked
                                                            )
                                                        }
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                            </Row>
                                        )
                                    }

                                    return (
                                        <Row className="justify-center gap-2">
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                'SUA'
                                            ) && (
                                                <EditIcon
                                                    onClick={() => {
                                                        onOpenSubjectVersion({
                                                            subjectId,
                                                            subjectVersionId,
                                                            isLocked,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                            )}
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                'XOA'
                                            ) && (
                                                <DeleteIcon
                                                    disabled={subjectClass?.length > 0}
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(record),
                                                    }}
                                                />
                                            )}
                                        </Row>
                                    )
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
                        headerRight={(record) => {
                            if (isLocked) {
                                return (
                                    <Flex gap={8} align="center">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                            'XEM'
                                        ) && (
                                            <ViewIcon
                                                onClick={onOpen.bind(null, {
                                                    id: record.id,
                                                    isLocked,
                                                })}
                                                className="text-sm text-blue-700 cursor-pointer mr-8"
                                            />
                                        )}
                                    </Flex>
                                )
                            }

                            return (
                                <Flex gap={8} align="center">
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                        'THEM'
                                    ) && (
                                        <Tooltip
                                            title="Thêm mới phiên bản môn học"
                                            placement="bottomLeft"
                                        >
                                            <BookPlus
                                                onClick={() =>
                                                    handleModalSubjectVersion(
                                                        record.id,
                                                        '',
                                                        isLocked
                                                    )
                                                }
                                                className="cursor-pointer"
                                            />
                                        </Tooltip>
                                    )}
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                        'SUA'
                                    ) && (
                                        <EditIcon
                                            onClick={() => {
                                                onOpen({ id: record.id, isLocked })
                                                handleLogHistory(record)
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                    )}
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                        'XOA'
                                    ) && (
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => {
                                                    handleDeleteSubject(record.id)
                                                },
                                            }}
                                        />
                                    )}
                                </Flex>
                            )
                        }}
                        data={SubjectData}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
