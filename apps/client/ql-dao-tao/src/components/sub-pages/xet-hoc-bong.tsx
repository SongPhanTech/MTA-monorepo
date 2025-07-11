import { Button, Checkbox, Col, Flex, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import { useStudentTrainingTypeOptions } from '@hooks/studentTrainingType'
import {
    useDeleteManyScholarshipAward,
    useFindManyScholarship,
    useUpsertScholarshipAward,
} from '@workspace/db/hooks'
import { useExportStudentResultSemesterJson } from '@workspace/libs/api/training'
import { BookPlus } from 'lucide-react'
import { useEffect, useMemo } from 'react'

dayjs.locale('vi')

interface XetHocBongProps {
    semesterId: string
}

const XetHocBong = ({ semesterId }: XetHocBongProps) => {
    const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
        useStudentTrainingTypeOptions()

    // TODO: remove any when have openapi schema
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

    const { data: scholarshipData = [] } = useFindManyScholarship({
        include: {
            trainingCourse: true,
        },
        orderBy: { name: 'asc' },
    })

    useEffect(() => {
        if (studentData) {
            const checkedStudentIds = studentData
                .filter((item: any) => item.checked)
                .map((item: any) => item.id)
        }
    }, [studentData])

    const { mutateAsync: upsertScholarshipAward } = useUpsertScholarshipAward()
    const { mutateAsync: deleteManyScholarshipAward } = useDeleteManyScholarshipAward()
    // const handleSaveScholarshipAward = async () => {
    // 	if (!filters.scholarshipId || !semesterId) {
    // 		message.error('Vui lòng chọn học bổng và học kỳ');
    // 		return;
    // 	}

    // 	try {
    // 		// Xác định các sinh viên được thêm mới (selected nhưng không có trong initial)
    // 		const studentsToAdd = selectedRowKeys.filter(
    // 			(id) => !initialSelectedKeys.includes(id)
    // 		);

    // 		// Xác định các sinh viên bị bỏ chọn (có trong initial nhưng không có trong selected)
    // 		const studentsToRemove = initialSelectedKeys.filter(
    // 			(id) => !selectedRowKeys.includes(id)
    // 		);

    // 		// Xử lý thêm học bổng cho sinh viên mới được chọn
    // 		if (studentsToAdd.length > 0) {
    // 			const awardsToAdd = studentsToAdd.map((studentId) => {
    // 				const student = studentData.find((s: any) => s.id === studentId);
    // 				return {
    // 					studentId: studentId as string,
    // 					scholarshipId: filters.scholarshipId as string,
    // 					semesterId: semesterId,
    // 					amount: student?.amount || 0, // Lấy từ dữ liệu sinh viên
    // 					gpaAtAward: student?.gpa || 0, // Lấy từ dữ liệu sinh viên
    // 					priorityRank: student?.rank || 0, // Lấy từ dữ liệu sinh viên
    // 				};
    // 			});

    // 			await Promise.all(
    // 				awardsToAdd.map((award) =>
    // 					upsertScholarshipAward({
    // 						where: {
    // 							studentId_scholarshipId_semesterId: {
    // 								studentId: award.studentId,
    // 								scholarshipId: award.scholarshipId,
    // 								semesterId: award.semesterId,
    // 							},
    // 						},
    // 						create: award,
    // 						update: award,
    // 					})
    // 				)
    // 			);
    // 		}

    // 		// Xử lý xóa học bổng cho sinh viên bị bỏ chọn
    // 		if (studentsToRemove.length > 0) {
    // 			// Giả sử bạn có hook useDeleteScholarshipAward
    // 			await Promise.all(
    // 				studentsToRemove.map((studentId) =>
    // 					deleteManyScholarshipAward({
    // 						where: {
    // 							studentId_scholarshipId_semesterId: {
    // 								studentId: studentId as string,
    // 								scholarshipId: filters.scholarshipId as string,
    // 								semesterId: semesterId,
    // 							},
    // 						},
    // 					})
    // 				)
    // 			);
    // 		}

    // 		// Cập nhật danh sách ban đầu
    // 		setInitialSelectedKeys(selectedRowKeys);
    // 		message.success('Cập nhật học bổng thành công');
    // 		refetch();
    // 	} catch (error) {
    // 		console.error('Lỗi khi lưu học bổng:', error);
    // 		message.error('Có lỗi xảy ra khi lưu học bổng');
    // 	}
    // };

    return (
        <Row gutter={[16, 0]}>
            <Col span={24} className="!p-0">
                <Flex>
                    <Col span={14}>
                        <div className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4">
                            <Row gutter={[16, 0]}>
                                <Col span={24}>
                                    <Row gutter={[16, 16]} align="top" justify="space-between">
                                        <Col span={24}>
                                            <Flex justify="end">
                                                <Button type="primary" className="h-[32px] px-4">
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
                                                render: (scholarships) => (
                                                    <div className="flex flex-col gap-2">
                                                        {Array.isArray(scholarships) &&
                                                            scholarships.map((scholarship) => (
                                                                <div
                                                                    key={scholarship.id}
                                                                    className="flex items-center"
                                                                >
                                                                    <Checkbox className="mr-2" />
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
                                        // rowSelection={{
                                        //     selectedRowKeys,
                                        //     onChange: (selectedKeys) => {
                                        //         setSelectedRowKeys(selectedKeys)
                                        //     },
                                        // }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Col>

                    <Col span={10}>
                        <div className="min-h-[calc(100vh-64px-24px)] bg-white rounded-lg shadow-sm p-4">
                            123
                        </div>
                    </Col>
                </Flex>
            </Col>
        </Row>
    )
}

export default XetHocBong
