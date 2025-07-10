import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    message,
    Row,
    Select,
    Tag,
    TreeSelect,
} from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import TableCollapse from '@components/commons/tableCollapse'
import { DEFAULT_PAGINATE_SIZE, TRANG_THAI_HOC_VIEN } from '@constants/constants'
import { useAcademicRankingBaseTypeOptions } from '@hooks/academicRankingBaseType'
import { getWarningLevelColor } from '@hooks/getWarningLevelColor'
import useSpinner from '@hooks/spinner'
import { useStudentTrainingTypeOptions } from '@hooks/studentTrainingType'
import { buildOrgTree } from '@lib/utils'
import { useMutation } from '@tanstack/react-query'
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

dayjs.locale('vi')

interface FilterProps {
    searchText: string | undefined
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
    managementOrganizationId: string | undefined
}

interface DiemTrungBinhKyHocProps {
    semesterId: string
}

const DiemTrungBinhKyHoc = ({ semesterId }: DiemTrungBinhKyHocProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectId: '',
        trainingCourseId: '',
        managementOrganizationId: '',
    })
    const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
        useStudentTrainingTypeOptions()
    const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: dataStudents, refetch } = useFindManyFixedClass(
        {
            where: {
                students: {
                    some: {
                        studentSemesterResult: {
                            some: {
                                semesterId,
                            },
                        },
                        ...(filters.searchText && filters.searchText !== ''
                            ? {
                                  OR: [
                                      {
                                          code: {
                                              contains: filters.searchText,
                                              mode: 'insensitive',
                                          },
                                      },
                                      {
                                          userProfile: {
                                              fullname: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                      },
                                  ],
                              }
                            : {}),
                    },
                },
                ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                    ? {
                          trainingCourse: {
                              is: {
                                  trainingObjectTypeId: {
                                      contains: filters.trainingObjectId,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                    ? {
                          trainingCourseId: {
                              contains: filters.trainingCourseId,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.managementOrganizationId && filters.managementOrganizationId !== ''
                    ? {
                          managementOrganizationId: {
                              contains: filters.managementOrganizationId,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
            },
            include: {
                managementOrganization: true,
                trainingCourse: {
                    include: {
                        trainingObjectType: true,
                    },
                },
                students: {
                    where: {
                        ...(filters.searchText && filters.searchText !== ''
                            ? {
                                  OR: [
                                      {
                                          code: {
                                              contains: filters.searchText,
                                              mode: 'insensitive',
                                          },
                                      },
                                      {
                                          userProfile: {
                                              fullname: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                      },
                                  ],
                              }
                            : {}),
                    },
                    include: {
                        studentSemesterResult: true,
                        userProfile: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!semesterId }
    )

    const { data: count } = useCountFixedClass(
        {
            where: {
                students: {
                    some: {
                        studentSemesterResult: {
                            some: {
                                semesterId,
                            },
                        },
                        ...(filters.searchText && filters.searchText !== ''
                            ? {
                                  OR: [
                                      {
                                          code: {
                                              contains: filters.searchText,
                                              mode: 'insensitive',
                                          },
                                      },
                                      {
                                          userProfile: {
                                              fullname: {
                                                  contains: filters.searchText,
                                                  mode: 'insensitive',
                                              },
                                          },
                                      },
                                  ],
                              }
                            : {}),
                    },
                },
                ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                    ? {
                          trainingCourse: {
                              is: {
                                  trainingObjectTypeId: {
                                      contains: filters.trainingObjectId,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                    ? {
                          trainingCourseId: {
                              contains: filters.trainingCourseId,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.managementOrganizationId && filters.managementOrganizationId !== ''
                    ? {
                          managementOrganizationId: {
                              contains: filters.managementOrganizationId,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
            },
        },
        { enabled: !!semesterId }
    )

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: managementOrganizationData = [] } = useFindManyDM_DonVi({
        orderBy: { sTen: 'asc' },
    })

    const treeData = buildOrgTree(managementOrganizationData)

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

    const calculateSemesterResultsMutation = useMutation({
        mutationFn: async (params: { semesterId: string }) => {
            const { calculateStudentSemesterResultJson } = await import(
                '@workspace/libs/api/training'
            )
            return calculateStudentSemesterResultJson(params)
        },
        onSuccess: () => {
            message.success('Tổng kết kết quả học kỳ thành công')
            refetch()
        },
        onError: (error: any) => {
            message.error(error?.message || 'Có lỗi xảy ra khi tổng kết kết quả học kỳ')
        },
    })
    const calculateSemesterResults = calculateSemesterResultsMutation.mutateAsync
    const isCalculating = calculateSemesterResultsMutation.isPending

    const handleSummaryClick = async () => {
        if (!semesterId) {
            message.warning('Vui lòng chọn học kỳ')
            return
        }

        try {
            showSpinner()
            await calculateSemesterResults({ semesterId })
        } catch (error) {
            console.error('Lỗi khi tổng kết kết quả học kỳ:', error)
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={10}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            className="py-0"
                                            placeholder="Tìm kiếm sinh viên"
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
                                <Col span={10}>
                                    <Form.Item className="mb-0" name="trainingObjectId">
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item className="mb-0" name="trainingCourseId">
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingCourse) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange('trainingCourseId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item className="mb-0" name="managementOrganizationId">
                                        <TreeSelect
                                            placeholder="Chọn đơn vị quản lý"
                                            allowClear
                                            showSearch
                                            treeDefaultExpandAll
                                            onChange={(val) =>
                                                handleFilterChange('managementOrganizationId', val)
                                            }
                                            treeData={treeData}
                                            filterTreeNode={(input, node) =>
                                                (node.title as string)
                                                    .toLowerCase()
                                                    .includes(input.toLowerCase())
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button type="primary" onClick={handleSummaryClick}>
                                    Tổng kết kết quả học kỳ
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ code, name, trainingCourse, managementOrganization }) =>
                            `${[
                                code,
                                name,
                                trainingCourse?.name,
                                trainingCourse?.trainingObjectType?.name,
                                managementOrganization?.sTen,
                            ]
                                .filter(Boolean)
                                .join(' - ')}`
                        }
                        childrenFieldName="students"
                        defaultExpandAll
                        data={dataStudents}
                        columns={[
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: ['userProfile', 'fullname'],
                                width: 200,
                                fixed: 'left',
                            },
                            {
                                title: 'Năm học thứ...',
                                dataIndex: ['studentSemesterResult', '0', 'studyYear'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Học kỳ thứ.../ toàn khóa',
                                dataIndex: ['studentSemesterResult', '0', 'semesterIndexInCourse'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Hệ số xét học bổng',
                                dataIndex: ['studentSemesterResult', '0', 'baseScore'],
                                width: 100,
                                align: 'center',
                                render: (value) => getAcademicRankingBaseTypeLabel(value),
                            },
                            {
                                title: 'Trung bình hệ 4',
                                dataIndex: ['studentSemesterResult', '0', 'gpaBase4'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Tích lỹ hệ 4',
                                dataIndex: ['studentSemesterResult', '0', 'cumulativeGpaBase4'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Trung bình hệ 10',
                                dataIndex: ['studentSemesterResult', '0', 'gpaBase10'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Tích lỹ hệ 10',
                                dataIndex: ['studentSemesterResult', '0', 'cumulativeGpaBase10'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Xếp loại rèn luyện',
                                dataIndex: ['studentSemesterResult', '0', 'studentTrainingType'],
                                width: 140,
                                align: 'center',
                                render: (value) => (
                                    <Tag color={getStudentTrainingTypeColor(value)}>
                                        {getStudentTrainingTypeLabel(value)}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Điểm học phần thấp nhất',
                                dataIndex: ['studentSemesterResult', '0', 'lowestFinalScore'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Điểm tốt nghiệp thấp nhất',
                                dataIndex: ['studentSemesterResult', '0', 'lowestGraduationScore'],
                                width: 130,
                                align: 'center',
                            },
                            {
                                title: 'Tổng tín chỉ',
                                dataIndex: ['studentSemesterResult', '0', 'totalCredits'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Số TC đăng ký',
                                dataIndex: ['studentSemesterResult', '0', 'registeredCredits'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Số TC học lại + cải thiện',
                                dataIndex: ['studentSemesterResult', '0', 'retakingCredits'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Số TC đạt',
                                dataIndex: ['studentSemesterResult', '0', 'passedCredits'],
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Số TC không đạt',
                                dataIndex: ['studentSemesterResult', '0', 'failedCredits'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Tổng TC tích lũy',
                                dataIndex: ['studentSemesterResult', '0', 'accumulatedCredits'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Tổng TC học kỳ',
                                dataIndex: [
                                    'studentSemesterResult',
                                    '0',
                                    'totalCreditsByCurriculum',
                                ],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Tổng TC nợ',
                                dataIndex: ['studentSemesterResult', '0', 'totalFailedCredits'],
                                width: 60,
                                align: 'center',
                            },
                            {
                                title: 'Chuẩn ngoại ngữ',
                                dataIndex: ['studentSemesterResult', '0', 'foreignLangPass'],
                                align: 'center',
                                width: 90,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Lớp trưởng',
                                dataIndex: ['studentSemesterResult', '0', 'isClassMonitor'],
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Bí thư',
                                dataIndex: ['studentSemesterResult', '0', 'isUnionLeader'],
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Điểm thi đầu vào',
                                dataIndex: ['studentSemesterResult', '0', 'entryScore'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Học lại / Cải thiện',
                                dataIndex: ['studentSemesterResult', '0', 'isImproving'],
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Tạm ngưng có lý do',
                                dataIndex: ['studentSemesterResult', '0', 'postponeWithReason'],
                                align: 'center',
                                width: 100,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Mức cảnh cáo học tập',
                                dataIndex: ['studentSemesterResult', '0', 'academicWarningLevel'],
                                width: 100,
                                align: 'center',
                                render: (value: number) => (
                                    <Tag color={getWarningLevelColor(value)}>{value}</Tag>
                                ),
                            },
                            {
                                title: 'Mức cảnh cáo học đường',
                                dataIndex: [
                                    'studentSemesterResult',
                                    '0',
                                    'disciplinaryWarningLevel',
                                ],
                                width: 120,
                                align: 'center',
                                render: (value: number) => (
                                    <Tag color={getWarningLevelColor(value)}>{value}</Tag>
                                ),
                            },
                            {
                                title: 'Đình chỉ học',
                                dataIndex: ['studentSemesterResult', '0', 'suspended'],
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Đuổi học',
                                dataIndex: ['studentSemesterResult', '0', 'expelled'],
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 80,
                                fixed: 'right',
                                render: (value, record) => {
                                    if (!record?.status) {
                                        return <Tag color="error">Không hoạt động</Tag>
                                    }

                                    const trangThai =
                                        TRANG_THAI_HOC_VIEN[
                                            record?.status as keyof typeof TRANG_THAI_HOC_VIEN
                                        ]

                                    if (!trangThai) {
                                        return <Tag color="default">Không rõ</Tag>
                                    }

                                    return <Tag color={trangThai.color}>{trangThai.label}</Tag>
                                },
                            },
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default DiemTrungBinhKyHoc
