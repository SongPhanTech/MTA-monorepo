import DeleteIcon from '@components/icons/delete'
import { Col, Flex, Form, Input, Row } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
// import { useExportStudentLearningDisciplineJson } from '@workspace/libs/api/training'
import { Search } from 'lucide-react'

dayjs.locale('vi')

interface XetCanhCaoHocTapProps {
    semesterId: string
}

const XetCanhCaoHocTap = ({ semesterId }: XetCanhCaoHocTapProps) => {
    const fakeData = [
        {
            id: '1',
            code: 'lql_1',
            name: 'lớp quản lý 1',
            children: [
                {
                    id: '2',
                    code: 'sv_1',
                    name: 'sinh viên 1',
                    gpa: 1.2,
                    totalCredit: 15,
                    mccht: 2,
                },
                {
                    id: '3',
                    code: 'sv_2',
                    name: 'sinh viên 2',
                    gpa: 0.98,
                    totalCredit: 15,
                },
            ],
        },
        {
            id: '12',
            code: 'lql_2',
            name: 'lớp quản lý 2',
            children: [
                {
                    id: '22',
                    code: 'sv_3',
                    name: 'sinh viên 3',
                    gpa: 1.02,
                    totalCredit: 15,
                    mccht: 1,
                },
            ],
        },
    ]

    // TODO: remove any when have openapi schema
    const { data: students = [] }: any = useExportStudentResultSemesterJson(
        { semesterId: semesterId || '', type: 'academicWarning' },
        { query: { enabled: !!semesterId } },
        queryClient
    )

    // const studentData = useMemo(() => {
    //     if (!students) return []
    //     if (Array.isArray(students)) return students
    //     if (students.data && Array.isArray(students.data)) return students.data
    //     return []
    // }, [students])

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            // onChange={(e) =>
                                            //     handleFilterChange(
                                            //         'searchText',
                                            //         e.target.value
                                            //     )
                                            // }
                                            className="py-0"
                                            placeholder="Nhập tên học viên, lớp niên chế"
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
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="name"
                        childrenFieldName="children"
                        defaultExpandAll
                        data={fakeData}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: 'name',
                                width: 200,
                            },
                            {
                                title: 'Tổng số tín chỉ đăng ký',
                                dataIndex: 'totalCredit',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'GPA',
                                dataIndex: 'gpa',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Mức CCHT hiện tại',
                                dataIndex: 'mccht',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Nâng mức CCHT',
                                dataIndex: '',
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
