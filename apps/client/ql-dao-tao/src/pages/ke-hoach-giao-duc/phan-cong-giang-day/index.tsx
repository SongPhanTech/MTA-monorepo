import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useUpdateSubjectClass,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManyLecturer,
    useFindManyCurriculumVersion,
    useFindManySemester,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import type {
    CurriculumVersion,
    SubjectClass,
    TrainingCourse,
    TrainingMajor,
    TrainingObjectType,
} from '@workspace/db'
import { Search } from 'lucide-react'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    message,
} from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons'
import { useExamTypeOptions } from '@hooks/examType'
// const { Option } = Select;
interface FilterProps {
    searchText: string | undefined
    trainingCourseId: string | null
    semesterStartId: string | null
    trainingMajorId: string | null
}

export default function TeachingAssignment() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingCourseId: null,
        semesterStartId: null,
        trainingMajorId: null,
    })

    const [isEdit, setIsEdit] = useState(false);
    const [dataSubmit, setDataSubmit] = useState<SubjectClass[]>([])
    const { getExamTypeLabel } = useExamTypeOptions()
    const { data = [], refetch } = useFindManySubjectClass({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
            semester: {
                id: filters.semesterStartId || undefined,
                trainingCoursesStart: {
                    some: {
                        id: filters.trainingCourseId || undefined,
                    },
                },
            },
            subject: {
                managementOrganization: {
                    trainingMajors: {
                        some: {
                            id: filters.trainingMajorId || undefined,
                        },
                    },
                },
            },
        },
        include: {
            semester: true,
            mainLecturer: true,
            subject: {
                include: {
                    managementOrganization: true,
                },
            },
            extraLecturer: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectClass({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
            semester: {
                id: filters.semesterStartId || undefined,
                trainingCoursesStart: {
                    some: {
                        id: filters.trainingCourseId || undefined,
                    },
                },
            },
            subject: {
                managementOrganization: {
                    trainingMajors: {
                        some: {
                            id: filters.trainingMajorId || undefined,
                        },
                    },
                },
            },
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateTrainingCourse } = useUpdateSubjectClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: semesterData = [], refetch: refetchSemesters } =
        useFindManySemester({
            where: {},
            include: {
                schoolYear: true,
            },
        })

    const { data: trainingMajorData = [], refetch: refetchManyTrainingField } =
        useFindManyTrainingMajor()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: lecturerData = [], refetch: refetchLecturer } =
        useFindManyLecturer({
            include: {
                userProfile: true,
            },
        })
    async function handleStatusChange(
           
        ) {
            try {
                showSpinner()
                console.log(dataSubmit)
                // await updateTrainingCourse({
                   
                //     data: {
                //         status: newStatus,
                //     },
                // })
            } catch (error) {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            }
            hideSpinner()
        }

        const handleChangeLecturer=(record:SubjectClass,value:string|undefined)=>{
            if(value){
                const itemChange=lecturerData.find(i=>i?.id===value);
                setDataSubmit(prev =>
                    prev.map(subjectClass =>
                        subjectClass.id === record.id ? { ...subjectClass, lecturerId: value ,mainLecturer: itemChange} : subjectClass
                    )
                );
            }else {
                const result=dataSubmit.filter(i=>i?.id!==record.id);
                    setDataSubmit(prev =>
                         prev.map(subjectClass =>
                        subjectClass.id === record.id ? { ...subjectClass, lecturerId: null ,mainLecturer: null} : subjectClass
                    )
                    );
            }
        }

        const handleChangeExtraLecturer=(record:SubjectClass,value:string|undefined)=>{
            if(value){
                const itemChange=lecturerData.find(i=>i?.id===value);
                setDataSubmit(prev =>
                    prev.map(subjectClass =>
                        subjectClass.id === record.id ? { ...subjectClass, extraLecturerId: value ,extraLecturer: itemChange} : subjectClass
                    )
                );
            }else {
                setDataSubmit(prev =>
                        prev.map(subjectClass =>
                    subjectClass.id === record.id ? { ...subjectClass, extraLecturerId: null ,extraLecturer: null} : subjectClass
                )
                );
            }
        }

        const handleCancel=()=>{
            setIsEdit(false);
            setDataSubmit([...data])
        }

         // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
         useEffect(() => {
            if (data) {
                setDataSubmit([...data])
            }
        }, [data?.length])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'searchText',
                                            e.target.value
                                        )
                                    }
                                    style={{ width: '100%' }}
                                    placeholder="Tìm kiếm"
                                    allowClear
                                />
                        </Col>
                        <Col span={4}>
                                <Select
                                    placeholder="Chọn kỳ học bắt đầu"
                                    options={semesterData.map((i) => {
                                        return {
                                            value: i.id,
                                            label: `${i.name} năm ${i.schoolYear.name}`,
                                        }
                                    })}
                                    style={{ width: '100%' }}
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'semesterStartId',
                                            val
                                        )
                                    }
                                />
                        </Col>
                        <Col span={4}>
                                <Select
                                    placeholder="Chọn khóa"
                                    options={trainingCourseData.map(
                                        (i: TrainingCourse) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        }
                                    )}
                                    style={{ width: '100%' }}
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'trainingCourseId',
                                            val
                                        )
                                    }
                                    allowClear
                                />
                        </Col>
                        <Col span={4}>
                                <Select
                                    placeholder="Chọn chuyên ngành"
                                    options={trainingMajorData.map(
                                        (i: TrainingMajor) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        }
                                    )}
                                    style={{ width: '100%' }}
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'trainingMajorId',
                                            val
                                        )
                                    }
                                />
                        </Col>

                        <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    //TODO: handle export
                                    type="primary"
                                >
                                    <EditIcon stroke="white" />
                                    Nhập
                                </Button>
                                {isEdit ? (
                                    <>
                                        <Button
                                            //TODO: handle save
                                            onClick={() => handleStatusChange()}
                                            type="primary"
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            //TODO: handle cancel
                                            onClick={() => handleCancel()}
                                            type="primary"
                                        >
                                            Hủy
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setIsEdit(true)}
                                        //TODO: handle save
                                        type="primary"
                                    >
                                        Sửa
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'PCGD',
                                align: 'center',
                                width: 100,
                                render: (value: boolean) => (
                                    <Checkbox checked={!!value} />
                                ),
                            },
                            {
                                title: 'Mã lớp môn học',
                                dataIndex: 'code',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'subject',
                                width: 120,
                                align: 'center',
                                render: (value) =>
                                    value?.credit ? value?.credit : '',
                            },
                            {
                                title: 'Giảng viên 1',
                                width: 200,
                                align: 'center',
                                render: (record) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={lecturerData.map((i) => {
                                            return {
                                                value: i?.id,
                                                label: `${i.userProfile?.code} - ${i?.userProfile?.fullname}`,
                                            }
                                        })}
                                        value={record.lecturerId}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue)=>handleChangeLecturer(record,selectedValue)}
                                        disabled={!isEdit}
                                    />
                                ),
                            },
                            {
                                title: 'Giảng viên 2',
                                width: 200,
                                align: 'center',
                                render: (record) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={lecturerData.map((i) => {
                                            return {
                                                value: i?.id,
                                                label: `${i.userProfile?.code} - ${i?.userProfile?.fullname}`,
                                            }
                                        })}
                                        value={record.extraLecturerId || undefined}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue)=>handleChangeExtraLecturer(record,selectedValue)}
                                        disabled={!isEdit}
                                    />
                                ),
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'subject',
                                align: 'center',
                                width: 120,
                                render: (value) =>
                                    getExamTypeLabel(value?.examType) || '',
                            },
                            {
                                title: 'Kíp học',
                                dataIndex: 'kipHoc',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Địa điểm',
                                dataIndex: 'diaDiem',
                                width: 100,
                            },
                            {
                                title: 'Giảng viên nhập điểm',
                                dataIndex: 'gvNhapDiem',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Phòng học',
                                dataIndex: 'phongHoc',
                                width: 100,
                            },
                            {
                                title: 'Hạn PCGD',
                                dataIndex: 'hanPCGD',
                                width: 100,
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'subject',
                                width: 200,
                                render: (value) =>
                                    value?.managementOrganization?.name
                                        ? value?.managementOrganization?.name
                                        : '',
                            },
                            {
                                title: 'Điểm bằng nhau',
                                dataIndex: 'subject',
                                width: 150,
                                align: 'center',
                                render: (value) => (
                                    <Checkbox
                                        checked={value.subjectEquivalentType}
                                        disabled
                                    />
                                ),
                            },
                            {
                                title: 'Lớp liên kết',
                                dataIndex: 'lopLienKet',
                                width: 150,
                            },
                        ]}
                        data={dataSubmit}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TeachingAssignment.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
