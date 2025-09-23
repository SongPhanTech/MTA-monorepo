import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import FilterSubjectClass from '@components/filter/filter-lop-mon-hoc'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import DefaultLayout from '@layouts/default-layout'
import type { ExamType, SubjectClass } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { CalendarPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'

// const { Option } = Select;
interface FilterProps {
    schoolYearId: string | null //Năm học
    semesterId: string | null //Học kỳ
    KhoaId: string | null //Khoa
    BoMonId: string | null //Bộ môn
    trainingObjectId: string | null //Đối tượng đào tạo
    examTypeId: string | null //Hình thức thi
    LectureIds: string[] //Giảng viên
    searchText: string | null
    trainingObjectTypeId: string | null
    subjectClassId: string | null
    fixedClassIds: string[]
    examDateRange?: [string, string] | null // Khoảng thời gian thi
}

export default function ClassSubject() {
    const { can } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        subjectClassId: null,
        schoolYearId: null,
        KhoaId: null,
        BoMonId: null,
        trainingObjectId: null,
        examTypeId: null,
        LectureIds: [],
        fixedClassIds: [],
        examDateRange: undefined, // Khoảng thời gian thi
    })
    const { getExamTypeLabel } = useExamTypeOptions()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const handleNavigate = (id: string) => {
        router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC}?subjectId=${id}`)
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    //#endregion

    //#region Mới
    /* Mới */
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
            ...(filters.subjectClassId ? { id: filters.subjectClassId } : {}),
            trainingObjectTypeId,
            ...(filters.LectureIds.length > 0
                ? {
                      OR: filters.LectureIds.map((id) => ({
                          mainLecturer: { id },
                      })),
                  }
                : {}),
            ...(filters.BoMonId
                ? {
                      subject: {
                          managementOrganizationId: filters.BoMonId,
                      },
                  }
                : {}),
            ...(filters.examDateRange
                ? {
                      examDate: {
                          gte: dayjs(filters.examDateRange?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examDateRange?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            deletedAt: null,
        },
        include: {
            subject: {
                include: {
                    managementOrganization: true,
                },
            },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
            subjectClassStudent: {
                include: {
                    student: { include: { userProfile: true } },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountSubjectClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            deletedAt: null,
        },
    })
    const handleFilterApply = (newFilters: Partial<FilterProps>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters }
            debouncedRefetch()
            return updatedFilters
        })
    }
    /* Mới */
    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    const handleCheckExamDate = () => {
        dataTable.forEach((item: SubjectClass) => {
            if (item.examDate) {
                if (!item.examScoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const examScoreDeadline = new Date(examDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                    item.examScoreDeadline = examScoreDeadline
                    if (item.examScoreDeadline <= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else if (examDate >= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: {
                            examScoreDeadline,
                            isLockExamScore: item.isLockExamScore,
                        },
                    }).catch((error) => {
                        message.error('Error updating examScoreDeadline for item:', error)
                    })
                } else {
                    const examDate = new Date(item.examDate)
                    if (item.examScoreDeadline < new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else if (examDate >= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockExamScore: item.isLockExamScore },
                    }).catch((error) => {
                        message.error('Error updating examScoreDeadline for item:', error)
                    })
                }
                // Kiểm tra và cập nhật scoreDeadline
                if (!item.scoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const scoreDeadline = new Date(examDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                    item.scoreDeadline = scoreDeadline
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { scoreDeadline, isLockScore: item.isLockScore },
                    }).catch((error) => {
                        message.error('Error updating scoreDeadline for item:', error)
                    })
                } else {
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockScore: item.isLockScore },
                    }).catch((error) => {
                        message.error('Error updating scoreDeadline for item:', error)
                    })
                }
            }
        })
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        handleCheckExamDate()
    }, [])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Nhập tên lớp..."
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
                                    <Form.Item
                                        className="mb-0"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <TreeSelectSemester
                                            filterTimeNow={true}
                                            onChange={(val) =>
                                                handleFilterChange('semesterId', val)
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingCourseId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Lớp MH"
                                            options={dataTable.map((i) => ({
                                                value: i.id,
                                                label: i.name,
                                            }))}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingObjectTypeId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4} className="flex">
                                    <FilterSubjectClass
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        onApply={handleFilterApply}
                                    />
                                </Col>
                            </Flex>
                        </Col>

                        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        rowSelection={rowSelection}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên lớp',
                                dataIndex: 'name',
                                width: 150,
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'tenMonHoc',
                                width: 180,
                                render: (text, record) => record.subject?.name || text,
                            },
                            {
                                title: 'Số TC',
                                dataIndex: 'stc',
                                width: 80,
                                align: 'center',
                                render: (text, record) => record.subject?.credit || text,
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: ['subject', 'examType'],
                                width: 150,
                                align: 'center',
                                filterSearch: true,
                                render: (record: ExamType) => getExamTypeLabel(record),
                            },
                            {
                                title: 'Ngày bắt đầu',
                                dataIndex: 'startDate',
                                width: 150,
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                dataIndex: 'endDate',
                                width: 150,
                                align: 'center',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                width: 150,
                                align: 'center',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn ĐT',
                                dataIndex: 'ngayDot',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Giảng viên',
                                dataIndex: 'tenMonHoc',
                                width: 180,
                                align: 'center',
                                render: (text, record) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : 'Chưa có giảng viên chính'
                                    const extraLecturer = record.extraLecturer
                                        ? `, ${record.extraLecturer.userProfile.lastName} ${record.extraLecturer.userProfile.firstName}`
                                        : ''
                                    return (
                                        <span>
                                            {mainLecturer}
                                            {extraLecturer}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên NĐ',
                                dataIndex: 'tenMonHoc',
                                width: 180,
                                align: 'center',
                                render: (text, record) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : 'Chưa có giảng viên chính'
                                    return <span>{mainLecturer}</span>
                                },
                            },

                            {
                                title: 'Mã bộ môn',
                                dataIndex: '',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Bộ môn',
                                dataIndex: 'danhSachLop',
                                width: 200,
                                align: 'center',
                                render: (text, record) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.sTen ||
                                                'Chưa có bộ môn'}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Mã khoa',
                                dataIndex: '',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Khoa',
                                dataIndex: 'danhSachLop',
                                width: 200,
                                align: 'center',
                                render: (text, record) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.parent?.name ||
                                                'Chưa có khoa'}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'trangThai',
                                width: 150,
                                align: 'center',
                                render: (text, record) => {
                                    if (record.active === true || record.active === 'active') {
                                        return <Tag color="green">Đang hoạt động</Tag>
                                    }
                                    if (record.active === false || record.active === 'inactive') {
                                        return <Tag color="red">Kết thúc</Tag>
                                    }
                                    return ''
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                                    'NHAP_DIEM'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                                onClick={() => handleNavigate(id)}
                                            >
                                                <CalendarPlus size={16} strokeWidth={2} />
                                                Nhập điểm
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataTable}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,

                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

ClassSubject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
