import { Button, Col, Flex, Row } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useFindManyTrainingCourse } from '@workspace/db/hooks'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

dayjs.locale('vi')

interface XetCanhCaoHocTapProps {
    semesterId: string
}

const XetCanhCaoHocTap = ({ semesterId }: XetCanhCaoHocTapProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { data: students = [] } = useExportStudentResultSemesterJson<any[] | { data: any[] }>(
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

    const { data: academicWarningData } = useFindManyTrainingCourse(
        {
            where: {
                fixedClass: {
                    some: {
                        students: {
                            some: {
                                academicWarning: {
                                    some: {
                                        semesterId,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            select: {
                fixedClass: {
                    include: {
                        students: {
                            include: {
                                userProfile: true,
                                academicWarning: {
                                    include: {
                                        rules: true,
                                    },
                                },
                            },
                        },
                    },
                    where: {
                        students: {
                            some: {
                                academicWarning: {
                                    some: {
                                        semesterId,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!semesterId }
    )

    return (
        <div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end">
                                    <Button type="primary">
                                        <BookPlus />
                                        Thêm học viên
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        {/* <TableCollapse
                            rowKey="id"
                            data={academicWarningData}
                            headerTitleKey="name"
                            childrenFieldName="fixedClass"
                            defaultExpandAll
                            columns={[
                                {
                                    title: 'Thao tác',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (_, record) => {
                                        return record?.id ? (
                                            <Row className="justify-center gap-2">
                                                <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                                                <DeleteIcon
                                                // popConfirm={{
                                                //     onConfirm: () =>
                                                //         handleDeleteStudentAcademicDecision(
                                                //             record?.id
                                                //         ),
                                                // }}
                                                />
                                            </Row>
                                        ) : null
                                    },
                                },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: studentData.length,
                                onChange: setCurrentPage,
                                onShowSizeChange: setNumberOfPages,
                            }}
                        /> */}
                    </Col>
                </Row>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={24}>
                                <Flex justify="end">
                                    <Button type="primary">
                                        <BookPlus />
                                        Duyệt
                                    </Button>
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
                                },
                                {
                                    title: 'Tên sinh viên',
                                    dataIndex: ['userProfile', 'fullname'],
                                    width: 200,
                                },
                            ]}
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

export default XetCanhCaoHocTap
