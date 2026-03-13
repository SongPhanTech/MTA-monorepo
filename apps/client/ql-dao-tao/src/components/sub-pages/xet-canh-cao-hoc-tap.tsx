import { DownloadOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Modal, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { getWarningLevelColor } from '@hooks/getWarningLevelColor'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import {
    $Enums,
    type AcademicWarning,
    type FixedClass,
    type Prisma,
    type Student,
    type StudentSemesterResult,
    type TrainingCourse,
} from '@workspace/db/client'
import {
    useCreateAcademicWarning,
    useDeleteAcademicWarning,
    useFindManyAcademicWarning,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import {
    exportStudentAcademicWarningExcel,
    useExportStudentAcademicWarningJson,
} from '@workspace/libs/api/training'
import { whereOrganization } from '@workspace/libs/constants'
import { saveAs } from 'file-saver'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface XetCanhCaoHocTapProps {
    semesterId: string
    trainingObjectTypeId: string
}

const XetCanhCaoHocTap = ({ semesterId, trainingObjectTypeId }: XetCanhCaoHocTapProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        fixedClass: undefined,
        trainingCourse: undefined,
        organization: undefined,
    })

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const where: Prisma.AcademicWarningWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      student: {
                          ...(filters.code
                              ? { code: { contains: filters.code, mode: 'insensitive' } }
                              : {}),
                          userProfile: filters.name
                              ? { fullname: { contains: filters.name, mode: 'insensitive' } }
                              : {},
                          ...emptyObjectIf(
                              {
                                  fixedClassId: {
                                      in: Array.isArray(filters.fixedClass)
                                          ? filters.fixedClass
                                          : filters.fixedClass
                                            ? [filters.fixedClass]
                                            : undefined,
                                  },
                              },
                              !!filters.fixedClass
                          ),
                          fixedClass: {
                              ...(filters.trainingCourse
                                  ? { trainingCourseId: { in: filters.trainingCourse } }
                                  : {}),
                              ...(filters.organization
                                  ? { managementOrganizationId: { in: filters.organization } }
                                  : {}),
                          },
                      },
                  }
                : {},
        [filters, isFiltering]
    )
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: createAcademicWarning } = useCreateAcademicWarning()
    const { mutateAsync: deleteAcademicWarning } = useDeleteAcademicWarning()
    const { data: students = [] } = useExportStudentAcademicWarningJson<any[] | { data: any[] }>(
        { semesterId: semesterId, trainingObjectTypeId },
        { query: { enabled: !!semesterId && !!trainingObjectTypeId } },
        queryClient
    )

    const studentData = useMemo(() => {
        if (!students) return []
        if (Array.isArray(students)) return students
        if (students.data && Array.isArray(students.data)) return students.data
        return []
    }, [students])

    const { data: academicWarningData, refetch } = useFindManyAcademicWarning({
        where: {
            semesterId: semesterId,
            ...where,
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
        },
    })

    const filteredStudentData = useMemo(() => {
        if (!academicWarningData) return studentData

        const studentIdsWithWarnings = new Set(
            academicWarningData.map((warning: AcademicWarning) => warning.studentId)
        )

        return studentData.map((record) => ({
            ...record,
            students: (record.students || []).filter(
                (student: Student) => !studentIdsWithWarnings.has(student.id)
            ),
        }))
    }, [studentData, academicWarningData])

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
        },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })

    const treeData = buildOrgTree(manageOrgData)

    const { onOpen } = useDisclosure<{
        id: string
        semesterId: string
    }>({
        tag: 'PutAcademicWarning',
    })

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys as string[])
        },
        getCheckboxProps: (record: any) => {
            const isHeaderRow = Array.isArray(record.students)
            return {
                style: isHeaderRow ? { display: 'none' } : {},
            }
        },
    }

    const handleApproved = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một sinh viên để duyệt')
            return
        }

        const selectedRecords =
            studentData?.flatMap((record) =>
                (record.students || []).filter((student: Student) =>
                    selectedRowKeys.includes(student.id)
                )
            ) || []

        Modal.confirm({
            title: 'Xác nhận duyệt',
            content: `Bạn có chắc chắn muốn chấp nhận ${selectedRowKeys.length} sinh viên đã chọn?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    showSpinner()
                    const createAcademicWarningPromises = selectedRecords
                        .filter((record) => !!record.studentSemesterResult)
                        .map((record: any) => {
                            const currentLevel =
                                record.studentSemesterResult.academicWarningLevel ?? 0
                            const severity =
                                record.academicWarningRule?.length > 0
                                    ? Math.max(
                                          ...record.academicWarningRule.map((r: any) => r.severity)
                                      )
                                    : 1

                            return createAcademicWarning({
                                data: {
                                    student: { connect: { id: record.id } },
                                    semester: { connect: { id: semesterId } },
                                    level: currentLevel + severity,
                                    increasedFrom: currentLevel,
                                    description: record.reason,
                                },
                            })
                        })

                    await Promise.all(createAcademicWarningPromises)
                    await refetch()
                    setSelectedRowKeys([])
                    message.success('Duyệt thành công')
                } catch (error) {
                    message.error('Đã xảy ra lỗi khi duyệt')
                    console.error(error)
                } finally {
                    hideSpinner()
                }
            },
        })
    }

    async function handleDeleteAcademicWarning(id: string) {
        try {
            showSpinner()
            await deleteAcademicWarning({
                where: {
                    id,
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

    const handleExportExcel = async () => {
        try {
            showSpinner()
            const res = await exportStudentAcademicWarningExcel({
                semesterId,
                trainingObjectTypeId,
            })
            if (res.status === 200) {
                saveAs(res.data, 'Danh_sach_canh_cao_hoc_tap.xlsx')
                message.success('Xuất Excel thành công')
            } else {
                message.error('Đã xảy ra lỗi khi xuất Excel')
            }
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error)
            message.error('Đã xảy ra lỗi khi xuất Excel')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]} className="flex gap-4">
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end">
                                    <Button
                                        type="primary"
                                        onClick={() => onOpen({ id: '', semesterId })}
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
                            data={academicWarningData}
                            filters={filters}
                            setFilters={(value) => {
                                setFilters(value)
                                setCurrentPage(1)
                            }}
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
                                    title: 'Ngày sinh',
                                    width: 120,
                                    align: 'center',
                                    render: (__, record) => {
                                        const date = record?.student?.userProfile?.dateOfBirth
                                        return date ? dayjs(date).format('DD/MM/YYYY') : ''
                                    },
                                },
                                {
                                    title: 'Lớp niên chế',
                                    dataIndex: 'fixedClass',
                                    width: 160,
                                    align: 'center',
                                    type: 'select',
                                    options: fixedClassData.map((i: FixedClass) => ({
                                        value: i.id,
                                        label: i.name,
                                    })),
                                    render: (__, record) => record?.student?.fixedClass?.name,
                                },
                                {
                                    title: 'Khoá',
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
                                    title: 'Mức CCHT',
                                    dataIndex: 'level',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (value: number) => (
                                        <Tag color={getWarningLevelColor(value)}>{value}</Tag>
                                    ),
                                },
                                {
                                    title: 'Nâng Mức CCHT từ',
                                    dataIndex: 'increasedFrom',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (value: number) => (
                                        <Tag color={getWarningLevelColor(value)}>{value}</Tag>
                                    ),
                                },
                                {
                                    title: 'Ghi chú lý do',
                                    dataIndex: 'description',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (_, record) => (
                                        <span className="line-clamp-2">{record?.description}</span>
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
                                                        })
                                                    }
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteAcademicWarning(record?.id),
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
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end" gap={8}>
                                    <Button type="primary" onClick={handleExportExcel}>
                                        <DownloadOutlined />
                                        Xuất Excel
                                    </Button>
                                    <Button type="primary" onClick={handleApproved}>
                                        <BookPlus />
                                        Duyệt
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <TableCollapse
                            rowKey="courseId"
                            headerTitleKey="courseName"
                            childrenFieldName="students"
                            defaultExpandAll
                            data={filteredStudentData}
                            rowSelection={rowSelection}
                            columns={[
                                {
                                    title: 'Mã sinh viên',
                                    dataIndex: ['code'],
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) => record?.userProfile?.code ?? '',
                                },
                                {
                                    title: 'Tên sinh viên',
                                    dataIndex: ['userProfile', 'fullname'],
                                    width: 200,
                                },
                                {
                                    title: 'Ngày sinh',
                                    width: 120,
                                    align: 'center',
                                    render: (__, record) => {
                                        const date = record?.userProfile?.dateOfBirth
                                        return date ? dayjs(date).format('DD/MM/YYYY') : ''
                                    },
                                },
                                {
                                    title: 'Lớp',
                                    width: 60,
                                    align: 'center',
                                    render: (_, record) => {
                                        return (
                                            <Tooltip title={record?.fixedClass?.name}>
                                                {record?.fixedClass?.code || '-'}
                                            </Tooltip>
                                        )
                                    },
                                },
                                {
                                    title: 'Học kỳ',
                                    dataIndex: ['studentSemesterResult', 'semesterIndexInCourse'],
                                    width: 40,
                                    align: 'center',
                                },
                                {
                                    title: 'TBHK',
                                    dataIndex: ['studentSemesterResult'],
                                    width: 0,
                                    align: 'center',
                                    render: (result?: StudentSemesterResult) =>
                                        result?.baseScore === $Enums.AcademicRankingBaseType.Base10
                                            ? Number(result.gpaBase10)
                                            : Number(result?.gpaBase4 || 0),
                                },
                                {
                                    title: 'Lý do',
                                    dataIndex: ['reason'],
                                    width: 200,
                                    align: 'center',
                                    render: (value?: string) =>
                                        value?.split('\n').map((r) => <p>{r}</p>),
                                },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: filteredStudentData.reduce(
                                    (acc, course) => acc + (course.students?.length || 0),
                                    0
                                ),
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
        </div>
    )
}

export default XetCanhCaoHocTap
