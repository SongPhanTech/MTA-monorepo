import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import { type CouncilMember, SubjectVersionType, ThesisProjectStatus } from '@workspace/db/client'
import {
    useCountStudent,
    useCreateManyInvitation,
    useFindManyDM_DonVi,
    useFindManyExpertProfile,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManySubjectClass,
    useFindManyThesisProject,
    useFindManyThesisSession,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function PostgraduateProject() {
    const { can } = useAbility()
    const [editingRowKey, setEditingRowKey] = useState<string | null>(null)

    const [editingValue, setEditingValue] = useState<string>('')
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
    const handleSave = async (rowId: string) => {
        await refetchStudents()
    }
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectId } = useTrainingObjectTypeStore()
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { mutateAsync: createManyInvitation } = useCreateManyInvitation()
    const [trainingCourseseselected, setTrainingCoursesSelected] = useState<string[]>([])
    const [fixedClassesSelected, setFixedClassesSelected] = useState<string[]>([])
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
        }
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
    const [thesisSessionSelected, setThesisSessionSelected] = useState<string | undefined>(
        undefined
    )
    const { data: fixedClasses } = useFindManyFixedClass({
        where: {
            trainingCourseId: {
                in: trainingCourseseselected,
            },
        },
    })
    const { data: expertProfileData } = useFindManyExpertProfile({
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    console.log(expertProfileData)

    const { data: subjectClass } = useFindManySubjectClass({
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
                    ...emptyObjectIf(
                        [
                            {
                                currentStudents: filters.currentStudents,
                            },
                        ],
                        !!filters.currentStudents
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                maxStudents: filters.maxStudents,
                            },
                        ],
                        !!filters.maxStudents
                    ),
                    { title: 'asc' },
                ],
            },
        },
        orderBy: { subject: { name: 'asc' } },
    })
    const { data: thesisSessionData } = useFindManyThesisSession({
        orderBy: { startDate: 'desc' },
        where: {
            trainingObjectTypeId: trainingObjectId,
        },
        include: {
            trainingObjectType: true,
            trainingCourse: true,
        },
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

    useEffect(() => {
        if (!isOpen) {
            setSelectedRowKeys([])
        }
    }, [isOpen])

    const { showSpinner, hideSpinner } = useSpinner()

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

    const { data: students, refetch } = useFindManyStudent({
        where: {
            fixedClassId: {
                in: fixedClassesSelected,
            },
        },
        include: {
            userProfile: true,
            fixedClass: {
                include: {
                    trainingCourse: true,
                },
            },
            trainingObjectType: true,
        },
        skip: (currentPage - 1) * numberOfPages,
        take: numberOfPages,
    })
    const { data: countStudent } = useCountStudent({
        where: {
            fixedClassId: {
                in: fixedClassesSelected,
            },
        },
    })
    const [countStudents, setCountStudents] = useState<number>(0)
    const [selectedStudents, setSelectedStudents] = useState<any[]>([])
    const taodulieumau = async () => {
        await refetch()
        setCountStudents(countStudent || 0)
        setSelectedStudents(students || [])
    }
    const refetchStudents = async () => {
        await refetch()
        setCountStudents(countStudent || 0)
        setSelectedStudents(students || [])
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex gap={12}>
                                <Form.Item name="searchDotXet" label="Đợt xét">
                                    <Select
                                        className="w-36"
                                        options={thesisSessionData?.map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        }))}
                                        onChange={(value, option) => {
                                            setThesisSessionSelected(
                                                (option as any)?.label as string
                                            )
                                        }}
                                        placeholder="Chọn đợt xét"
                                    />
                                </Form.Item>
                                <Form.Item name="searchKhoaHoc" label="Khóa học">
                                    <Select
                                        className="w-36"
                                        mode="multiple"
                                        options={thesisSessionData?.map((x) => {
                                            return {
                                                label: x.trainingCourse.name,
                                                value: x.trainingCourse.id,
                                            }
                                        })}
                                        onChange={(value) => {
                                            setTrainingCoursesSelected(value as string[])
                                        }}
                                        placeholder="Chọn khóa học"
                                    />
                                </Form.Item>
                                <Form.Item name="searchText" label="Lớp học">
                                    <Select
                                        mode="multiple"
                                        className="w-36"
                                        options={fixedClasses?.map((x) => {
                                            return {
                                                label: x.name,
                                                value: x.id,
                                            }
                                        })}
                                        onChange={(value) => {
                                            setFixedClassesSelected(value as string[])
                                        }}
                                        placeholder="Chọn lớp học"
                                    />
                                </Form.Item>
                                <Form.Item name="searchKhoaQuanLy" label="Khoa quản lí">
                                    <Select
                                        mode="multiple"
                                        className="w-40"
                                        options={[]}
                                        placeholder="Chọn khoa quản lí"
                                    />
                                </Form.Item>
                                <Form.Item className="flex justify-end gap-3">
                                    <Button type="primary" onClick={() => {}}>
                                        Xem kết quả
                                    </Button>
                                    <Button
                                        type="primary"
                                        className="ml-2"
                                        onClick={async () => await taodulieumau()}
                                    >
                                        Tạo dữ liệu mẫu
                                    </Button>
                                </Form.Item>
                            </Flex>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
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
                                    </>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        className="w-full custom-scrollbar"
                        rowKey="id"
                        columns={[
                            {
                                title: 'Đối tượng đào tạo',
                                render: (_, record) => {
                                    return record?.trainingObjectType?.name
                                },
                            },
                            {
                                title: 'Đợt xét',
                                render: (_, record) => {
                                    return thesisSessionSelected
                                },
                            },
                            {
                                title: 'Mã sinh viên',
                                render: (_, record) => {
                                    return record?.userProfile?.code
                                },
                            },
                            {
                                title: 'Họ tên',
                                dataIndex: 'name',
                                render: (_, record) => {
                                    return record?.userProfile?.fullname
                                },
                            },
                            {
                                title: 'Ngày sinh',
                                dataIndex: 'name',
                                render: (_, record) => {
                                    return record?.userProfile?.dateOfBirth
                                },
                            },
                            {
                                title: 'Đề tài',
                                width: 200,
                                dataIndex: 'name',
                                render: (text: string, record: any) => {
                                    if (record.id === editingRowKey) {
                                        return (
                                            <Input
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onPressEnter={() => handleSave(record.id)} // Tùy chọn: Bấm Enter để lưu
                                            />
                                        )
                                    }
                                    // Nếu không phải, hiển thị text bình thường
                                    return text
                                },
                            },
                            {
                                title: 'GVHD 1',
                                dataIndex: 'name',
                            },
                            {
                                title: 'GVHD 2',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Ngôn ngữ',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Luận văn/Đề án',
                                dataIndex: 'name',
                            },
                            {
                                title: 'QĐ đề tài ',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Ký QĐ đề tài',
                            },
                            {
                                title: 'Thao tác',
                                render: (_, record: any) => {
                                    // Kiểm tra xem hàng này có phải là hàng đang sửa không
                                    if (record.id === editingRowKey) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    onClick={() => handleSave(record.id)}
                                                >
                                                    Lưu
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingRowKey(null) // Hủy, thoát chế độ edit
                                                        setEditingValue('') // Xóa giá trị tạm
                                                    }}
                                                >
                                                    Hủy
                                                </Button>
                                            </Row>
                                        )
                                    }

                                    // Nếu không phải, hiển thị nút Edit/Delete (như code cũ)
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                    onClick={() => {
                                                        // Khi bấm "Sửa"
                                                        setEditingRowKey(record.id) // Đặt hàng này vào chế độ edit
                                                        // Tải giá trị hiện tại của 'name' vào state tạm
                                                        setEditingValue(record.name || '')
                                                    }}
                                                />
                                                <DeleteIcon />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={selectedStudents}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: countStudents,
                            onChange: async (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                    setCountStudents(countStudent || 0)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                    setCountStudents(countStudent || 0)
                                }
                                await refetchStudents()
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

PostgraduateProject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
