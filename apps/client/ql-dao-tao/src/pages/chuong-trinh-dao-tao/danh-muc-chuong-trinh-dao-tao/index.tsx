import { HighlightOutlined } from '@ant-design/icons'
import TableCollapse from '@components/commons/tableCollapse'
import CopyPlusIcon from '@components/icons/copyPlus'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import LockPlusIcon from '@components/icons/lockPlus'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useCloneCurriculumVersion } from '@hooks/copyCurriculumVersion'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type {
    CurriculumVersion,
    DocumentFile,
    FixedClass,
    TrainingBlockOnCurriculumVersion,
    TrainingCourse,
    TrainingMajor,
    TrainingObjectType,
    TrainingTime,
} from '@workspace/db/client'
import {
    useCountCurriculum,
    useFindManyCurriculum,
    useFindManyDM_DonVi,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
    useFindManyTrainingTime,
    useUpdateCurriculum,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Input, message, Row, Select, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, Download, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
import { env } from '@/env'
export default function TrainingProgramCatalog() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypes: undefined,
        trainingCourses: undefined,
        code: '',
        name: '',
        numberOfSemesters: undefined,
        requiredCredits: undefined,
        electiveCredits: undefined,
        trainingTime: undefined,
        trainingMajorId: undefined,
        managementOrganizationId: undefined,
    })

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const where = useMemo(() => {
        const curriculumVersionFilter = {
            ...(filters.name && {
                name: { contains: filters.name, mode: 'insensitive' as const },
            }),
            ...(filters.code && {
                code: { contains: filters.code, mode: 'insensitive' as const },
            }),
            ...(filters.trainingCourses && {
                fixedClasses: {
                    some: { trainingCourseId: { in: filters.trainingCourses } },
                },
            }),
            ...(filters.trainingTime && {
                trainingTimeId: { in: filters.trainingTime },
            }),
        }

        return {
            trainingObjectTypeId,
            ...(filters.managementOrganizationId && {
                managementOrganizationId: filters.managementOrganizationId,
            }),
            ...(filters.trainingMajorId && {
                trainingMajorId: filters.trainingMajorId,
            }),
            ...(filters.searchText && {
                OR: [
                    {
                        code: {
                            contains: filters.searchText,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        name: {
                            contains: filters.searchText,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }),
            ...(Object.keys(curriculumVersionFilter).length > 0 && {
                curriculumVersion: { some: curriculumVersionFilter },
            }),
        }
    }, [
        trainingObjectTypeId,
        filters.searchText,
        filters.name,
        filters.trainingTime,
        filters.trainingCourses,
        filters.code,
        filters.managementOrganizationId,
        filters.trainingMajorId,
    ])

    const { data = [] } = useFindManyCurriculum({
        where,
        include: {
            curriculumVersion: {
                where: {
                    ...(filters.name
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    ...(filters.code
                        ? {
                              code: {
                                  contains: filters.code,
                                  mode: 'insensitive',
                              },
                          }
                        : {}),
                    trainingObjectTypeId,
                    ...(filters.trainingCourses
                        ? {
                              fixedClasses: {
                                  some: {
                                      trainingCourseId: {
                                          in: filters.trainingCourses,
                                      },
                                  },
                              },
                          }
                        : {}),
                    ...(filters.trainingTime
                        ? {
                              trainingTimeId: {
                                  in: filters.trainingTime,
                              },
                          }
                        : {}),
                },
                include: {
                    trainingTime: true,
                    trainingBlocks: {
                        include: {
                            subjects: {
                                include: {
                                    subject: true,
                                },
                            },
                        },
                    },
                    trainingObjectType: true,
                    documentFiles: true,
                    fixedClasses: {
                        include: {
                            trainingCourse: true,
                        },
                    },
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                numberOfSemesters: filters.numberOfSemesters,
                            },
                        ],
                        !!filters.numberOfSemesters
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                requiredCredits: filters.requiredCredits,
                            },
                        ],
                        !!filters.requiredCredits
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                electiveCredits: filters.electiveCredits,
                            },
                        ],
                        !!filters.electiveCredits
                    ),
                    {
                        name: 'asc',
                    },
                ],
            },
            managementOrganization: true,
            trainingMajor: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountCurriculum({ where: { ...where, deletedAt: null } })
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
        },
    })

    const { data: trainingTimeData = [] } = useFindManyTrainingTime({
        orderBy: { name: 'asc' },
    })

    const { data: organization = [] } = useFindManyDM_DonVi({
        orderBy: { sTen: 'asc' },
    })
    const treeData = buildOrgTree(organization)

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
        where: {
            ...(trainingObjectTypeId
                ? { trainingObjectTypes: { some: { trainingObjectTypeId } } }
                : {}),
        },
    })

    const { onOpen: onOpenCurriculum } = useDisclosure<string>({
        tag: 'PutCurriculum',
    })

    const { onOpen: onOpenCurriculumVersion } = useDisclosure<{
        curriculumId: string
        versionId: string
    }>({
        tag: 'PutCurriculumVersion',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpenCurriculum()
    }
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function handleDeleteCurriculum(id: string) {
        try {
            showSpinner()
            await updateCurriculum({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
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

    const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()
    async function handleDeleteCurriculumVersion(id: string) {
        try {
            showSpinner()
            await updateCurriculumVersion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
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

    const handleToggleLock = async (id: string, isLocked: boolean) => {
        try {
            showSpinner()
            await updateCurriculumVersion({
                where: {
                    id,
                },
                data: {
                    isLock: !isLocked,
                },
            })
            message.success(isLocked ? 'Mở khoá thành công' : 'Khoá thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleRowClick = (record: { id?: string }) => {
        if (
            record?.id &&
            can(
                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                'XEM_CHI_TIET'
            )
        ) {
            router.push(
                `${
                    ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO
                }/${record.id}`
            )
        }
    }

    const { handleCloneCurriculumVersion } = useCloneCurriculumVersion()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={18}>
                            <Flex>
                                <Col span={6}>
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                searchText: e.target.value,
                                            })
                                        }
                                        className="py-0"
                                        placeholder="Tìm kiếm chương trình đào tạo"
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
                                </Col>
                                <Col span={8}>
                                    <TreeSelect
                                        placeholder="Chọn đơn vị quản lý"
                                        allowClear
                                        showSearch
                                        treeDefaultExpandAll
                                        onChange={(val) =>
                                            setFilters({
                                                ...filters,
                                                managementOrganizationId: val,
                                            })
                                        }
                                        treeData={treeData}
                                        maxTagCount={'responsive'}
                                        className="w-full"
                                    />
                                </Col>
                                <Col span={6}>
                                    <Select
                                        className="w-full"
                                        placeholder="Chọn chuyên ngành đào tạo"
                                        options={trainingMajorData.map((i: TrainingMajor) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                        onChange={(val) =>
                                            setFilters({
                                                ...filters,
                                                trainingMajorId: val,
                                            })
                                        }
                                        allowClear
                                    />
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" className="gap-2">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'THEM'
                                ) && (
                                    <>
                                        <Button
                                            href={`${env.NEXT_PUBLIC_BASE_PATH}/templates/Mẫu nhập CTĐT.xlsx`}
                                            type="primary"
                                        >
                                            <Download />
                                            Mẫu nhập CTĐT
                                        </Button>
                                        <Button onClick={handleModal} type="primary">
                                            <BookPlus />
                                            Thêm chương trình
                                        </Button>
                                    </>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        id="version-category"
                        headerTitleKey={({ code, name, managementOrganization, trainingMajor }) => {
                            const displayText = [
                                code,
                                name,
                                managementOrganization?.sTen,
                                trainingMajor?.name,
                            ]
                                .filter(Boolean)
                                .join(' - ')

                            const tooltipContent = (
                                <div>
                                    {code && (
                                        <div>
                                            <strong>Code:</strong> {code}
                                        </div>
                                    )}
                                    {name && (
                                        <div>
                                            <strong>Name:</strong> {name}
                                        </div>
                                    )}
                                    {managementOrganization?.sTen && (
                                        <div>
                                            <strong>Đơn vị quản lý:</strong>{' '}
                                            {managementOrganization.sTen}
                                        </div>
                                    )}
                                    {trainingMajor?.name && (
                                        <div>
                                            <strong>Chuyên ngành đào tạo:</strong>{' '}
                                            {trainingMajor.name}
                                        </div>
                                    )}
                                </div>
                            )

                            return (
                                <Tooltip title={tooltipContent} placement="top">
                                    <span className="truncate inline-block align-middle">
                                        {displayText}
                                    </span>
                                </Tooltip>
                            )
                        }}
                        childrenFieldName="curriculumVersion"
                        currentPage={currentPage}
                        defaultExpandAll
                        onRowClick={(record) => handleRowClick(record)}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'Mã CTĐT',
                                dataIndex: 'code',
                                align: 'center',
                                fixed: 'left',
                                width: 120,
                                type: 'input',
                            },
                            {
                                title: 'Tên CTĐT toàn khoá',
                                dataIndex: 'name',
                                align: 'center',
                                fixed: 'left',
                                width: 250,
                                type: 'input',
                            },
                            {
                                title: 'ĐTĐT',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 150,
                                // type: 'select',
                                // options: trainingObjectTypeData.map((i: TrainingObjectType) => ({
                                //     value: i.id,
                                //     label: i.name,
                                // })),
                                render: (
                                    __,
                                    record: { trainingObjectType?: TrainingObjectType }
                                ) => {
                                    return record.trainingObjectType
                                        ? record.trainingObjectType.name
                                        : ''
                                },
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourses',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingCourseData.map((i: TrainingCourse) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (
                                    __,
                                    record: {
                                        fixedClasses?: (FixedClass & {
                                            trainingCourse: TrainingCourse
                                        })[]
                                    }
                                ) => {
                                    const map = new Map(
                                        record?.fixedClasses?.map(({ trainingCourse }) => [
                                            trainingCourse.id,
                                            trainingCourse.name,
                                        ])
                                    )
                                    return Array.from(map.values()).join(', ')
                                },
                            },
                            {
                                title: 'Tổng tín chỉ',
                                align: 'center',
                                width: 120,
                                render: ({ trainingBlocks = [] }) => {
                                    const totalCredit = trainingBlocks.reduce(
                                        (
                                            total: number,
                                            block: {
                                                subjects?: {
                                                    subject: { credit?: number }
                                                }[]
                                            }
                                        ) => {
                                            const blockCredit =
                                                block?.subjects?.reduce(
                                                    (
                                                        sum: number,
                                                        {
                                                            subject,
                                                        }: {
                                                            subject: {
                                                                credit?: number
                                                            }
                                                        }
                                                    ) => sum + (subject?.credit || 0),
                                                    0
                                                ) || 0
                                            return total + blockCredit
                                        },
                                        0
                                    )

                                    return totalCredit
                                },
                            },
                            {
                                title: 'Số TCBB',
                                dataIndex: 'requiredCredits',
                                align: 'center',
                                type: 'order',
                                distinctFilters: ['electiveCredits', 'numberOfSemesters'],
                                width: 100,
                            },
                            {
                                title: 'Số TCTC',
                                dataIndex: 'electiveCredits',
                                align: 'center',
                                type: 'order',
                                width: 100,
                                distinctFilters: ['numberOfSemesters', 'requiredCredits'],
                            },
                            {
                                title: 'Số kỳ học',
                                dataIndex: 'numberOfSemesters',
                                align: 'center',
                                type: 'order',
                                distinctFilters: ['electiveCredits', 'requiredCredits'],
                                width: 120,
                            },
                            {
                                title: 'Thời gian đào tạo',
                                dataIndex: 'trainingTime',
                                align: 'center',
                                width: 170,
                                type: 'select',
                                options: trainingTimeData.map((i: TrainingTime) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (value: TrainingTime) => (value?.name ? value.name : ''),
                            },
                            {
                                title: 'Năm khởi tạo',
                                dataIndex: 'createdAt',
                                align: 'center',
                                width: 120,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Năm áp dụng',
                                dataIndex: 'startDate',
                                align: 'center',
                                width: 120,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                align: 'center',
                                width: 200,
                                render: (value) => <span className="line-clamp-1">{value}</span>,
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
                                render: (_, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 150,
                                fixed: 'right',
                                align: 'center',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'XEM_CHI_TIET',
                                    'THEM',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        const isLocked = (record as CurriculumVersion)?.isLock

                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip
                                                        title="Chỉnh sửa nội dung"
                                                        placement="top"
                                                    >
                                                        <HighlightOutlined
                                                            size={16}
                                                            className="text-base cursor-pointer"
                                                        />
                                                    </Tooltip>
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                    'THEM'
                                                ) && (
                                                    <CopyPlusIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (isLocked) {
                                                                return
                                                            }
                                                            handleCloneCurriculumVersion(
                                                                record as CurriculumVersion & {
                                                                    trainingBlocks: TrainingBlockOnCurriculumVersion[]
                                                                    documentFiles: DocumentFile[]
                                                                }
                                                            )
                                                        }}
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        title="Sửa thông tin chung"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (isLocked) {
                                                                return
                                                            }
                                                            onOpenCurriculumVersion({
                                                                curriculumId: (
                                                                    record as CurriculumVersion
                                                                ).curriculumId,
                                                                versionId: record?.id,
                                                            })
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {/* TODO: CẦN THÊM MỘT QUYỀN ĐỂ LOCK/UNLOCK*/}
                                                <LockPlusIcon
                                                    isLocked={isLocked}
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleToggleLock(
                                                                record?.id,
                                                                (record as CurriculumVersion)
                                                                    ?.isLock || false
                                                            )
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => {
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                if (isLocked) {
                                                                    e?.stopPropagation()
                                                                    return
                                                                }
                                                                handleDeleteCurriculumVersion(
                                                                    record?.id
                                                                )
                                                                e?.stopPropagation()
                                                            },
                                                            onCancel: (e) => {
                                                                e?.stopPropagation()
                                                            },
                                                            okButtonProps: {
                                                                disabled: isLocked,
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
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'THEM'
                                ) && (
                                    <CreateIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenCurriculumVersion({
                                                curriculumId: id,
                                                versionId: '',
                                            })
                                        }}
                                        title="Thêm mới CTĐT toàn khoá"
                                    />
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'SUA'
                                ) && (
                                    <EditIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenCurriculum(id)
                                        }}
                                        className="text-sm text-blue-700 cursor-pointer"
                                    />
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'XOA'
                                ) && (
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: (e) => {
                                                handleDeleteCurriculum(id)
                                                e?.stopPropagation()
                                            },
                                            onCancel: (e) => {
                                                e?.stopPropagation()
                                            },
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        )}
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

TrainingProgramCatalog.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
