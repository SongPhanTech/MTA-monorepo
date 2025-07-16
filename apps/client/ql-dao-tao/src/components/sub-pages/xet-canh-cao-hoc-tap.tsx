import DeleteIcon from '@components/icons/delete'
import { Col, Flex, Row } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
import { useMemo } from 'react'

dayjs.locale('vi')

interface XetCanhCaoHocTapProps {
    semesterId: string
}

const XetCanhCaoHocTap = ({ semesterId }: XetCanhCaoHocTapProps) => {
    // TODO: remove any when have openapi schema
    const { data: students = [] }: any = useExportStudentResultSemesterJson(
        { semesterId: semesterId || '', type: 'academicWarning' },
        { query: { enabled: !!semesterId } },
        queryClient
    )

    const studentData = useMemo(() => {
        if (!students) return []
        if (Array.isArray(students)) return students
        if (students.data && Array.isArray(students.data)) return students.data
        return []
    }, [students])

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12} />
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="courseName"
                        childrenFieldName="students"
                        defaultExpandAll
                        data={studentData}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                dataIndex: ['userProfile', 'code'],
                                width: 120,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: ['userProfile', 'fullname'],
                                width: 160,
                                fixed: 'left',
                            },
                            {
                                title: 'Số TC đăng ký',
                                dataIndex: ['studentSemesterResult', 'registeredCredits'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Số TC đạt',
                                dataIndex: ['studentSemesterResult', 'passedCredits'],
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Tổng TC nợ',
                                dataIndex: ['studentSemesterResult', 'totalFailedCredits'],
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Trung bình hệ 4',
                                dataIndex: ['studentSemesterResult', 'gpaBase4'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Tích lỹ hệ 4',
                                dataIndex: ['studentSemesterResult', 'cumulativeGpaBase4'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Mức CCHT hiện tại',
                                dataIndex: ['studentSemesterResult', 'academicWarningLevel'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Nâng mức CCHT',
                                dataIndex: 'academicWarningSeverity',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    const { id: studentId } = record
                                    return studentId ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                // onClick={() =>
                                                //     onOpenSubjectVersion({
                                                //         subjectId,
                                                //         subjectVersionId,
                                                //     })
                                                // }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                            // popConfirm={{
                                            //     onConfirm: () =>
                                            //         handleDelete(
                                            //             subjectVersionId
                                            //         ),
                                            // }}
                                            />
                                        </Row>
                                    ) : null
                                },
                            },
                        ]}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default XetCanhCaoHocTap
