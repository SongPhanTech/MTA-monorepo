import { FileOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TreeSelect from '@components/commons/tree-select'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { CouncilRole, SubjectVersionType, ThesisType } from '@workspace/db'
import {
    useCountStudentSubjectScore,
    useCountThesisProject,
    useFindManyDefenseSession,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManySemester,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyThesisProject,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyRoom,
    useFindManyExpertProfile,
} from '@workspace/db/hooks'
import { Button, Col, DatePicker, Form, message, Modal, Row, Tag, Input } from 'antd'
import { sqlTransaction } from '@workspace/libs/api/model'
import dayjs from 'dayjs'
import { SquarePen } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useMemo, useState } from 'react'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'

interface DoAnForm {
    subjectClassId: string
}
const { TextArea } = Input

export default function DanhMucDoAn() {
    const [form] = Form.useForm<DoAnForm>()
    const [searchParams, setSearchParams] = useState<Partial<DoAnForm>>({})
    const [isSearched, setIsSearched] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
        useThesisProjectStatusOptions()
    const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
    const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }
    const where = useMemo(() => {
        if (!isSearched) return { id: { in: [] } }
        const filter: any = {
            thesisType: ThesisType.PROJECT,
        }
        if (searchParams.subjectClassId) {
            filter.subjectClassId = searchParams.subjectClassId
        }
        return filter
    }, [isSearched, searchParams])
    const { data: subjectClassData = [] } = useFindManySubjectClass({
        where: {
            subject: {
                type: SubjectVersionType.Project,
            },
        },
    })
    const { data: thesisProjectData = [] } = useFindManyThesisProject({
        where,
        include: {
            subjectClass: {
                include: {
                    subject: true,
                },
            },
            supervisor: {
                include: {
                    lecturer: {
                        include: {
                            userProfile: true,
                        },
                    },
                },
            },
            coSupervisor: {
                include: {
                    lecturer: {
                        include: {
                            userProfile: true,
                        },
                    },
                },
            },
            registrations: {
                include: {
                    student: {
                        include: {
                            userProfile: true,
                        },
                    },
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
    const { data: defenseSessionData = [] } = useFindManyDefenseSession()
    const { data: roomsData = [] } = useFindManyRoom()
    const { data: expertProfiles = [] } = useFindManyExpertProfile({
        where: {
            projectExpert: true,
        },
    })
    const { data: thesisProjectDataCount = 0 } = useCountThesisProject({
        where: where,
    })
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
        console.log(values)
        setSearchParams(values)
        setIsSearched(true)
        setCurrentPage(1)
    }

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
                member:
                    record.council?.members.find((x: any) => x.role === CouncilRole.MEMBER)?.expert
                        ?.id || '',
                status: record.status || '',
            }
        })
        console.log('initialEditingValues', initialEditingValues)
        setEditingRowKeys(newEditingRowKeys)
        setEditingValues(initialEditingValues)
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
                                    options={subjectClassData?.map((item) => ({
                                        label: `${item.code} - ${item.name}`,
                                        value: item.id,
                                    }))}
                                    placeholder="Chọn lớp môn học"
                                />
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button type="primary">Tạo dữ liệu mẫu</Button>
                                    <Button type="primary" onClick={handleSearch}>
                                        Xem kết quả
                                    </Button>
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
                                            <Button type="primary" className="ml-2">
                                                Lưu thay đổi
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="default"
                                            className="ml-2"
                                            onClick={handleActivateEdit}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                </div>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                <Table
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
                                return (
                                    `${record?.subjectClass?.code} - ${record?.subjectClass?.name}` ||
                                    ''
                                )
                            },
                        },
                        {
                            title: 'Học viên bảo vệ',
                            width: 200,
                            align: 'left',
                            fixed: 'left',
                            render: (_, record) => {
                                const registrations = record?.registrations || []

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {registrations.map((x: any, index: number) => (
                                            <div key={index}>
                                                {x.student?.userProfile?.fullname}
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
                                    const currentValue = record?.title
                                    return (
                                        <div
                                            onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                                        >
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
                                    const currentValue = record?.supervisorId
                                    return (
                                        <Select
                                            className="w-46"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.name,
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
                                return record?.supervisor?.lecturer?.userProfile?.fullname || ''
                            },
                        },
                        {
                            title: 'GVHD2',
                            width: 250,
                            align: 'left',
                            dataIndex: 'coSupervisor',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue = record?.supervisorId
                                    return (
                                        <Select
                                            className="w-46"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.name,
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
                                return record?.coSupervisor?.lecturer?.userProfile?.fullname || ''
                            },
                        },
                        {
                            title: 'Chủ tịch',
                            width: 200,
                            align: 'left',
                            dataIndex: 'chairman',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue =
                                        record?.council?.members.find(
                                            (x: any) => x.role === CouncilRole.CHAIRMAN
                                        )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles
                                                ?.filter((x: any) => x.eligiblePresident === true)
                                                ?.map((item: any) => ({
                                                    label: item.name,
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
                                const name =
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.CHAIRMAN
                                    )?.expert?.name ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.CHAIRMAN
                                    )?.expert?.lecturer.userProfile.fullname ||
                                    ''
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
                                    const currentValue =
                                        record?.council?.members.find(
                                            (x: any) => x.role === CouncilRole.SECRETARY
                                        )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles
                                                ?.filter((x: any) => x.eligibleSecretary === true)
                                                ?.map((item: any) => ({
                                                    label: item.name,
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
                                    )?.expert?.name ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.SECRETARY
                                    )?.expert?.lecturer.userProfile.fullname ||
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
                                    const currentValue =
                                        record?.council?.members.find(
                                            (x: any) => x.role === CouncilRole.REVIEWER_1
                                        )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.name,
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
                                    )?.expert?.name ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_1
                                    )?.expert?.lecturer.userProfile.fullname ||
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
                                    const currentValue =
                                        record?.council?.members.find(
                                            (x: any) => x.role === CouncilRole.REVIEWER_2
                                        )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
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
                                    )?.expert?.name ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.REVIEWER_2
                                    )?.expert?.lecturer.userProfile.fullname ||
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
                                    const currentValue =
                                        record?.council?.members.find(
                                            (x: any) => x.role === CouncilRole.MEMBER
                                        )?.expert?.id || ''
                                    return (
                                        <Select
                                            className="w-40"
                                            options={expertProfiles?.map((item: any) => ({
                                                label: item.name,
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
                                    )?.expert?.name ||
                                    record?.council?.members.find(
                                        (x: any) => x.role === CouncilRole.MEMBER
                                    )?.expert?.lecturer.userProfile.fullname ||
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
                            title: 'Ca bảo vệ',
                            width: 150,
                            align: 'left',
                            dataIndex: 'defenseSession',
                            render: (_, record) => {
                                if (editingRowKeys.includes(record?.id)) {
                                    const currentValue = record?.defenseSessionId || ''
                                    return (
                                        <Select
                                            className="w-28"
                                            options={defenseSessionData?.map((item) => ({
                                                label: item?.startTime
                                                    ? dayjs(
                                                          record?.defenseSession?.startTime
                                                      ).format('HH:mm')
                                                    : '',
                                                value: item.id,
                                            }))}
                                            value={currentValue || undefined}
                                            placeholder="Chọn ca"
                                            onChange={(value) =>
                                                handleEditChange(
                                                    record?.id,
                                                    'defenseSession',
                                                    value
                                                )
                                            }
                                        />
                                    )
                                }

                                return record?.defenseSession?.startTime
                                    ? dayjs(record?.defenseSession?.startTime).format('HH:mm')
                                    : ''
                            },
                        },
                        {
                            title: 'Điểm bảo vệ',
                            width: 100,
                            align: 'left',
                            render: (_, record) => {
                                return record?.defenseRecord
                                    ? Number(record?.defenseRecord?.finalScore).toFixedSmart(2)
                                    : ''
                            },
                        },
                        {
                            title: 'Nhận xét',
                            width: 100,
                            align: 'left',
                            render: (_, record) => {
                                return record?.defenseRecord?.comments || ''
                            },
                        },
                        {
                            title: 'Trạng thái',
                            width: 100,
                            fixed: 'right',
                            align: 'center',
                            render: (_, record) => {
                                const label = getThesisProjectStatusLabel(record?.status)
                                const color = getThesisProjectStatusColor(record?.status)
                                return <Tag color={color}>{label}</Tag>
                            },
                        },
                    ]}
                    data={thesisProjectData}
                    rowSelection={rowSelection}
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
        </Row>
    )
}
DanhMucDoAn.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
