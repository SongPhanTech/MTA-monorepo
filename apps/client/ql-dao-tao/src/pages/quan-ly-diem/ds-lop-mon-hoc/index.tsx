import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import type { SubjectClass, SubjectVersion } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { listUser } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { CalendarPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function ClassSubject() {
    const { canSome, can } = useAbility()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        examType: undefined,
        subjectClassId: undefined,
        schoolYearId: undefined,
        semesterId: undefined,
        startDate: undefined,
        endDate: undefined,
        examDate: undefined,
        credit: undefined,
        mainLecturer: undefined,
        enterGradeLecturer: undefined,
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const handleNavigate = (id: string) => {
        router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CC_TX}?subjectClassId=${id}`)
    }

        const handleNavigateThi = (id: string) => {
        router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_THI}?subjectClassId=${id}`)
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    //#endregion

    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )

    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    //#region Mới
    /* Mới */
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    const where: any = useMemo(() => {
        return {
            ...(semesterId ? { semesterId } : {}),
            ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
            ...((filters.searchText && filters.searchText !== '') ||
            (filters.code && filters.code !== '')
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText || filters.name,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              code: {
                                  contains: filters.searchText || filters.code,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),

            ...(filters.examType
                ? {
                      examType: {
                          in: filters.examType,
                      },
                  }
                : {}),
            ...(filters.mainLecturer
                ? {
                      mainLecturer: {
                          include: {
                              userProfile: {
                                  OR: [
                                      {
                                          firstName: {
                                              contains: filters.mainLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                      {
                                          lastName: {
                                              contains: filters.mainLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                  ],
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.enterGradeLecturer
                ? {
                      enterGradeLecturer: {
                          include: {
                              userProfile: {
                                  OR: [
                                      {
                                          firstName: {
                                              contains: filters.enterGradeLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                      {
                                          lastName: {
                                              contains: filters.enterGradeLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                  ],
                              },
                          },
                      },
                  }
                : {}),

            ...(filters.startDate?.length === 2
                ? {
                      startDate: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      endDate: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.examDate?.length === 2
                ? {
                      examDate: {
                          gte: dayjs(filters.examDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),

            ...(!canReadAll
                ? {
                      mainLecturer: {
                          userProfileId: profileId,
                      },
                  } //Nếu không có quyền xem tất cả thì chỉ được xem lớp do mình giảng dạy
                : {}),
            active: true,
            deletedAt: null,
            cancelled: false,
        }
    }, [filters, semesterId, trainingObjectTypeId, canReadAll, profileId])

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
        where,
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
            enterGradeLecturer: {
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
        where,
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
    // const rowClassName = (record:any) => {
    //     if (record.examType ==='OfflineWritten') return 'bg-red-50'
    //     return ''
    //     }

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
                                            onChange={(val) =>
                                                handleFilterChange('subjectClassId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
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
                        // rowClassName={rowClassName}
                        // rowSelection={rowSelection}
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
                                type: 'input',
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'name',
                                width: 180,
                                align: 'center',
                                type: 'input',
                                render: (text, record: { subject?: SubjectVersion }) =>
                                    record.subject?.name || text,
                            },
                            {
                                title: 'Số TC',
                                dataIndex: 'credit',
                                width: 80,
                                align: 'center',
                                type: 'order',
                                render: (text, record: { subject?: SubjectVersion }) =>
                                    record.subject?.credit || text,
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.examType ? (
                                        <div className={`${record?.subject?.examType==='OfflineWritten'?'text-red-500':''}`}>{getExamTypeLabel(record?.subject?.examType)}</div>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Ngày bắt đầu',
                                dataIndex: 'startDate',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                dataIndex: 'endDate',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            // {
                            //     title: 'Hạn ĐT',
                            //     dataIndex: 'ngayDot',
                            //     width: 100,
                            //     align: 'center',

                            // },
                            {
                                title: 'Giảng viên',
                                width: 180,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : ''
                                    const extraLecturer = record.extraLecturer
                                        ? `${record.extraLecturer.userProfile.lastName} ${record.extraLecturer.userProfile.firstName}`
                                        : ''
                                    return (
                                        <ul>
                                            {mainLecturer && <li>- {mainLecturer}</li>}
                                            {extraLecturer && <li>- {extraLecturer}</li>}
                                        </ul>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên NĐ',
                                width: 180,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'enterGradeLecturer',
                                render: (text, record: any) => {
                                    const enterGradeLecturer = record.enterGradeLecturer
                                        ? `${record.enterGradeLecturer.userProfile.lastName} ${record.enterGradeLecturer.userProfile.firstName}`
                                        : ''
                                    return <span>{enterGradeLecturer}</span>
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
                                render: (text, record: any) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.sTen || ''}
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
                                render: (text, record: any) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.parent?.name ||
                                                ''}
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
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                                    'NHAP_DIEM'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                            >
                                                {
                                                    profileId===listUser.P2 &&(  
                                                <Tooltip title="Nhập điểm TX/CC" placement="top">
                                                    <CalendarPlus size={16} onClick={() => handleNavigate(id)} strokeWidth={2} />
                                                </Tooltip>)
                                                }
                                              
                                                 <Tooltip title="Nhập điểm thi" placement="top">
                                                    <CalendarPlus size={16} onClick={() => handleNavigateThi(id)} strokeWidth={2} />
                                                </Tooltip>
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
