import DeleteIcon from '@components/icons/delete'
import { Button, Checkbox, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import { PutStudentAcademicDecision } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useAcademicActionTypeOption } from '@hooks/academicActionType'
import { useDecisionStatusOptions } from '@hooks/decisionStatus'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import {
    type AcademicActionType,
    DecisionStatus,
    type FixedClass,
    type TrainingCourse,
} from '@workspace/db'
import {
    useDeleteStudentAcademicDecision,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyStudentAcademicDecision,
    useFindManyTrainingCourse,
    useUpsertStudentAcademicDecision,
} from '@workspace/db/hooks'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface XetXuLyHocTapProps {
    semesterId: string
    actionTaken: AcademicActionType
}

interface SelectedStudent {
    id: string
    code: string
    fullname: string
    academicActionId: string
    academicActionName: string
    isSelected: boolean
    reason?: string
}

const XetXuLyHocTap = ({ semesterId, actionTaken }: XetXuLyHocTapProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { getAcademicActionTypeLabel } = useAcademicActionTypeOption()
    const {
        options: decisionStatusOption,
        getDecisionStatusLabel,
        getDecisionStatusColor,
    } = useDecisionStatusOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        fixedClass: undefined,
        trainingCourse: undefined,
        organization: undefined,
        status: undefined,
        decisionDate: undefined,
    })

    const { data, refetch } = useFindManyStudentAcademicDecision(
        {
            where: {
                semesterId,
                actionTaken,
                student: {
                    userProfile: {
                        ...(filters.code && filters.code !== ''
                            ? {
                                  code: {
                                      contains: filters.code,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(filters.name && filters.name !== ''
                            ? {
                                  fullname: {
                                      contains: filters.name,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                    },
                    ...(filters.fixedClass
                        ? {
                              fixedClassId: {
                                  in: Array.isArray(filters.fixedClass)
                                      ? filters.fixedClass
                                      : [filters.fixedClass],
                              },
                          }
                        : {}),
                    fixedClass: {
                        ...(filters.trainingCourse
                            ? {
                                  trainingCourseId: {
                                      in: Array.isArray(filters.trainingCourse)
                                          ? filters.trainingCourse
                                          : [filters.trainingCourse],
                                  },
                              }
                            : {}),
                        ...(filters.organization
                            ? {
                                  managementOrganizationId: {
                                      in: Array.isArray(filters.organization)
                                          ? filters.organization
                                          : [filters.organization],
                                  },
                              }
                            : {}),
                    },
                },
                ...(filters.status
                    ? {
                          status: { in: filters.status },
                      }
                    : {}),
                ...(filters.decisionDate?.length === 2
                    ? {
                          decisionDate: {
                              gte: dayjs(filters.decisionDate?.[0], 'DD/MM/YYYY').toDate(),
                              lte: dayjs(filters.decisionDate?.[1], 'DD/MM/YYYY').toDate(),
                          },
                      }
                    : {}),
            },
            include: {
                student: {
                    include: {
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                                managementOrganization: true,
                            },
                        },
                        userProfile: true,
                    },
                },
                appliedConfig: true,
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!semesterId }
    )

    const { mutateAsync: deleteStudentAcademicDecision } = useDeleteStudentAcademicDecision()
    async function handleDeleteStudentAcademicDecision(id: string) {
        try {
            showSpinner()
            await deleteStudentAcademicDecision({
                where: {
                    id,
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { onOpen, onClose } = useDisclosure<{
        id: string
        semesterId: string
        actionTaken: AcademicActionType
    }>({
        tag: PutStudentAcademicDecision.name,
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    const { data: students = [] } = useExportStudentResultSemesterJson<any[] | { data: any[] }>(
        {
            semesterId: semesterId || '',
            type: 'academicAction',
            academicActionType: actionTaken,
        },
        {
            query: {
                enabled: !!semesterId,
            },
        },
        queryClient
    )

    const studentData = useMemo(() => {
        if (!students) return []
        if (Array.isArray(students)) return students
        if (students.data && Array.isArray(students.data)) return students.data
        return []
    }, [students])

    const updateSelectedStudents = useMemo(() => {
        return (keys: React.Key[]) => {
            const selected = keys
                .map((id) => {
                    let studentInfo = null
                    for (const course of studentData) {
                        const found = course.students?.find((s: any) => s.id === id)
                        if (found) {
                            studentInfo = found
                            break
                        }
                    }

                    if (studentInfo) {
                        return {
                            id: studentInfo.id,
                            code: studentInfo.userProfile?.code,
                            fullname: studentInfo.userProfile?.fullname,
                            academicActionId: studentInfo.academicAction?.[0]?.id,
                            academicActionName: studentInfo.academicAction?.[0]?.name,
                            isSelected: true,
                            academicActions: studentInfo.academicAction || [],
                            reason: studentInfo.reason,
                        }
                    }
                    return null
                })
                .filter(Boolean) as SelectedStudent[]

            setSelectedStudents(selected)
            return selected
        }
    }, [studentData])

    const onSelectChange = (id: string, selected: boolean) => {
        const newSelectedKeys = selected
            ? [...selectedRowKeys, id]
            : selectedRowKeys.filter((key) => key !== id)

        setSelectedRowKeys(newSelectedKeys)
        updateSelectedStudents(newSelectedKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onSelect: (record: any, selected: boolean) => {
            if (record.id) {
                onSelectChange(record.id, selected)
            }
        },
        hideSelectAll: true,
        columnWidth: 0,
        renderCell: (_: any, record: any, index: number) => {
            if (record.id) {
                return (
                    <Checkbox
                        checked={selectedRowKeys.includes(record.id)}
                        onChange={(e) => onSelectChange(record.id, e.target.checked)}
                    />
                )
            }
            return null
        },
    }

    const { mutateAsync: upsertStudentAcademicDecision } = useUpsertStudentAcademicDecision()

    const handleApprove = async () => {
        if (!semesterId) {
            message.error('Vui lòng chọn học kỳ')
            return
        }

        if (selectedStudents.length === 0) {
            message.warning('Vui lòng chọn ít nhất một sinh viên để duyệt')
            return
        }

        try {
            const decisionsToUpsert = selectedStudents.map((student) => ({
                where: {
                    studentId: student.id,
                    semesterId: semesterId,
                    actionTaken: actionTaken,
                },
                create: {
                    student: { connect: { id: student.id } },
                    semester: { connect: { id: semesterId } },
                    actionTaken: actionTaken,
                    status: DecisionStatus.PENDING,
                    appliedConfig: student.academicActionId
                        ? { connect: { id: student.academicActionId } }
                        : undefined,
                    decisionDate: new Date(),
                    reason: student.reason || undefined,
                },
                update: {
                    status: DecisionStatus.PENDING,
                    decisionDate: new Date(),
                    reason: student.reason || undefined,
                },
            }))

            await Promise.all(
                decisionsToUpsert.map((decision: any) => upsertStudentAcademicDecision(decision))
            )

            message.success(`Đã duyệt thành công cho ${selectedStudents.length} sinh viên`)
            setSelectedStudents([])
            setSelectedRowKeys([])
            refetch()
        } catch (error) {
            console.error('Lỗi khi duyệt quyết định:', error)
            message.error('Có lỗi xảy ra khi duyệt quyết định')
        }
    }
    return (
        <div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end">
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            onOpen({
                                                id: '',
                                                semesterId,
                                                actionTaken,
                                            })
                                        }
                                    >
                                        <BookPlus />
                                        Thêm học viên
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Table
                            rowKey="key"
                            data={data}
                            filters={filters}
                            setFilters={setFilters}
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
                                    title: 'Mã sinh viên',
                                    dataIndex: 'code',
                                    width: 120,
                                    align: 'center',
                                    fixed: 'left',
                                    type: 'input',
                                    render: (__, record) => record?.student?.userProfile?.code,
                                },
                                {
                                    title: 'Tên sinh viên',
                                    dataIndex: 'name',
                                    width: 200,
                                    fixed: 'left',
                                    type: 'input',
                                    render: (__, record) => record?.student?.userProfile?.fullname,
                                },
                                {
                                    title: 'Lớp niên chế',
                                    dataIndex: 'fixedClass',
                                    width: 150,
                                    align: 'center',
                                    type: 'select',
                                    options: fixedClassData.map((i: FixedClass) => ({
                                        value: i.id,
                                        label: i.name,
                                    })),
                                    render: (__, record) => record?.student?.fixedClass?.name,
                                },
                                {
                                    title: 'Khóa',
                                    dataIndex: 'trainingCourse',
                                    width: 100,
                                    align: 'center',
                                    type: 'select',
                                    options: trainingCourseData.map((i: TrainingCourse) => ({
                                        value: i.id,
                                        label: i.name,
                                    })),
                                    render: (__, record) =>
                                        record?.student?.fixedClass?.trainingCourse?.name,
                                },
                                {
                                    title: 'Đơn vị quản lý',
                                    dataIndex: 'organization',
                                    width: 150,
                                    align: 'center',
                                    type: 'tree_select',
                                    options: treeData,
                                    render: (__, record) =>
                                        record?.student?.fixedClass?.managementOrganization?.sTen,
                                },
                                {
                                    title: 'Ngày quyết định',
                                    dataIndex: 'decisionDate',
                                    width: 150,
                                    align: 'center',
                                    type: 'date',
                                    render: (__, record) =>
                                        record.decisionDate
                                            ? dayjs(record.decisionDate).format('DD/MM/YYYY')
                                            : '',
                                },
                                {
                                    title: 'Hành động đã thực hiện',
                                    dataIndex: 'actionTaken',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (value) => getAcademicActionTypeLabel(value),
                                },
                                {
                                    title: 'Trạng thái của quyết định',
                                    dataIndex: 'status',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    type: 'select',
                                    options: decisionStatusOption,
                                    render: (status) => (
                                        <Tag color={getDecisionStatusColor(status)}>
                                            {getDecisionStatusLabel(status)}
                                        </Tag>
                                    ),
                                },
                                {
                                    title: 'Ghi chú lý do',
                                    dataIndex: 'reason',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (value) => (
                                        <span className="line-clamp-2">{value}</span>
                                    ),
                                },
                                {
                                    title: 'Thao tác',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (_, record) => {
                                        return record?.id ? (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={() =>
                                                        onOpen({
                                                            id: record?.id,
                                                            semesterId,
                                                            actionTaken,
                                                        })
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteStudentAcademicDecision(
                                                                record?.id
                                                            ),
                                                    }}
                                                />
                                            </Row>
                                        ) : null
                                    },
                                },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                onChange: setCurrentPage,
                                onShowSizeChange: setNumberOfPages,
                                showTotal: (total, range) =>
                                    `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                            }}
                        />
                    </Col>
                </Row>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end">
                                    <Button
                                        type="primary"
                                        onClick={handleApprove}
                                        disabled={selectedStudents.length === 0}
                                    >
                                        <BookPlus />
                                        Duyệt
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <TableCollapse
                            rowKey="id"
                            headerTitleKey="courseName"
                            childrenFieldName="students"
                            defaultExpandAll
                            rowSelection={rowSelection}
                            columns={[
                                {
                                    title: 'Mã sinh viên',
                                    dataIndex: ['userProfile', 'code'],
                                    width: 120,
                                    align: 'center',
                                },
                                {
                                    title: 'Tên sinh viên',
                                    dataIndex: ['userProfile', 'fullname'],
                                    width: 150,
                                },
                                {
                                    title: 'Nguyên do',
                                    dataIndex: 'reason',
                                    width: 150,
                                },
                                {
                                    title: 'Mức độ cảnh cáo học tập',
                                    dataIndex: 'academicWarningSeverity',
                                    width: 150,
                                },
                                {
                                    title: 'Cảnh cáo',
                                    dataIndex: 'academicAction',
                                    width: 200,
                                    fixed: 'right',
                                    render: (academicAction, record) => {
                                        const hasAcademicActions =
                                            Array.isArray(academicAction) &&
                                            academicAction.length > 0
                                        const firstWarningId = hasAcademicActions
                                            ? academicAction[0].id
                                            : null

                                        return (
                                            <div className="flex flex-col gap-2">
                                                {hasAcademicActions &&
                                                    academicAction.map((action) => {
                                                        const isFirstWarning =
                                                            action.id === firstWarningId
                                                        return (
                                                            <div
                                                                key={action.id}
                                                                className="flex items-center"
                                                            >
                                                                <Checkbox
                                                                    className="mr-2"
                                                                    checked={isFirstWarning}
                                                                />
                                                                <span className="text-gray-800">
                                                                    {action.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        )
                                    },
                                },
                            ]}
                            data={studentData}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: studentData.length,
                                onChange: setCurrentPage,
                                onShowSizeChange: setNumberOfPages,
                            }}
                        />
                    </Col>
                </Row>
            </div>
        </div>
    )
}

export default XetXuLyHocTap
