import { EyeOutlined } from '@ant-design/icons'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import SettingsIcon from '@components/icons/settings'
import UpdateProgressModal from '@components/modal/update-progress-modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import {
    type CouncilMember,
    type Prisma,
    SubjectVersionType,
    ThesisProjectStatus,
} from '@workspace/db/client'
import {
    useCountSubjectClass,
    useCreateManyInvitation,
    useFindManyDM_DonVi,
    useFindManySubjectClass,
    useFindManyThesisProject,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useSemesterStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ThesisProject() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const { getThesisProjectStatusColor, getThesisProjectStatusLabel, thesisProjectStatusOptions } =
        useThesisProjectStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: undefined,
        title: undefined,
        titleEN: undefined,
        supervisor: undefined,
        organization: undefined,
        maxStudents: undefined,
        startDate: undefined,
        endDate: undefined,
        statusThesisProject: undefined,
        currentStudents: undefined,
        summary: undefined,
    })
    const { id: semesterId } = useSemesterStore()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { mutateAsync: createManyInvitation } = useCreateManyInvitation()
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
         orderBy: { iSTT: 'desc' }
    })
    const treeData = buildOrgTree(manageOrgData)
    const ALLOWED_STATUSES: ThesisProjectStatus[] = [
        ThesisProjectStatus.COMPLETED,
        ThesisProjectStatus.DEFENDED_FAILED,
        ThesisProjectStatus.DEFENDED_PASSED,
    ]

    const where = useMemo(() => {
        const thesisProjectFilters = {
            ...(filters.code
                ? { code: { contains: filters.code, mode: 'insensitive' as const } }
                : {}),
            ...(filters.title
                ? { title: { contains: filters.title, mode: 'insensitive' as const } }
                : {}),
            ...(filters.titleEN
                ? { titleEN: { contains: filters.titleEN, mode: 'insensitive' as const } }
                : {}),
            ...(filters.summary
                ? { summary: { contains: filters.summary, mode: 'insensitive' as const } }
                : {}),
            ...(filters.supervisor
                ? {
                      supervisor: {
                          name: {
                              contains: filters.supervisor,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...emptyObjectIf(
                {
                    organizationId: {
                        in: filters.organization,
                    },
                },
                !!filters.organization
            ),
            ...(filters.startDate?.length === 2
                ? {
                      registrationStart: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      registrationEnd: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
        }

        const hasThesisProjectFilter = Object.keys(thesisProjectFilters).length > 0

        return {
            subject: {
                type: SubjectVersionType.Project,
            },
            ...(semesterId ? { semesterId } : {}),
            ...(filters.searchText
                ? {
                      OR: [
                          { name: { contains: filters.searchText, mode: 'insensitive' as const } },
                          { code: { contains: filters.searchText, mode: 'insensitive' as const } },
                          {
                              subject: {
                                  name: {
                                      contains: filters.searchText,
                                      mode: 'insensitive' as const,
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(hasThesisProjectFilter
                ? {
                      thesisProjects: {
                          some: thesisProjectFilters,
                      },
                  }
                : {}),
            deletedAt: null,
            active: true,
            cancelled: false,
            status: 'OFFICIAL',
        } satisfies Prisma.SubjectClassWhereInput
    }, [
        semesterId,
        filters.searchText,
        filters.code,
        filters.title,
        filters.titleEN,
        filters.supervisor,
        filters.organization,
        filters.startDate,
        filters.endDate,
        filters.summary,
    ])

    const { data: subjectClass, refetch } = useFindManySubjectClass({
        where,
        include: {
            subject: true,
            thesisProjects: {
                include: {
                    organization: true,
                    supervisor: true,
                    registrations: {
                        include: {
                            student: {
                                include: {
                                    userProfile: true,
                                    fixedClass: {
                                        include: {
                                            trainingCourse: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    council: { include: { members: { include: { expert: true } } } },
                },
                where: {
                    ...(filters.statusThesisProject
                        ? Array.isArray(filters.statusThesisProject)
                            ? { status: { in: filters.statusThesisProject } }
                            : { status: { equals: filters.statusThesisProject } }
                        : {}),
                    ...(filters.code
                        ? { code: { contains: filters.code, mode: 'insensitive' } }
                        : {}),
                    ...(filters.title
                        ? { title: { contains: filters.title, mode: 'insensitive' } }
                        : {}),
                    ...(filters.titleEN
                        ? { titleEN: { contains: filters.titleEN, mode: 'insensitive' } }
                        : {}),
                    ...(filters.summary
                        ? { summary: { contains: filters.summary, mode: 'insensitive' } }
                        : {}),
                    ...(filters.supervisor
                        ? {
                              supervisor: {
                                  name: {
                                      contains: filters.supervisor,
                                      mode: 'insensitive',
                                  },
                              },
                          }
                        : {}),
                    ...emptyObjectIf(
                        {
                            organizationId: {
                                in: filters.organization,
                            },
                        },
                        !!filters.organization
                    ),
                    ...(filters.startDate?.length === 2
                        ? {
                              registrationStart: {
                                  gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                                  lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                              },
                          }
                        : {}),
                    ...(filters.endDate?.length === 2
                        ? {
                              registrationEnd: {
                                  gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                                  lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                              },
                          }
                        : {}),
                },
                orderBy: [
                    ...emptyObjectIf([{ maxStudents: filters.maxStudents }], !!filters.maxStudents),
                    { title: 'asc' },
                ],
            },
        },
        orderBy: { subject: { name: 'asc' } },
    })

    const { data: count } = useCountSubjectClass({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<{ subjectClassId: string; thesisProjectId: string }>({
        tag: 'PutThesisProject',
    })

    const { onOpen: openModalPrintDecision } = useDisclosure<{
        subjecClassData: any
        isCopy?: boolean
    }>({
        tag: 'ModalPrintDecision',
    })

    const { onOpen: openPaymentRecord, isOpen } = useDisclosure<{ selectedRowKeys: string[] }>({
        tag: 'PutPaymentRecord',
    })

    const { onOpen: openModalPrintInvitation } = useDisclosure<{ councilMemberIds: string[] }>({
        tag: 'ModalPrintInvitation',
    })

    const { onOpen: openPrintSupervisorGuide } = useDisclosure({
        tag: 'ModalPrintSupervisorGuide',
    })

    const { onOpen: openUpdateProgress } = useDisclosure<{
        selectedRowKeys: string[]
        type: 'FIRST' | 'SECOND'
        onSuccess?: () => void
    }>({
        tag: 'UpdateProgressModal',
    })

    useEffect(() => {
        if (!isOpen) {
            setSelectedRowKeys([])
        }
    }, [isOpen])

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateThesisProject({
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

    const handleNavigate = (record: { id?: string }) => {
        if (
            can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN, 'XEM_CHI_TIET') &&
            record?.id
        ) {
            router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN}/${record.id}`)
        }
    }

    const { data: selectedThesisProjects } = useFindManyThesisProject(
        {
            where: {
                id: { in: selectedRowKeys.map(String) },
                councilId: { not: null },
            },
            include: {
                council: {
                    include: {
                        members: true,
                    },
                },
            },
        },
        { enabled: !!selectedRowKeys.length }
    )

    const councilMemberIds =
        selectedThesisProjects
            ?.flatMap(({ council }) => council?.members.map((member: CouncilMember) => member.id))
            .filter((id): id is string => Boolean(id)) || []

    const createInvitations = async () => {
        if (!councilMemberIds || councilMemberIds.length === 0) {
            message.info('Hiện chưa có thành viên hội đồng để tạo thư mời')
            return
        }

        try {
            showSpinner()

            await createManyInvitation({
                data: councilMemberIds.map((councilMemberId) => ({
                    councilMemberId: councilMemberId,
                })),
                skipDuplicates: true,
            })

            message.success('Tạo thư mời thành công')
            openModalPrintInvitation({ councilMemberIds })
        } catch (error) {
            message.error('Đã xảy ra lỗi khi tạo thư mời')
        } finally {
            hideSpinner()
        }
    }

    const handleNavigateSetting = (id: string) => {
        router.push(
            `${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN_CAU_HINH_HOI_DONG}?subjectClassId=${id}`
        )
    }

    const isEligibleForPayment = (selectedRowKeys: string[]) => {
        if (!subjectClass) return false

        const selectableProjects = subjectClass.flatMap((sc) =>
            sc.thesisProjects ? sc.thesisProjects : []
        )

        const projectIds = selectableProjects.map((p) => p.id)

        const validSelectedKeys = selectedRowKeys.filter((id) => projectIds.includes(id))

        if (validSelectedKeys.length === 0) return false

        const selectedProjects = selectableProjects.filter((p) => validSelectedKeys.includes(p.id))

        return selectedProjects.every((p) => ALLOWED_STATUSES.includes(p.status))
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                setFilters({
                                                    ...filters,
                                                    searchText: e.target.value,
                                                })
                                            }
                                            className="py-0"
                                            placeholder="Tìm kiếm lớp môn học"
                                            prefix={
                                                <Search
                                                    size={12}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col>
                            <Flex justify="end" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                    'SUA'
                                ) && (
                                    <Button
                                        onClick={() =>
                                            openPaymentRecord({
                                                selectedRowKeys: selectedRowKeys as string[],
                                            })
                                        }
                                        type="primary"
                                        disabled={
                                            selectedRowKeys.length === 0 ||
                                            !isEligibleForPayment(selectedRowKeys as string[])
                                        }
                                    >
                                        Tạo thanh toán
                                    </Button>
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                    'IN'
                                ) && (
                                    <>
                                        <Button
                                            onClick={() => openPrintSupervisorGuide()}
                                            type="primary"
                                            disabled={
                                                !subjectClass ||
                                                subjectClass.length === 0 ||
                                                !subjectClass.some(
                                                    (item) =>
                                                        item.thesisProjects &&
                                                        item.thesisProjects.length > 0
                                                )
                                            }
                                        >
                                            In quyết định hướng dẫn
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                openModalPrintDecision({
                                                    subjecClassData: subjectClass,
                                                    isCopy: false,
                                                })
                                            }
                                            type="primary"
                                            disabled={
                                                !subjectClass ||
                                                subjectClass.length === 0 ||
                                                !subjectClass.some(
                                                    (item) =>
                                                        item.thesisProjects &&
                                                        item.thesisProjects.length > 0
                                                )
                                            }
                                        >
                                            Quyết định
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                openModalPrintDecision({
                                                    subjecClassData: subjectClass,
                                                    isCopy: true,
                                                })
                                            }
                                            type="primary"
                                            disabled={
                                                !subjectClass ||
                                                subjectClass.length === 0 ||
                                                !subjectClass.some(
                                                    (item) =>
                                                        item.thesisProjects &&
                                                        item.thesisProjects.length > 0
                                                )
                                            }
                                        >
                                            In bản sao Quyết định
                                        </Button>
                                        <Button
                                            onClick={createInvitations}
                                            type="primary"
                                            disabled={selectedRowKeys.length === 0}
                                        >
                                            <BookPlus />
                                            Tạo thư mời
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                openUpdateProgress({
                                                    selectedRowKeys: selectedRowKeys as string[],
                                                    type: 'FIRST',
                                                    onSuccess: () => refetch(),
                                                })
                                            }
                                            type="primary"
                                            disabled={selectedRowKeys.length === 0}
                                        >
                                            Cập nhật tiến độ 1
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                openUpdateProgress({
                                                    selectedRowKeys: selectedRowKeys as string[],
                                                    type: 'SECOND',
                                                    onSuccess: () => refetch(),
                                                })
                                            }
                                            type="primary"
                                            disabled={selectedRowKeys.length === 0}
                                        >
                                            Cập nhật tiến độ 2
                                        </Button>
                                    </>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        id="thesis-project"
                        filters={filters}
                        headerTitleKey={({ code, name, subject }) =>
                            `${[subject.name, name, code].filter(Boolean).join(' - ')}`
                        }
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        data={subjectClass}
                        childrenFieldName="thesisProjects"
                        onRowClick={(record) => handleNavigate(record)}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                            getCheckboxProps: (record) => {
                                if (record.thesisProjects) {
                                    return {
                                        disabled: true,
                                        style: { display: 'none' },
                                    }
                                }
                                return {}
                            },
                        }}
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[85px] items-center justify-center">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                    'THEM'
                                ) && (
                                    <CreateIcon
                                        onClick={() => {
                                            onOpen({
                                                subjectClassId: id,
                                                thesisProjectId: '',
                                            })
                                        }}
                                        title="Thêm mới đề tài"
                                    />
                                )}
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                    'SUA'
                                ) && (
                                    <SettingsIcon
                                        className="cursor-pointer"
                                        onClick={() => handleNavigateSetting(id)}
                                        title="Cấu hình hội đồng"
                                    />
                                )}
                            </div>
                        )}
                        columns={[
                            {
                                title: 'Tên đề tài',
                                dataIndex: 'title',
                                width: 150,
                                fixed: 'left',
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Tên đề tài(Tiếng Anh)',
                                dataIndex: 'titleEN',
                                width: 200,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Tóm tắt đề tài',
                                dataIndex: 'summary',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Chuyên gia hướng dẫn',
                                dataIndex: 'supervisor',
                                width: 200,
                                type: 'input',
                                render: (record) => record?.name,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                width: 150,
                                type: 'tree_select',
                                options: treeData,
                                render: (record) => record?.sTen,
                                align: 'center',
                            },
                            {
                                title: 'Số lượng HV',
                                dataIndex: 'currentStudents',
                                align: 'center',
                                width: 150,
                                render: (_, record) => record.registrations?.length,
                            },
                            {
                                title: 'Số lượng HV tối đa',
                                dataIndex: 'maxStudents',
                                align: 'center',
                                width: 180,
                                type: 'order',
                            },
                            {
                                title: 'Thời gian mở ĐK',
                                dataIndex: 'startDate',
                                align: 'center',
                                width: 180,
                                type: 'date',
                                render: (_, record) =>
                                    record?.registrationStart
                                        ? dayjs(record?.registrationStart).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Thời gian đóng ĐK',
                                dataIndex: 'endDate',
                                align: 'center',
                                width: 190,
                                type: 'date',
                                render: (_, record) =>
                                    record?.registrationEnd
                                        ? dayjs(record?.registrationEnd).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Tiến độ KT 1',
                                dataIndex: 'firstCheckProgress',
                                align: 'center',
                                width: 120,
                                render: (value) => (value ? `${value}%` : ''),
                            },
                            {
                                title: 'Tiến độ KT 2',
                                dataIndex: 'secondCheckProgress',
                                align: 'center',
                                width: 120,
                                render: (value) => (value ? `${value}%` : ''),
                            },
                            {
                                title: 'ĐK bảo vệ',
                                dataIndex: 'isEligibleForDefense',
                                align: 'center',
                                width: 120,
                                render: (value) =>
                                    value ? (
                                        <Tag color="success">Đủ ĐK</Tag>
                                    ) : (
                                        <Tag color="error">Không đủ ĐK</Tag>
                                    ),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'statusThesisProject',
                                align: 'center',
                                width: 160,
                                fixed: 'right',
                                type: 'select',
                                options: thesisProjectStatusOptions,
                                render: (_, record) => {
                                    const label = getThesisProjectStatusLabel(record?.status)
                                    const color = getThesisProjectStatusColor(record?.status)
                                    return <Tag color={color}>{label}</Tag>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                    'XEM_CHI_TIET',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip title="Xem chi tiết" placement="top">
                                                        <EyeOutlined className="text-sm cursor-pointer" />
                                                    </Tooltip>
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            onOpen({
                                                                subjectClassId:
                                                                    record.subjectClassId as string,
                                                                thesisProjectId: record.id,
                                                            })
                                                            e.stopPropagation()
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_MUC_DO_AN,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDelete(record.id)
                                                                e?.stopPropagation()
                                                            },
                                                            onCancel: (e) => e?.stopPropagation(),
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
            <UpdateProgressModal />
        </div>
    )
}

ThesisProject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
