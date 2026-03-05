import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import DefaultLayout from '@layouts/default-layout'
import {
    CouncilRole,
    StudentThesisRegistrationStatus,
    SubjectVersionType,
    ThesisProjectStatus,
    ThesisType,
} from '@workspace/db'
import {
    useCountThesisProject,
    useFindManyDefenseSession,
    useFindManyExpertProfile,
    useFindManyRoom,
    useFindManySubjectClass,
    useFindManyThesisProject,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    message,
    Popconfirm,
    Row,
    Tabs,
    Tag,
} from 'antd'
import dayjs from 'dayjs'
import { CircleMinus, SquarePen } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import utc from 'dayjs/plugin/utc'
import { useAbility } from '@workspace/permissions'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
dayjs.extend(utc)
interface DoAnForm {
    subjectClassId: string
}
const { TextArea } = Input

export default function DanhMucDoAn() {
    const [form] = Form.useForm<DoAnForm>()
    const [searchParams, setSearchParams] = useState<Partial<DoAnForm>>({})
    const [currentPage, setCurrentPage] = useState(1)
    const { showSpinner, hideSpinner } = useSpinner()
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
    const [currentProject, setCurrentProject] = useState<any>(null)
    const { getThesisProjectStatusLabel, getThesisProjectStatusColor, thesisProjectStatusOptions } =
        useThesisProjectStatusOptions()
    const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
    const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const { can } = useAbility()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const subjectClassId = Form.useWatch('subjectClassId', form)

    const isProjectLecturer = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DM_DO_AN, 'SUA')

    const { data: subjectClassData = [] } = useFindManySubjectClass(
        {
            where: {
                semesterId,
                trainingObjectTypeId,
                subject: { type: SubjectVersionType.Project },
            },
            include: {
                subjectClassStudent: {
                    include: {
                        student: {
                            include: {
                                userProfile: true,
                                fixedClass: true,
                            },
                        },
                        studentThesisRegistration: true,
                    },
                },
            },
        },
        { enabled: !!semesterId && !!trainingObjectTypeId }
    )

    useEffect(() => {
        if (semesterId || trainingObjectTypeId) {
            form.resetFields()
        }
    }, [semesterId, trainingObjectTypeId, form.resetFields])

    useEffect(() => {
        if (semesterId || trainingObjectTypeId || subjectClassId) {
            setCurrentPage(1)
        }
    }, [semesterId, trainingObjectTypeId, subjectClassId])

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
        getCheckboxProps: (record: any) => ({
            disabled: record.isLock,
        }),
    }
    const where = useMemo(() => {
        return {
            thesisType: ThesisType.PROJECT,
            ...(subjectClassId
                ? { subjectClassId }
                : {
                      subjectClassId: {
                          in: subjectClassData.map((c) => c.id),
                      },
                  }),
        }
    }, [subjectClassId, subjectClassData])

    const {
        data: thesisProjectData = [],
        refetch: refetchThesisProjectData,
        isPending,
    } = useFindManyThesisProject({
        where,
        include: {
            subjectClass: { include: { subject: true } },
            supervisor: {
                include: {
                    lecturer: { include: { userProfile: true } },
                },
            },
            coSupervisor: {
                include: {
                    lecturer: { include: { userProfile: true } },
                },
            },
            registrations: {
                include: {
                    student: {
                        include: {
                            userProfile: true,
                            fixedClass: true,
                        },
                    },
                    studentSubjectScore: true,
                },
            },
            room: true,
            defenseSession: true,
            defenseRecord: true,
            council: {
                include: {
                    members: {
                        include: {
                            expert: {
                                include: {
                                    lecturer: {
                                        include: {
                                            userProfile: true,
                                        },
                                    },
                                },
                            },
                            payment: true,
                        },
                    },
                },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const hasLockedThesis = thesisProjectData.some((p) => p.isLock)
    const allLocked = thesisProjectData.length > 0 && thesisProjectData.every((p) => p.isLock)
    const { data: defenseSessionData = [] } = useFindManyDefenseSession()
    const { data: roomsData = [] } = useFindManyRoom()
    const { data: expertProfiles = [] } = useFindManyExpertProfile({
        where: {
            projectExpert: true,
        },
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    const { data: thesisProjectDataCount = 0 } = useCountThesisProject({
        where: where,
    })
    const studentsInSelectedClass = useMemo(() => {
        if (!currentProject || !subjectClassData) return []

        const targetClass = subjectClassData.find((c) => c.id === currentProject.subjectClassId)

        return targetClass?.subjectClassStudent || []
    }, [currentProject, subjectClassData])
    const handleEditChange = (rowId: string, field: string, value: any) => {
        setEditingValues((prev) => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [field]: value,
            },
        }))
    }
    const handleSearch = () => {
        const values = form.getFieldsValue()
        setSearchParams(values)
        setCurrentPage(1)
    }

    const handleGenerateMockData = async () => {
        const subjectClassId = form.getFieldValue('subjectClassId')

        if (!subjectClassId) {
            message.warning('Vui lòng chọn một lớp môn học')
            return
        }

        const assignedStudentIds = thesisProjectData.flatMap(
            (project) => project.registrations?.map((reg) => reg.studentId) || []
        )

        const currentClass = subjectClassData.find((c) => c.id === subjectClassId)
        const allStudentsInClass = currentClass?.subjectClassStudent || []

        const unassignedStudents = allStudentsInClass.filter(
            (item) => !assignedStudentIds.includes(item.studentId)
        )

        if (unassignedStudents.length === 0) {
            message.info('Tất cả sinh viên trong lớp đã có bản ghi đồ án.')
            return
        }

        try {
            showSpinner()
            const transactions = unassignedStudents.map((item: any) => ({
                model: 'ThesisProject' as const,
                operation: 'create' as const,
                data: {
                    data: {
                        title: '',
                        subjectClassId: subjectClassId,
                        thesisType: ThesisType.PROJECT,
                        status: ThesisProjectStatus.PROPOSED,
                        registrations: {
                            create: {
                                studentId: item.studentId,
                                studentSubjectScoreId: item.id,
                                status: StudentThesisRegistrationStatus.ACCEPTED,
                                registeredAt: new Date(),
                            },
                        },
                    },
                },
            }))

            await sqlTransaction(transactions)
            await refetchThesisProjectData()
            message.success(
                `Đã tạo thành công ${unassignedStudents.length} đồ án cho sinh viên chưa có đề tài.`
            )
            handleSearch()
        } catch (error) {
            console.error('Lỗi tạo dữ liệu mẫu:', error)
            message.error('Không thể tạo dữ liệu mẫu. Vui lòng kiểm tra lại dữ liệu.')
        } finally {
            hideSpinner()
        }
    }

    const { onOpen: openUpdateProgress } = useDisclosure<{
        selectedRowKeys: string[]
        type: 'FIRST' | 'SECOND'
        onSuccess?: () => void
    }>({
        tag: 'UpdateProgressModal',
    })

    const handleActivateEdit = () => {
        if (!thesisProjectData || thesisProjectData.length === 0) {
            message.info('Không có dữ liệu đồ án để chỉnh sửa.')
            return
        }
        const newEditingRowKeys = thesisProjectData.map((s) => s.id)
        const initialEditingValues: Record<string, Record<string, any>> = {}
        thesisProjectData.forEach((record) => {
            initialEditingValues[record.id] = {
                title: record.title || '',
                supervisor: record.supervisor?.id || '',
                coSupervisor: record.coSupervisor?.id || '',
                defenseDate: record.defenseDate || '',
                defenseSession: record.defenseSession?.id || '',
                room: record.room?.id || '',
                chairman:
                    record.council?.members.find((x: any) => x.role === CouncilRole.CHAIRMAN)
                        ?.expert?.id || '',
                secretary:
                    record.council?.members.find((x: any) => x.role === CouncilRole.SECRETARY)
                        ?.expert?.id || '',
                reviewer1:
                    record.council?.members.find((x: any) => x.role === CouncilRole.REVIEWER_1)
                        ?.expert?.id || '',
                reviewer2:
                    record.council?.members.find((x: any) => x.role === CouncilRole.REVIEWER_2)
                        ?.expert?.id || '',
                councilMember:
                    record.council?.members.find((x: any) => x.role === CouncilRole.MEMBER)?.expert
                        ?.id || '',
                status: record.status || '',
                defenseRecordComments: record.defenseRecord?.comments || '',
                defenseRecordFinalScore: record.defenseRecord?.finalScore || null,
                subjectClassId: record.subjectClassId || '',
            }
        })
        setEditingRowKeys(newEditingRowKeys)
        setEditingValues(initialEditingValues)
    }
    const handleSaveChanges = async () => {
        if (Object.keys(editingValues).length === 0) {
            setEditingRowKeys([])
            return
        }

        try {
            const transactions: any[] = []

            for (const thesisId of Object.keys(editingValues)) {
                const values = editingValues[thesisId]
                const originalRecord = thesisProjectData.find((t) => t.id === thesisId)

                // 1. Xử lý điểm số
                const finalScore =
                    values.defenseRecordFinalScore === '' ||
                    values.defenseRecordFinalScore === undefined ||
                    values.defenseRecordFinalScore === null
                        ? null
                        : Number(values.defenseRecordFinalScore)

                const relation = (id: string | null | undefined) => {
                    return id ? { connect: { id } } : { disconnect: true }
                }

                if (originalRecord?.registrations) {
                    for (const reg of originalRecord.registrations) {
                        if (reg.studentSubjectScoreId) {
                            transactions.push({
                                model: 'StudentSubjectScore' as const,
                                operation: 'update' as const,
                                data: {
                                    where: { id: reg.studentSubjectScoreId },
                                    data: {
                                        attendanceScore: finalScore,
                                        midtermScore: finalScore,
                                        examScore: finalScore,
                                        finalScore: finalScore,
                                    },
                                },
                            })
                        }
                    }
                }

                const expertRolesMapping = [
                    { key: 'chairman', role: CouncilRole.CHAIRMAN },
                    { key: 'secretary', role: CouncilRole.SECRETARY },
                    { key: 'reviewer1', role: CouncilRole.REVIEWER_1 },
                    { key: 'reviewer2', role: CouncilRole.REVIEWER_2 },
                    { key: 'councilMember', role: CouncilRole.MEMBER },
                ]

                const memberUpserts = expertRolesMapping
                    .filter((m) => values[m.key])
                    .map((m) => {
                        const existingMember = originalRecord?.council?.members?.find(
                            (em: any) => em.role === m.role
                        )
                        return {
                            where: { id: existingMember?.id || 'new-id' },
                            create: { role: m.role, expertId: values[m.key] },
                            update: { expertId: values[m.key] },
                        }
                    })

                const updateData: any = {
                    title: values.title || '',
                    status: values.status || 'PROPOSED',
                    defenseDate: values.defenseDate ? dayjs(values.defenseDate).toDate() : null,
                    supervisor: relation(values.supervisor),
                    coSupervisor: relation(values.coSupervisor),
                    room: relation(values.room),
                    defenseSession: relation(values.defenseSession),
                    defenseRecord: {
                        upsert: {
                            create: {
                                finalScore,
                                comments: values.defenseRecordComments || null,
                            },
                            update: {
                                finalScore,
                                comments: values.defenseRecordComments || null,
                            },
                        },
                    },
                }

                if (originalRecord?.councilId) {
                    if (memberUpserts.length > 0) {
                        updateData.council = {
                            update: { members: { upsert: memberUpserts } },
                        }
                    }
                } else if (memberUpserts.length > 0) {
                    updateData.council = {
                        create: {
                            members: { create: memberUpserts.map((m) => m.create) },
                        },
                    }
                }

                transactions.push({
                    model: 'ThesisProject' as const,
                    operation: 'update' as const,
                    data: {
                        where: { id: thesisId },
                        data: updateData,
                    },
                })
            }
            const enteredExamScore = Object.values(editingValues).filter(
                (i) => i?.defenseRecordFinalScore
            )
            const subjectClassIds = [...new Set(enteredExamScore.map((i) => i.subjectClassId))]
            console.log(subjectClassIds, enteredExamScore)
            if (subjectClassIds.length > 0) {
                subjectClassIds.forEach((i) => {
                    transactions.push({
                        model: 'SubjectClass' as const,
                        operation: 'update' as const,
                        data: {
                            where: { id: i?.subjectClassId },
                            data: {
                                enteredScore: true,
                                enteredExamScore: true,
                            },
                        },
                    })
                })
            }
            await sqlTransaction(transactions)
            await refetchThesisProjectData()
            message.success('Đã lưu thay đổi đồ án và cập nhật bảng điểm sinh viên!')
            setEditingRowKeys([])
            setEditingValues({})
        } catch (error) {
            console.error('Lỗi khi lưu:', error)
            message.error('Không thể lưu dữ liệu. Vui lòng kiểm tra lại các trường thông tin.')
        }
    }

    const handleBulkToggleLock = async (isLocking: boolean) => {
        try {
            showSpinner()
            const transactions = thesisProjectData.map((p) => ({
                model: 'ThesisProject' as const,
                operation: 'update' as const,
                data: {
                    where: { id: p.id },
                    data: { isLock: isLocking },
                },
            }))
            await sqlTransaction(transactions)
            await refetchThesisProjectData()
            message.success(isLocking ? 'Đã khóa tất cả đề tài!' : 'Đã mở khóa tất cả đề tài!')
        } catch (error) {
            message.error('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                        <Form
                            form={form}
                            layout="horizontal"
                            className="w-full mb-4 flex flex-wrap items-end gap-4"
                        >
                            <Form.Item
                                name="subjectClassId"
                                label="Lớp môn học"
                                className="mb-0 w-86"
                            >
                                <Select
                                    className="w-86"
                                    popupMatchSelectWidth={false}
                                    options={subjectClassData?.map((item) => ({
                                        label: `${item.code} - ${item.name}`,
                                        value: item.id,
                                    }))}
                                    placeholder="Chọn lớp môn học"
                                />
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button
                                        type="primary"
                                        loading={isPending}
                                        disabled={hasLockedThesis}
                                        onClick={async () => await handleGenerateMockData()}
                                    >
                                        Tạo dữ liệu mẫu
                                    </Button>
                                    {/* <Button type="primary" onClick={handleSearch}>
                                        Xem kết quả
                                    </Button> */}
                                    {editingRowKeys.length > 0 ? (
                                        <>
                                            <Button
                                                type="default"
                                                className="ml-2"
                                                onClick={() => {
                                                    setEditingRowKeys([])
                                                    setEditingValues({})
                                                    message.info(
                                                        'Đã hủy tất cả các thay đổi chưa lưu.'
                                                    )
                                                }}
                                            >
                                                Hủy thay đổi
                                            </Button>
                                            <Button
                                                type="primary"
                                                className="ml-2"
                                                onClick={async () => await handleSaveChanges()}
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="default"
                                            className="ml-2"
                                            disabled={hasLockedThesis}
                                            onClick={handleActivateEdit}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                    {isProjectLecturer && (
                                        <>
                                            <Button
                                                onClick={() =>
                                                    openUpdateProgress({
                                                        selectedRowKeys:
                                                            selectedRowKeys as string[],
                                                        type: 'FIRST',
                                                        onSuccess: () => refetchThesisProjectData(),
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
                                                        selectedRowKeys:
                                                            selectedRowKeys as string[],
                                                        type: 'SECOND',
                                                        onSuccess: () => refetchThesisProjectData(),
                                                    })
                                                }
                                                type="primary"
                                                disabled={selectedRowKeys.length === 0}
                                            >
                                                Cập nhật tiến độ 2
                                            </Button>
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DM_DO_AN,
                                                'DUYET'
                                            ) && (
                                                <Popconfirm
                                                    title={
                                                        allLocked
                                                            ? 'Xác nhận mở khóa tất cả?'
                                                            : 'Xác nhận khóa tất cả?'
                                                    }
                                                    description={
                                                        allLocked
                                                            ? 'Tất cả đề tài sẽ được mở khóa.'
                                                            : 'Tất cả đề tài sẽ bị khóa.'
                                                    }
                                                    okText="Xác nhận"
                                                    cancelText="Hủy"
                                                    onConfirm={() =>
                                                        handleBulkToggleLock(!allLocked)
                                                    }
                                                    disabled={thesisProjectData.length === 0}
                                                >
                                                    <Button
                                                        disabled={thesisProjectData.length === 0}
                                                        danger={!allLocked}
                                                    >
                                                        {allLocked
                                                            ? 'Mở khóa đề tài'
                                                            : 'Khóa đề tài'}
                                                    </Button>
                                                </Popconfirm>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                <Table
                    rowKey="id"
                    columns={[
                        {
                            title: 'STT',
                            width: 50,
                            align: 'center',
                            render: (_, __, index) => {
                                return <div>{index + 1}</div>
                            },
                        },
                        {
                            title: 'Lớp môn học',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return [
                                    record?.subjectClass?.code,
                                    record?.subjectClass?.name,
                                ].join(' - ')
                            },
                        },
                        {
                            title: 'Học viên bảo vệ',
                            width: 500,
                            align: 'left',
                            fixed: 'left',
                            render: (_, record) => {
                                const registrations = record?.registrations || []

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {registrations.map((x: any, index: number) => (
                                            <div key={index}>
                                                {x.student?.userProfile?.fullname} -{' '}
                                                {x.student?.code || 'N/A'} -{' '}
                                                {x.student?.userProfile?.dateOfBirth
                                                    ? dayjs(
                                                          x.student?.userProfile?.dateOfBirth
                                                      ).format('DD/MM/YYYY')
                                                    : 'N/A'}{' '}
                                                - {x.student?.fixedClass?.name || 'N/A'}
                                            </div>
                                        ))}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Tên đề tài đồ án',
                            width: 250,
                            fixed: 'left',
                            align: 'left',
                            dataIndex: 'title',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        editingValues[record.id]?.title ?? record.title
                                    return (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <TextArea
                                                rows={2}
                                                value={currentValue}
                                                onChange={(e) => {
                                                    handleEditChange(
                                                        record?.id,
                                                        'title',
                                                        e.target.value
                                                    )
                                                }}
                                            />
                                        </div>
                                    )
                                }
                                return record?.title || ''
                            },
                        },
                        {
                            title: 'GVHD1',
                            width: 250,
                            align: 'left',
                            dataIndex: 'supervisor',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        editingValues[record?.id]?.supervisorId ??
                                        record?.supervisorId
                                    return (
                                        <Select
                                            className="w-46"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.lecturer
                                                    ? item.lecturer?.userProfile?.fullname
                                                    : item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn GVHD1"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'supervisor', value)
                                            }
                                        />
                                    )
                                }
                                const data = record?.supervisor
                                const name = data?.lecturer
                                    ? data?.lecturer?.userProfile?.fullname
                                    : data?.name || ''
                                return name
                            },
                        },
                        {
                            title: 'GVHD2',
                            width: 250,
                            align: 'left',
                            dataIndex: 'coSupervisor',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        editingValues[record?.id]?.coSupervisorId ??
                                        record?.coSupervisorId
                                    return (
                                        <Select
                                            className="w-46"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.lecturer
                                                    ? item.lecturer?.userProfile?.fullname
                                                    : item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn GVHD2"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'coSupervisor', value)
                                            }
                                        />
                                    )
                                }
                                const data = record?.coSupervisor
                                const name = data?.lecturer
                                    ? data?.lecturer?.userProfile?.fullname
                                    : data?.name || ''
                                return name
                            },
                        },
                        {
                            title: 'Tiến độ KT 1',
                            dataIndex: 'firstCheckProgress',
                            align: 'center',
                            width: 100,
                            render: (value) => (value ? `${value}%` : ''),
                        },
                        {
                            title: 'Tiến độ KT 2',
                            dataIndex: 'secondCheckProgress',
                            align: 'center',
                            width: 100,
                            render: (value) => (value ? `${value}%` : ''),
                        },
                        {
                            title: 'Được bảo vệ',
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
                            title: 'Chủ tịch',
                            width: 200,
                            align: 'left',
                            dataIndex: 'chairman',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const originalChairmanId = record?.council?.members?.find(
                                        (x: any) => x.role === CouncilRole.CHAIRMAN
                                    )?.expert?.id

                                    const currentValue =
                                        editingValues[record.id]?.chairman ??
                                        originalChairmanId ??
                                        undefined
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles
                                                ?.filter((x: any) => x.eligiblePresident === true)
                                                ?.map((item: any) => ({
                                                    label: item.lecturer
                                                        ? item.lecturer?.userProfile?.fullname
                                                        : item.name,
                                                    value: item.id,
                                                }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn chủ tịch"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'chairman', value)
                                            }
                                        />
                                    )
                                }
                                const data = record?.council?.members.find(
                                    (x: any) => x.role === CouncilRole.CHAIRMAN
                                )
                                const name = data?.expert?.lecturer
                                    ? data?.expert?.lecturer?.userProfile?.fullname
                                    : data?.expert?.name || ''
                                return name
                            },
                        },
                        {
                            title: 'Thư ký',
                            width: 200,
                            align: 'left',
                            dataIndex: 'secretary',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const originalSecretaryId = record?.council?.members?.find(
                                        (x: any) => x.role === CouncilRole.SECRETARY
                                    )?.expert?.id

                                    const currentValue =
                                        editingValues[record.id]?.secretary ??
                                        originalSecretaryId ??
                                        undefined
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles
                                                ?.filter((x: any) => x.eligibleSecretary === true)
                                                ?.map((item: any) => ({
                                                    label: item.lecturer
                                                        ? item.lecturer?.userProfile?.fullname
                                                        : item.name,
                                                    value: item.id,
                                                }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn thư ký"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'secretary', value)
                                            }
                                        />
                                    )
                                }
                                const name =
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.SECRETARY
                                    )?.expert?.lecturer?.userProfile?.fullname ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.SECRETARY
                                    )?.expert?.name ||
                                    ''
                                return name
                            },
                        },
                        {
                            title: 'Phản biện 1',
                            width: 200,
                            align: 'left',
                            dataIndex: 'reviewer1',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const originalReviewer1Id = record?.council?.members?.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_1
                                    )?.expert?.id

                                    const currentValue =
                                        editingValues[record.id]?.reviewer1 ??
                                        originalReviewer1Id ??
                                        undefined
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.lecturer
                                                    ? item.lecturer?.userProfile?.fullname
                                                    : item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn Phản biện 1"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'reviewer1', value)
                                            }
                                        />
                                    )
                                }
                                const name =
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_1
                                    )?.expert?.lecturer?.userProfile?.fullname ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_1
                                    )?.expert?.name ||
                                    ''
                                return name
                            },
                        },
                        {
                            title: 'Phản biện 2',
                            width: 200,
                            align: 'left',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const originalReviewer2Id = record?.council?.members?.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_2
                                    )?.expert?.id

                                    const currentValue =
                                        editingValues[record.id]?.reviewer2 ??
                                        originalReviewer2Id ??
                                        undefined

                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.lecturer
                                                    ? item.lecturer?.userProfile?.fullname
                                                    : item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue}
                                            placeholder="Chọn Phản biện 2"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'reviewer2', value)
                                            }
                                        />
                                    )
                                }
                                const name =
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_2
                                    )?.expert?.lecturer?.userProfile?.fullname ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_2
                                    )?.expert?.name ||
                                    ''
                                return name
                            },
                        },
                        {
                            title: 'Ủy viên',
                            width: 200,
                            align: 'left',
                            dataIndex: 'councilMember',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const originalCouncilMemberId = record?.council?.members?.find(
                                        (x: any) => x.role === CouncilRole.MEMBER
                                    )?.expert?.id
                                    const currentValue =
                                        editingValues[record.id]?.councilMember ??
                                        originalCouncilMemberId ??
                                        undefined
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.MEMBER
                                    )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.lecturer
                                                    ? item.lecturer?.userProfile?.fullname
                                                    : item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn ủy viên"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'councilMember', value)
                                            }
                                        />
                                    )
                                }
                                const name =
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.MEMBER
                                    )?.expert?.lecturer?.userProfile?.fullname ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.MEMBER
                                    )?.expert?.name ||
                                    ''
                                return name
                            },
                        },

                        {
                            title: 'Phòng bảo vệ',
                            width: 150,
                            align: 'left',
                            dataIndex: 'room',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue = record?.roomId || ''
                                    return (
                                        <Select
                                            className="w-28"
                                            options={roomsData?.map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn phòng"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'room', value)
                                            }
                                        />
                                    )
                                }
                                return record?.room?.name || ''
                            },
                        },
                        {
                            title: 'Ngày bảo vệ',
                            width: 150,
                            align: 'left',
                            dataIndex: 'defenseDate',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue = record?.defenseDate
                                        ? dayjs(record?.defenseDate)
                                        : ''
                                    return (
                                        <DatePicker
                                            className="w-28"
                                            value={currentValue || undefined}
                                            placeholder="Chọn ngày"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'defenseDate', value)
                                            }
                                        />
                                    )
                                }
                                return record?.defenseDate
                                    ? dayjs(record?.defenseDate).format('DD/MM/YYYY')
                                    : ''
                            },
                        },
                        {
                            title: 'Thời gian bảo vệ',
                            width: 150,
                            align: 'left',
                            dataIndex: 'defenseSession',
                            render: (_: any, record: any) => {
                                const isEditing = editingRowKeys.includes(record?.id)
                                const formatTime = (
                                    time: string | Date | null | undefined
                                ): string => {
                                    if (!time) return ''
                                    return dayjs.utc(time).format('HH:mm')
                                }

                                if (isEditing) {
                                    const currentValue =
                                        record?.defenseSessionId || record?.defenseSession?.id

                                    return (
                                        <Select
                                            className="w-full"
                                            placeholder="Chọn thời gian"
                                            value={currentValue || undefined}
                                            onChange={(value) =>
                                                handleEditChange(
                                                    record?.id,
                                                    'defenseSessionId',
                                                    value
                                                )
                                            }
                                            options={defenseSessionData?.map((item: any) => ({
                                                label: item?.startTime
                                                    ? formatTime(item.startTime)
                                                    : 'Không xác định',
                                                value: item.id,
                                            }))}
                                        />
                                    )
                                }

                                return formatTime(record?.defenseSession?.startTime)
                            },
                        },
                        {
                            title: 'Điểm bảo vệ',
                            width: 150,
                            align: 'left',
                            dataIndex: 'defenseRecordFinalScore',
                            render: (_, record) => {
                                const scoreValue = record?.defenseRecord?.finalScore

                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        editingValues[record.id]?.defenseRecordFinalScore ??
                                        scoreValue

                                    return (
                                        <InputNumber
                                            className="w-28"
                                            value={
                                                currentValue === null || currentValue === undefined
                                                    ? undefined
                                                    : currentValue
                                            }
                                            placeholder="Nhập điểm"
                                            onChange={(value) =>
                                                handleEditChange(
                                                    record?.id,
                                                    'defenseRecordFinalScore',
                                                    value
                                                )
                                            }
                                        />
                                    )
                                }

                                if (scoreValue === null || scoreValue === undefined) {
                                    return ''
                                }

                                return Number(scoreValue).toFixedSmart(2)
                            },
                        },
                        {
                            title: 'Nhận xét',
                            width: 250,
                            align: 'left',
                            dataIndex: 'defenseRecordComments',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        editingValues[record.id]?.defenseRecordComments ??
                                        record?.defenseRecord?.comments ??
                                        ''
                                    return (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <TextArea
                                                rows={2}
                                                value={currentValue}
                                                onChange={(e) =>
                                                    handleEditChange(
                                                        record?.id,
                                                        'defenseRecordComments',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )
                                }
                                return record?.defenseRecord?.comments || ''
                            },
                        },
                        {
                            title: 'Trạng thái',
                            width: 150,
                            fixed: 'right',
                            align: 'center',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue = editingValues[record.id]?.status
                                    return (
                                        <Select
                                            className="w-28"
                                            options={thesisProjectStatusOptions?.map((item) => ({
                                                label: item.label,
                                                value: item.value,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn trạng thái"
                                            onChange={(value) =>
                                                handleEditChange(record?.id, 'status', value)
                                            }
                                        />
                                    )
                                }
                                const label = getThesisProjectStatusLabel(record?.status)
                                const color = getThesisProjectStatusColor(record?.status)
                                return <Tag color={color}>{label}</Tag>
                            },
                        },
                        {
                            title: 'Cài đặt',
                            width: 60,
                            fixed: 'right',
                            align: 'center',
                            render: (_, record) => (
                                <Button
                                    type="text"
                                    icon={<SquarePen size={18} />}
                                    disabled={record?.isLock}
                                    onClick={() => {
                                        setCurrentProject(record)
                                        setIsMemberModalOpen(true)
                                    }}
                                />
                            ),
                        },
                    ]}
                    data={thesisProjectData}
                    rowSelection={isProjectLecturer ? rowSelection : undefined}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: thesisProjectDataCount,
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
            {isMemberModalOpen && (
                <StudentManagementModal
                    isOpen={isMemberModalOpen}
                    onClose={() => setIsMemberModalOpen(false)}
                    project={currentProject}
                    allStudentsInClass={studentsInSelectedClass}
                    onRefresh={async () => {
                        handleSearch()
                        await refetchThesisProjectData()
                    }}
                />
            )}
        </Row>
    )
}
const StudentManagementModal = ({
    isOpen,
    onClose,
    project,
    allStudentsInClass,
    onRefresh,
}: any) => {
    const [activeTab, setActiveTab] = useState('1')
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    const selectedStudentsData = useMemo(() => {
        return allStudentsInClass.filter((item: any) => selectedStudentIds.includes(item.studentId))
    }, [selectedStudentIds, allStudentsInClass])
    const [gradeValues, setGradeValues] = useState<Record<string, any>>({})
    useEffect(() => {
        if (project && isOpen) {
            setSelectedStudentIds(project.registrations?.map((r: any) => r.studentId) || [])

            const initialGrades: Record<string, any> = {}
            project.registrations?.forEach((reg: any) => {
                const s = reg.studentSubjectScore
                initialGrades[reg.studentId] = {
                    scoreId: s?.id,
                    attendanceScore: s?.attendanceScore,
                    midtermScore: s?.midtermScore,
                    examScore: s?.examScore,
                    finalScore: s?.finalScore ? Number(s.finalScore) : null,
                }
            })
            setGradeValues(initialGrades)
        }
    }, [project, isOpen])

    const handleScoreChange = (studentId: string, field: string, val: number | null) => {
        setGradeValues((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: val },
        }))
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <ignore>
    const gradeColumns = useMemo(
        () => [
            {
                title: 'STT',
                width: 60,
                render: (_: any, __: any, index: number) => index + 1,
            },
            {
                title: 'Họ và tên',

                render: (_: any, reg: any) => (
                    <div>
                        <div className="font-bold">{reg.student?.userProfile?.fullname}</div>
                    </div>
                ),
            },
            {
                title: 'Mã sinh viên',
                width: 100,
                render: (_: any, reg: any) => <div>{reg.student?.code}</div>,
            },
            {
                title: 'Ngày sinh   ',
                width: 100,
                render: (_: any, reg: any) => (
                    <div>
                        {reg.student?.userProfile?.dateOfBirth
                            ? dayjs(reg.student?.userProfile?.dateOfBirth).format('DD/MM/YYYY')
                            : 'N/A'}
                    </div>
                ),
            },
            {
                title: 'Lớp quản lí',
                width: 200,
                render: (_: any, reg: any) => <div>{reg.student?.fixedClass?.name}</div>,
            },
            {
                title: 'Điểm thi',
                align: 'center' as const,
                width: 100,
                render: (_: any, reg: any) => (
                    <InputNumber
                        min={0}
                        max={10}
                        step={0.1}
                        disabled
                        className="font-bold text-blue-600 w-28 text-center [&_input]:text-center"
                        value={gradeValues[reg.studentId]?.finalScore}
                        onChange={(val) => handleScoreChange(reg.studentId, 'finalScore', val)}
                    />
                ),
            },
        ],
        [gradeValues]
    )
    const memberTableColumns = [
        {
            title: 'STT',
            width: 60,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullname',
            render: (_: any, record: any) => record.student?.userProfile?.fullname,
        },
        {
            title: 'Mã sinh viên',
            width: 100,
            dataIndex: 'code',
            render: (_: any, record: any) => record.student?.code,
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dateOfBirth',
            width: 100,
            render: (_: any, record: any) =>
                record.student?.userProfile?.dateOfBirth
                    ? dayjs(record.student?.userProfile?.dateOfBirth).format('DD/MM/YYYY')
                    : 'N/A',
        },
        {
            title: 'Lớp quản lí',
            dataIndex: 'class',
            width: 200,
            render: (_: any, record: any) => record.student?.fixedClass?.name,
        },

        {
            title: 'Thao tác',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <div className="flex items-center justify-center">
                    <CircleMinus
                        size={16}
                        className="text-red-500 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                            setSelectedStudentIds((prev) =>
                                prev.filter((id) => id !== record.studentId)
                            )
                        }}
                    />
                </div>
            ),
        },
    ]
    const handleSaveMembers = async () => {
        try {
            const transactions: any[] = []

            const affectedProjectIds = new Set<string>()
            affectedProjectIds.add(project.id)

            selectedStudentIds.forEach((studentId) => {
                const reg = allStudentsInClass.find((s: any) => s.studentId === studentId)
                    ?.studentThesisRegistration?.[0]
                if (reg?.thesisProjectId) {
                    affectedProjectIds.add(reg.thesisProjectId)
                }
            })

            const oldStudentIds = project.registrations?.map((r: any) => r.studentId) || []
            const removedStudentIds = oldStudentIds.filter(
                (id: string) => !selectedStudentIds.includes(id)
            )

            if (removedStudentIds.length > 0) {
                transactions.push({
                    model: 'StudentThesisRegistration' as const,
                    operation: 'deleteMany' as const,
                    data: {
                        where: {
                            thesisProjectId: project.id,
                            studentId: { in: removedStudentIds },
                        },
                    },
                })
            }
            for (const studentId of selectedStudentIds) {
                const existingReg = allStudentsInClass.find((s: any) => s.studentId === studentId)
                    ?.studentThesisRegistration?.[0]

                if (existingReg) {
                    transactions.push({
                        model: 'StudentThesisRegistration' as const,
                        operation: 'update' as const,
                        data: {
                            where: { id: existingReg.id },
                            data: {
                                thesisProject: { connect: { id: project.id } },
                                status: StudentThesisRegistrationStatus.ACCEPTED,
                            },
                        },
                    })
                } else {
                    const studentScore = allStudentsInClass.find(
                        (s: any) => s.studentId === studentId
                    )
                    transactions.push({
                        model: 'StudentThesisRegistration' as const,
                        operation: 'create' as const,
                        data: {
                            data: {
                                studentId: studentId,
                                studentSubjectScoreId: studentScore?.id,
                                thesisProject: { connect: { id: project.id } },
                                status: StudentThesisRegistrationStatus.ACCEPTED,
                                registeredAt: new Date(),
                            },
                        },
                    })
                }
            }

            transactions.push({
                model: 'ThesisProject' as const,
                operation: 'updateMany' as const,
                data: {
                    where: {
                        id: { in: Array.from(affectedProjectIds) },
                        registrations: {
                            none: {},
                        },
                        deletedAt: null,
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                },
            })
            await sqlTransaction(transactions)

            message.success('Cập nhật thành viên đồ án thành công')
            onClose()
            onRefresh()
        } catch (error) {
            console.error('Lỗi cập nhật nhóm:', error)
            message.error('Có lỗi xảy ra trong quá trình xử lý nhóm.')
        }
    }
    const handleSaveScores = async () => {
        try {
            const transactions: any[] = []

            Object.keys(gradeValues).forEach((studentId) => {
                const grades = gradeValues[studentId]
                if (grades.scoreId) {
                    transactions.push({
                        model: 'StudentSubjectScore' as const,
                        operation: 'update' as const,
                        data: {
                            where: { id: grades.scoreId },
                            data: {
                                attendanceScore: grades.examScore ?? null,
                                midtermScore: grades.examScore ?? null,
                                examScore: grades.examScore ?? null,
                                finalScore: grades.finalScore ?? null,
                            },
                        },
                    })
                }
            })
            if (transactions.length === 0) {
                message.info('Không có thay đổi về điểm số')
                return
            }

            await sqlTransaction(transactions)
            message.success('Cập nhật bảng điểm thành công')
            onClose()
            onRefresh()
        } catch (error) {
            message.error('Lỗi khi lưu điểm số')
        }
    }
    const handleOk = async () => {
        if (activeTab === '1') {
            await handleSaveMembers()
        } else {
            await handleSaveScores()
        }
    }

    return (
        <Modal
            title="Quản lý thành viên và điểm số"
            open={isOpen}
            onOk={handleOk}
            onCancel={onClose}
            width={activeTab === '1' ? 950 : 950}
            okText="Lưu thay đổi"
            destroyOnClose
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="Thành viên nhóm" key="1">
                    <div className="py-4">
                        <Select
                            mode="multiple"
                            className="w-full"
                            value={selectedStudentIds}
                            onChange={setSelectedStudentIds}
                            options={allStudentsInClass.map((item: any) => ({
                                label: `${item.student?.code} - ${item.student?.userProfile?.fullname}`,
                                value: item.studentId,
                            }))}
                        />
                    </div>
                    <div>
                        <div className="mb-2 font-semibold">
                            Danh sách thành viên ({selectedStudentIds.length})
                        </div>
                        <Table
                            dataSource={selectedStudentsData}
                            columns={memberTableColumns}
                            rowKey="studentId"
                            size="small"
                            bordered
                            pagination={
                                selectedStudentsData.length > 5
                                    ? {
                                          pageSize: 5,
                                          showTotal: (total) => `Tổng số ${total} học viên`,
                                          position: ['bottomCenter'],
                                      }
                                    : false
                            }
                            locale={{ emptyText: 'Chưa có thành viên nào được chọn' }}
                        />
                    </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Nhập điểm" key="2">
                    <div className="py-4">
                        <Table
                            dataSource={project?.registrations || []}
                            columns={gradeColumns}
                            pagination={false}
                            rowKey="id"
                            size="small"
                        />
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    )
}

DanhMucDoAn.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
