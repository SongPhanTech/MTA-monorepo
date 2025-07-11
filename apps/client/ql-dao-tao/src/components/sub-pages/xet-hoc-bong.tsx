import { Button, Checkbox, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useStudentTrainingTypeOptions } from '@hooks/studentTrainingType'
import { useUpsertScholarshipAward } from '@workspace/db/hooks'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
import { BookPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

dayjs.locale('vi')

interface XetHocBongProps {
    semesterId: string
}

interface SelectedStudent {
    id: string
    code: string
    fullname: string
    scholarshipId: string
    scholarshipName: string
    amount: number
    gpaAtAward: number
    priorityRank: number
}

const XetHocBong = ({ semesterId }: XetHocBongProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
        useStudentTrainingTypeOptions()

    const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
    const [transferDataDisabled, setTransferDataDisabled] = useState(true)
    const [rightPanelData, setRightPanelData] = useState<any[]>([])

    const { data: students = [], refetch } = useExportStudentResultSemesterJson(
        {
            semesterId: semesterId || '',
            type: 'scholarship',
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

    // Handle scholarship checkbox change
    const handleScholarshipCheckboxChange = (
        studentId: string,
        scholarship: any,
        checked: boolean,
        studentInfo: any
    ) => {
        if (checked) {
            setSelectedStudents((prev) => [
                ...prev,
                {
                    id: studentId,
                    code: studentInfo.userProfile.code,
                    fullname: studentInfo.userProfile.fullname,
                    scholarshipId: scholarship.id,
                    scholarshipName: scholarship.name,
                    amount: scholarship.baseAmount * scholarship.multiplier || 0,
                    gpaAtAward: studentInfo.studentSemesterResult.gpaBase4 || 0,
                    priorityRank: scholarship.order || 0,
                },
            ])
        } else {
            setSelectedStudents((prev) =>
                prev.filter((s) => !(s.id === studentId && s.scholarshipId === scholarship.id))
            )
        }
    }

    // Update transfer button disabled state
    useEffect(() => {
        setTransferDataDisabled(selectedStudents.length === 0)
    }, [selectedStudents])

    // Handle transfer data button click
    const handleTransferData = () => {
        setRightPanelData(selectedStudents)
        message.success(`Đã chuyển ${selectedStudents.length} sinh viên`)
    }

    const { mutateAsync: upsertScholarshipAward } = useUpsertScholarshipAward()

    // Handle save button click
    const handleSaveScholarshipAward = async () => {
        if (!semesterId) {
            message.error('Vui lòng chọn học kỳ')
            return
        }

        if (rightPanelData.length === 0) {
            message.error('Không có dữ liệu để lưu')
            return
        }

        try {
            const awardsToAdd = rightPanelData.map((student) => ({
                studentId: student.id,
                scholarshipId: student.scholarshipId,
                semesterId: semesterId,
                amount: student.amount,
                gpaAtAward: student.gpaAtAward,
                priorityRank: student.priorityRank,
            }))

            await Promise.all(
                awardsToAdd.map((award) =>
                    upsertScholarshipAward({
                        where: {
                            studentId_scholarshipId_semesterId: {
                                studentId: award.studentId,
                                scholarshipId: award.scholarshipId,
                                semesterId: award.semesterId,
                            },
                        },
                        create: award,
                        update: award,
                    })
                )
            )

            message.success('Lưu học bổng thành công')
            setSelectedStudents([])
            setRightPanelData([])
            refetch()
        } catch (error) {
            console.error('Lỗi khi lưu học bổng:', error)
            message.error('Có lỗi xảy ra khi lưu học bổng')
        }
    }

    return (
        <Row gutter={[16, 0]} className="mt-4">
            <Col span={24} className="!p-0">
                <Flex>
                    <Col span={14}>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <Row gutter={[16, 0]}>
                                <Col span={24}>
                                    <Row gutter={[16, 16]} align="top" justify="space-between">
                                        <Col span={24}>
                                            <Flex justify="end">
                                                <Button
                                                    type="primary"
                                                    className="h-[32px] px-4"
                                                    onClick={handleTransferData}
                                                    disabled={transferDataDisabled}
                                                >
                                                    <BookPlus />
                                                    Chuyển dữ liệu
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
                                                title: 'Xếp loại rèn luyện',
                                                dataIndex: [
                                                    'studentSemesterResult',
                                                    'studentTrainingType',
                                                ],
                                                width: 120,
                                                align: 'center',
                                                render: (value) => (
                                                    <Tag color={getStudentTrainingTypeColor(value)}>
                                                        {getStudentTrainingTypeLabel(value)}
                                                    </Tag>
                                                ),
                                            },
                                            {
                                                title: 'Học bổng',
                                                dataIndex: ['scholarship'],
                                                width: 200,
                                                fixed: 'right',
                                                render: (scholarships, record) => (
                                                    <div className="flex flex-col gap-2">
                                                        {Array.isArray(scholarships) &&
                                                            scholarships.map((scholarship) => (
                                                                <div
                                                                    key={scholarship.id}
                                                                    className="flex items-center"
                                                                >
                                                                    <Checkbox
                                                                        className="mr-2"
                                                                        onChange={(e) =>
                                                                            handleScholarshipCheckboxChange(
                                                                                record.id,
                                                                                scholarship,
                                                                                e.target.checked,
                                                                                record
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="text-gray-800">
                                                                        {scholarship.name}{' '}
                                                                        <span className="text-gray-500">
                                                                            (Order:{' '}
                                                                            {scholarship.order})
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ),
                                            },
                                        ]}
                                        data={studentData}
                                        pagination={{
                                            pageSize: studentData.length,
                                            hideOnSinglePage: true,
                                        }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Col>

                    <Col span={10}>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <Flex vertical gap={16}>
                                <Flex justify="space-between" align="center">
                                    <h3 className="font-medium">Danh sách sinh viên được chọn</h3>
                                    <Button
                                        type="primary"
                                        onClick={handleSaveScholarshipAward}
                                        disabled={rightPanelData.length === 0}
                                    >
                                        Lưu
                                    </Button>
                                </Flex>

                                {rightPanelData.length > 0 ? (
                                    <Table
                                        rowKey="id"
                                        data={rightPanelData}
                                        columns={[
                                            {
                                                title: 'STT',
                                                width: 50,
                                                align: 'center',
                                                fixed: 'left',
                                                render: (_, __, index) =>
                                                    index +
                                                    1 +
                                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                            },
                                            {
                                                title: 'Mã sinh viên',
                                                dataIndex: ['code'],
                                                width: 120,
                                                align: 'center',
                                                fixed: 'left',
                                            },
                                            {
                                                title: 'Tên sinh viên',
                                                dataIndex: ['fullname'],
                                                width: 200,
                                                fixed: 'left',
                                            },
                                            {
                                                title: 'Trung bình hệ 4',
                                                dataIndex: ['gpaAtAward'],
                                                width: 150,
                                                align: 'center',
                                            },
                                            {
                                                title: 'Xếp hạng',
                                                dataIndex: ['priorityRank'],
                                                width: 150,
                                                align: 'center',
                                            },
                                            {
                                                title: 'Học bổng',
                                                dataIndex: ['scholarshipName'],
                                                width: 150,
                                                align: 'center',
                                                fixed: 'right',
                                            },
                                        ]}
                                        pagination={false}
                                    />
                                ) : (
                                    <div className="text-gray-400 text-center py-8">
                                        Chưa có dữ liệu được chọn
                                    </div>
                                )}
                            </Flex>
                        </div>
                    </Col>
                </Flex>
            </Col>
        </Row>
    )
}

export default XetHocBong
