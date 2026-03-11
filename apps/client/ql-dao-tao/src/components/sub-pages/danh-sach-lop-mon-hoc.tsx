import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import { cn } from '@lib/utils'
import {
    type DiemLopMonHocProps,
    diemLopMonHocStore,
} from '@pages/quan-ly-diem/ql-diem-lop-mon-hoc'
import { useStore } from '@tanstack/react-store'
import { $Enums, type Prisma, type SubjectVersion } from '@workspace/db/client'
import {
    useCountSubjectClass,
    useFindManyFixedClass,
    useFindManySubjectClass,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Checkbox, Col, Flex, Form, Input, message, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { type Key, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function DanhSachLopMonHoc({
    role = 'GV',
    setActiveKey,
    score,
}: DiemLopMonHocProps) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { options, getExamTypeLabel } = useExamTypeOptions()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        examType: undefined,
        schoolYearId: undefined,
        semesterId: undefined,
        startDate: undefined,
        endDate: undefined,
        examDate: undefined,
        credit: undefined,
        mainLecturer: undefined,
        enterGradeLecturer: undefined,
        fixedClassId: undefined,
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()

    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        diemLopMonHocStore.setState({ selectedSubjectClassId: undefined })
    }, [trainingObjectTypeId, semesterId])

    const { onOpen: onOpenDetailSubjectClass } = useDisclosure<{
        id: string
        mode: 'edit' | 'view'
    }>({
        tag: 'PutOneSubjectClassModal',
    })
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )

    const { selectedSubjectClassId } = useStore(diemLopMonHocStore)

    const profileId = window?.contextData?.userId

    const { data: fixedClasses = [] } = useFindManyFixedClass(
        {
            where: {
                ...((trainingObjectTypeId || semesterId) && {
                    trainingCourse: trainingObjectTypeId ? { trainingObjectTypeId } : {},
                    subjectClasses: { some: { semesterId } },
                }),
            },
            include: {
                trainingCourse: {
                    include: {
                        trainingObjectType: true,
                        semesterStart: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            take: 30,
        },
        {
            enabled: !!trainingObjectTypeId || !!semesterId,
        }
    )

    const where = useMemo(() => {
        return {
            ...(semesterId ? { semesterId } : {}),
            ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
            ...(filters.searchText
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
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.searchText || filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive',
                      },
                  }
                : {}),

            ...(filters.examType
                ? {
                      examType: {
                          in: filters.examType,
                      },
                  }
                : {}),
            ...(filters.fixedClassId
                ? {
                      fixedClasses: {
                          some: {
                              id: filters.fixedClassId,
                          },
                      },
                  }
                : {}),
            ...(filters.mainLecturer
                ? {
                      mainLecturer: {
                          userProfile: filters.mainLecturer
                              ? {
                                    fullname: {
                                        contains: filters.mainLecturer,
                                        mode: 'insensitive' as const,
                                    },
                                }
                              : {},
                      },
                  }
                : {}),
            ...(filters.enterGradeLecturer
                ? {
                      enterGradeLecturer: {
                          userProfile: filters.enterGradeLecturer
                              ? {
                                    fullname: {
                                        contains: filters.enterGradeLecturer,
                                        mode: 'insensitive' as const,
                                    },
                                }
                              : {},
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

            ...(role === 'GV' && !canReadAll
                ? {
                      OR: [
                          {
                              mainLecturer: {
                                  userProfileId: profileId,
                              },
                          },
                          {
                              extraLecturer: {
                                  userProfileId: profileId,
                              },
                          },
                          {
                              enterGradeLecturer: {
                                  userProfileId: profileId,
                              },
                          },
                      ],
                  } //Nếu không có quyền xem tất cả thì chỉ được xem lớp do mình giảng dạy
                : {}),
            active: true,
            deletedAt: null,
            cancelled: false,
            status: 'OFFICIAL',
        } satisfies Prisma.SubjectClassWhereInput
    }, [filters, semesterId, trainingObjectTypeId, profileId, role, canReadAll])

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
            _count: {
                select: { subjectClassStudent: true },
            },
        },
        orderBy: {
            code: 'asc',
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

    const { data: count } = useCountSubjectClass({ where })

    return (
        <div>
            <Row gutter={[0, 0]}>
                <Col span={24}>
                    <Row align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item className="m-0" name="searchText">
                                        <Select
                                            options={fixedClasses.map((i) => {
                                                return {
                                                    value: i.id,
                                                    label: `${i?.code} - ${i.name}`,
                                                }
                                            })}
                                            id="search"
                                            onChange={(e) => handleFilterChange('fixedClassId', e)}
                                            placeholder="Chọn lớp quản lý"
                                            style={{ height: 28 }}
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item className="m-0" name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm lớp..."
                                            style={{ height: 28 }}
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            className="w-full ml-3"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24} className="mt-2">
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        rowKey="id"
                        id="training-category"
                        rowSelection={{
                            type: 'radio',
                            selectedRowKeys: [selectedSubjectClassId as Key],
                            onChange: (selectedRowKeys, selectedRows, info) => {
                                if (
                                    selectedRows[0]?.subject?.examType === 'OfflineWritten' &&
                                    score === 'THI'
                                ) {
                                    message.error('Lớp thi viết không được nhập điểm trực tiếp')
                                    return
                                }
                                diemLopMonHocStore.setState({
                                    selectedSubjectClassId: selectedRowKeys?.[0] as string,
                                })
                            },
                            columnWidth: 35,
                        }}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    if (
                                        record?.subject?.examType === 'OfflineWritten' &&
                                        score === 'THI'
                                    ) {
                                        message.error('Lớp thi viết không được nhập điểm trực tiếp')
                                        return
                                    }
                                    diemLopMonHocStore.setState({
                                        selectedSubjectClassId: record.id,
                                    })
                                },
                                onDoubleClick: () => {
                                    if (
                                        record?.subject?.examType === 'OfflineWritten' &&
                                        score === 'THI'
                                    ) {
                                        message.error('Lớp thi viết không được nhập điểm trực tiếp')
                                        return
                                    }
                                    setActiveKey?.('2')
                                },
                                className: cn(
                                    record?.subject?.examType === 'OfflineWritten'
                                        ? 'text-red-500'
                                        : '',
                                    dayjs()?.isAfter(record?.scoreDeadline) && !record?.enteredScore
                                        ? 'bg-yellow-200'
                                        : dayjs().isAfter(record?.examScoreDeadline) &&
                                            !record?.enteredExamScore
                                          ? 'bg-yellow-100'
                                          : ''
                                    // selectedSubjectClassId === record.id ? 'bg-orange-200' : ''
                                ),
                            }
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                align: 'center',
                                width: 120,
                                type: 'input',
                                render: (_, record) => (
                                    <p>
                                        {record.code}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenDetailSubjectClass({
                                                    id: record.id,
                                                    mode: 'view',
                                                })
                                            }}
                                            className="rounded p-1 cursor-pointer hover:bg-green-400"
                                        >
                                            🔍
                                        </span>
                                    </p>
                                ),
                            },
                            {
                                title: 'Sĩ số',
                                align: 'center',
                                width: 50,
                                render: (_, record) => record._count.subjectClassStudent || 0,
                            },
                            {
                                title: 'Môn học',
                                dataIndex: 'name',
                                width: 225,
                                align: 'left',
                                type: 'input',
                                render: (_, record) => (
                                    <p>
                                        {record.type === $Enums.SubjectClassType.RETAKE ? (
                                            <Tag color={'blue'} className="p-0 px-1">
                                                Học lại
                                            </Tag>
                                        ) : record.type === $Enums.SubjectClassType.REEXAM ? (
                                            <Tag color={'yellow'} className="p-0 px-1">
                                                Thi lại
                                            </Tag>
                                        ) : null}
                                        {record.subject?.name} ({record.subject?.credit})
                                    </p>
                                ),
                            },
                            {
                                title: 'Thi',
                                dataIndex: 'examType',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.examType ? (
                                        <div>{getExamTypeLabel(record?.subject?.examType)}</div>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái NĐ',
                                width: 120,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.enteredExamScore ? (
                                        'Đã nhập điểm thi'
                                    ) : record?.enteredScore ? (
                                        'Đã nhập điểm TX,ĐK'
                                    ) : (
                                        <div className="text-red-500">Chưa nhập điểm</div>
                                    )
                                },
                            },
                            {
                                title: <Tooltip title="Môn 1 đầu điểm">Môn 1 ĐĐ</Tooltip>,
                                width: 80,
                                align: 'center',
                                render: (__, record) => {
                                    return <Checkbox checked={record?.subject?.onePoint} />
                                },
                            },
                            {
                                title: 'Ngày NĐQT',
                                dataIndex: 'scoreDeadLineStart',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn NĐQT',
                                width: 120,
                                dataIndex: 'scoreDeadline',
                                align: 'center',
                                type: 'date',
                                render: (_, record) => (
                                    <div
                                    // className={`${dayjs().isBefore(record?.scoreDeadline) ? '' : 'text-red-500'}`}
                                    >
                                        {record.scoreDeadline
                                            ? dayjs(record.scoreDeadline).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                ),
                            },
                            {
                                title: 'Hạn ĐQT',
                                width: 80,
                                align: 'center',
                                render: (__, record) => {
                                    const today = dayjs()
                                    const scoreDeadline = dayjs(record?.scoreDeadline)
                                    if (!scoreDeadline) {
                                        return '-'
                                    }
                                    let daysRemaining: number

                                    if (today?.isBefore(scoreDeadline)) {
                                        daysRemaining = scoreDeadline?.diff(today, 'day')
                                    } else {
                                        return <div className="text-red-500">Hết hạn</div>
                                    }

                                    return (
                                        <Tooltip title={`Còn ${daysRemaining} ngày trước hạn ĐQT`}>
                                            <span>{daysRemaining}</span>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn NĐT',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record) => {
                                    return (
                                        <div
                                        // className={`${dayjs().isBefore(record?.examScoreDeadline) ? '' : 'text-red-500'}`}
                                        >
                                            {record.examScoreDeadline
                                                ? dayjs(record.examScoreDeadline).format(
                                                      'DD/MM/YYYY'
                                                  )
                                                : ''}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Hạn ĐT',
                                width: 80,
                                align: 'center',
                                render: (__, record) => {
                                    const today = dayjs()
                                    if (!record?.examScoreDeadline) {
                                        return '-'
                                    }
                                    const examScoreDeadline = dayjs(record?.examScoreDeadline)
                                    let daysRemaining: number
                                    if (today?.isBefore(examScoreDeadline)) {
                                        daysRemaining = examScoreDeadline?.diff(today, 'day')
                                    } else {
                                        return <div className="text-red-500">Hết hạn</div>
                                    }

                                    return (
                                        <Tooltip title={`Còn ${daysRemaining} ngày trước hạn ĐT`}>
                                            <span>{daysRemaining}</span>
                                        </Tooltip>
                                    )
                                },
                            },

                            {
                                title: 'Giảng viên 1',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : ''

                                    return <ul>{mainLecturer && <li>- {mainLecturer}</li>}</ul>
                                },
                            },

                            {
                                title: 'Giảng viên NĐ',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const enterGradeLecturer = record.enterGradeLecturer
                                        ? `${record.enterGradeLecturer.userProfile.lastName} ${record.enterGradeLecturer.userProfile.firstName}`
                                        : ''
                                    return (
                                        <ul>
                                            {enterGradeLecturer && <li>- {enterGradeLecturer}</li>}
                                        </ul>
                                    )
                                },
                            },
                            {
                                title: 'ĐV phụ trách',
                                dataIndex: 'danhSachLop',
                                width: 100,
                                align: 'center',
                                render: (text, record: any) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.sMa || ''}
                                        </span>
                                    )
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
