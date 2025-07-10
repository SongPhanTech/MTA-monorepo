import { Button, Col, Flex, Form, Row, Select, Tag } from 'antd'
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
import { useExportStudentScholarshipJson } from '@workspace/libs/api/training'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

dayjs.locale('vi')

interface XetHocBongProps {
    semesterId: string
}

interface FilterProps {
    scholarshipId: string | null
}

const XetHocBong = ({ semesterId }: XetHocBongProps) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [initialSelectedKeys, setInitialSelectedKeys] = useState<React.Key[]>([])
    const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
        useStudentTrainingTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        scholarshipId: '',
    })

    // TODO: remove any when have openapi schema
    const { data: students = [], refetch }: any = useExportStudentScholarshipJson(
        {
            semesterId: semesterId || '',
            scholarshipId: filters?.scholarshipId || '',
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

            setSelectedRowKeys(checkedStudentIds)
            setInitialSelectedKeys(checkedStudentIds)
        }
    }, [studentData])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

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
                                        <Col span={12}>
                                            <Flex>
                                                <Col span={10}>
                                                    <Form.Item
                                                        className="mb-0"
                                                        name="trainingObjectId"
                                                    >
                                                        <Select
                                                            placeholder="Chọn học bổng"
                                                            options={scholarshipData.map(
                                                                (i: any) => ({
                                                                    value: i.id,
                                                                    label: `${i.name} - ${i?.trainingCourse?.name}`,
                                                                })
                                                            )}
                                                            onChange={(val) =>
                                                                handleFilterChange(
                                                                    'scholarshipId',
                                                                    val
                                                                )
                                                            }
                                                            style={{ width: '350px' }}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Flex>
                                        </Col>
                                        <Col span={6}>
                                            <Flex justify="end">
                                                <Button
                                                    type="primary"
                                                    className="h-[32px] px-4"
                                                    // onClick={handleSaveScholarshipAward}
                                                    disabled={
                                                        !semesterId || selectedRowKeys.length <= 0
                                                    }
                                                >
                                                    <BookPlus />
                                                    Lưu
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
                                                width: 200,
                                            },
                                            {
                                                title: 'Chuyên ngành',
                                                dataIndex: 'chuyenNganh',
                                                width: 150,
                                                align: 'center',
                                            },
                                            {
                                                title: 'Đối tượng đào tạo',
                                                dataIndex: 'doiTuong',
                                                width: 120,
                                                align: 'center',
                                            },
                                            {
                                                title: 'Xếp loại học tập',
                                                dataIndex: 'xepLoaiHocTap',
                                                width: 120,
                                                align: 'center',
                                            },
                                            {
                                                title: 'Xếp loại rèn luyện',
                                                dataIndex: 'xepLoaiRenLuyen',
                                                width: 120,
                                                align: 'center',
                                                render: (value) => (
                                                    <Tag color={getStudentTrainingTypeColor(value)}>
                                                        {getStudentTrainingTypeLabel(value)}
                                                    </Tag>
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
