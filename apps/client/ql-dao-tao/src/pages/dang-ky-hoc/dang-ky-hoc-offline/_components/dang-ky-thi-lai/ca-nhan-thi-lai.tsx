import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useStore } from '@tanstack/react-store'
import {
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindUniqueSubjectClass,
} from '@workspace/db/hooks'
import { useOpenSubjectClassReExamStudents } from '@workspace/libs/api/training'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Form, Input, message, Row, Select } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { dangKyThiLaiStore } from '../..'

interface FilterProps {
    searchText: string | null
    trainingCourseId?: string
    fixedClassId?: string
}

export default function CaNhanThiLai() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingCourseId: undefined,
        fixedClassId: undefined,
    })

    const { subjectClassId, studentIds = [] } = useStore(dangKyThiLaiStore)

    const { data: subjectClassData } = useFindUniqueSubjectClass({
        where: {
            id: subjectClassId,
        },
        select: {
            subjectId: true,
        },
    })

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: {
            name: 'asc',
        },
        where: {
            active: true,
            trainingObjectTypeId,
        },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: {
            code: 'asc',
        },
        where: {
            active: true,
            trainingCourseId: filters.trainingCourseId,
        },
    })

    const { data: res, refetch } = useOpenSubjectClassReExamStudents(
        {
            search: filters.searchText || undefined,
            trainingObjectTypeId: trainingObjectTypeId || '',
            subjectVersionId: subjectClassData?.subjectId || '',
            page: currentPage,
            pageSize: numberOfPages,
        },
        { query: { enabled: !!trainingObjectTypeId && !!subjectClassData?.subjectId } }
    )
    // queryKey /api/subject-class/open-subject-class-retake

    const handleSaveStudentClass = async () => {
        try {
            // const allSubjectClassInfo = await sqlTransaction(
            //     selectedSubjectClassRowKeys.map((subjectClassId) => ({
            //         model: 'SubjectClass',
            //         operation: 'findUnique',
            //         data: {
            //             where: { id: subjectClassId },
            //             select: {
            //                 id: true,
            //                 subjectId: true,
            //                 subject: {
            //                     select: {
            //                         // Lấy điểm cao nhất của sinh viên trong các lần đăng ký học cải thiện
            //                         studentSubjectScore: {
            //                             where: {
            //                                 studentId,
            //                             },
            //                             orderBy: {
            //                                 finalScore: 'desc',
            //                             },
            //                             select: {
            //                                 finalScore: true,
            //                                 student: {
            //                                     select: {
            //                                         fixedClass: {
            //                                             select: {
            //                                                 trainingCourse: {
            //                                                     select: {
            //                                                         scoreConverts: true,
            //                                                     },
            //                                                 },
            //                                             },
            //                                         },
            //                                     },
            //                                 },
            //                             },
            //                         },
            //                     },
            //                 },
            //             },
            //         },
            //     }))
            // )
            // if (allSubjectClassInfo.status !== 200) {
            //     throw new Error('Có lỗi xảy ra khi lấy thông tin lớp học phần!')
            // }
            // const res = await sqlTransaction([
            //     {
            //         model: 'StudentSubjectScore',
            //         operation: 'deleteMany',
            //         data: {
            //             where: {
            //                 subjectClass: {
            //                     semesterId,
            //                     trainingObjectTypeId,
            //                     type: $Enums.SubjectClassType.RETAKE,
            //                 },
            //             },
            //         },
            //     },
            //     ...allSubjectClassInfo.data.map((subjectClass: any) => ({
            //         model: 'StudentSubjectScore' as const,
            //         operation: 'create',
            //         data: {
            //             data: {
            //                 studentId,
            //                 subjectClassId: subjectClass.id,
            //                 subjectVersionId: subjectClass.subjectId,
            //                 isImproving:
            //                     subjectClass.subject.studentSubjectScore.length > 0 &&
            //                     subjectClass.subject.studentSubjectScore[0]?.finalScore !== null
            //                         ? subjectClass.subject.studentSubjectScore[0].student?.fixedClass?.trainingCourse?.scoreConverts?.some(
            //                               (sc: ScoreConvert) =>
            //                                   sc?.base10Min <=
            //                                       subjectClass.subject.studentSubjectScore[0]
            //                                           ?.finalScore &&
            //                                   subjectClass.subject.studentSubjectScore[0]
            //                                       ?.finalScore <= sc?.base10Max &&
            //                                   sc?.improvementRegister
            //                           )
            //                         : false,
            //             },
            //         },
            //     })),
            // ])
            // if (res.status !== 200) {
            //     throw new Error('Có lỗi xảy ra khi lưu đăng ký học!')
            // }
            message.success('Lưu đăng ký học lại thành công!')
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'StudentSubjectScore'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'SubjectClass'] })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Có lỗi xảy ra khi gán lớp!')
        }
    }

    const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])
    const countData = useMemo(() => (res?.status === 200 ? res?.data.count : 0), [res])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const handleRowSelection = (ids: string[]) => {
        dangKyThiLaiStore.setState((prev) => ({
            ...prev,
            studentIds: ids,
        }))
    }

    return (
        <Row gutter={[4, 0]}>
            <Col span={6}>
                <Form.Item className="mb-1" name="searchText">
                    <Input
                        id="search"
                        placeholder="Tìm kiếm HV/SV..."
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        style={{ height: 32 }}
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
            <Col span={8}>
                <Select
                    placeholder="Chọn khoá"
                    className="w-full"
                    options={trainingCourseData.map((i) => ({
                        value: i.id,
                        label: i.name,
                    }))}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={(value) => handleFilterChange('trainingCourseId', value)}
                />
            </Col>
            <Col span={8}>
                <Select
                    placeholder="Chọn lớp"
                    className="w-full"
                    dropdownStyle={{
                        width: '400px',
                    }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={fixedClassData.map((i) => ({
                        value: i.id,
                        label: `${i.code} - ${i.name}`,
                    }))}
                    onChange={(value) => handleFilterChange('fixedClassId', value)}
                />
            </Col>
            <Col span={2} className="text-right">
                <Button type="primary" className="h-[32px] px-4" onClick={handleSaveStudentClass}>
                    Lưu
                </Button>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="id"
                    className="mt-0"
                    data={data}
                    onRow={(record) => ({
                        onClick: () => {
                            const isSelected = studentIds.includes(record.id)
                            if (isSelected) {
                                handleRowSelection(studentIds.filter((key) => key !== record.id))
                            } else {
                                handleRowSelection([...studentIds, record.id])
                            }
                        },
                        style: { cursor: 'pointer' },
                        columnWidth: 35,
                    })}
                    rowSelection={{
                        selectedRowKeys: studentIds,
                        onChange: (selectedRowKeys) => {
                            handleRowSelection(selectedRowKeys as string[])
                        },
                        type: 'checkbox',
                        columnWidth: 35,
                    }}
                    columns={[
                        {
                            title: 'TT',
                            width: 35,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã',
                            dataIndex: 'code',
                            align: 'center',
                            width: 100,
                        },
                        {
                            title: 'Tên',
                            align: 'center',
                            width: 200,
                            render: (_, record) => (
                                <p className="text-left">{record?.userProfile?.fullname}</p>
                            ),
                        },
                        {
                            title: 'Lớp',
                            align: 'center',
                            width: 80,
                            render: (_, record) => <p>{record?.fixedClass?.code}</p>,
                        },
                        {
                            title: 'Khoá',
                            align: 'center',
                            width: 80,
                            render: (_, record) => (
                                <p>{record?.fixedClass?.trainingCourse?.name}</p>
                            ),
                        },
                        {
                            title: 'Điểm',
                            align: 'center',
                            width: 50,
                            render: (_, record) => record?.diem_cuoi ?? '-',
                        },
                        {
                            title: 'Hoãn thi',
                            align: 'center',
                            dataIndex: 'hoan_thi',
                            width: 80,
                            render: (value) => <Checkbox checked={value} />,
                        },
                        {
                            title: 'Lý do',
                            align: 'center',
                            width: 80,
                            render: (_, record) => record?.ly_do_hoan_thi,
                        },
                    ]}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: countData,
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
