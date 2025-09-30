import Table from '@components/commons/table'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useClassRegisterStatus } from '@hooks/classRegisterStatus'
import DefaultLayout from '@layouts/default-layout'
import type { SubjectClassTime } from '@workspace/db'
import {
    useCountSubjectClass,
    useFindManySubjectClass,
    useFindUniqueClassRegisterSession,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Col, Divider, Row } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function ClassRegisterLogs() {
    const router = useRouter()
    const id = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { classRegisterStatusOptions, getClassRegisterStatusColor, getClassRegisterStatusLabel } =
        useClassRegisterStatus()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        code: '',
        subjectClassId: undefined,
        classRegisterStatus: undefined,
    })
    const { data: initialValue } = useFindUniqueClassRegisterSession(
        {
            where: { id },
            include: {
                semester: {
                    include: {
                        schoolYear: true,
                    },
                },
            },
        },
        { enabled: !!id }
    )

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      student: {
                          code: {
                              contains: filters.name,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      student: {
                          userProfile: {
                              OR: [
                                  {
                                      fullname: {
                                          contains: filters.name,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      firstName: {
                                          contains: filters.name,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      lastName: {
                                          contains: filters.name,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              ],
                          },
                      },
                  }
                : {}),
        }),
        [filters.name, filters.code]
    )

    const { data } = useFindManySubjectClass(
        {
            where: {
                ...where,
                deletedAt: null,
                active: true,
                classRegisterLogs: {
                    some: {
                        classRegisterSessionId: id,
                    },
                },
            },
            include: {
                classRegisterLogs: {
                    where: {
                        classRegisterSessionId: id,
                    },
                    include: {
                        student: {
                            include: {
                                userProfile: true,
                            },
                        },
                    },
                },
                subject: true,
                mainLecturer: {
                    select: {
                        userProfile: true,
                    },
                },
                extraLecturer: {
                    select: {
                        userProfile: true,
                    },
                },
                room: true,
                subjectClassTimes: true,
                _count: {
                    select: {
                        classRegisterLogs: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        },
        {
            enabled: !!id,
        }
    )

    const { data: count } = useCountSubjectClass(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        {
            enabled: !!id,
        }
    )

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    initialValue?.code,
                    initialValue?.name,
                    initialValue?.semester?.name,
                    initialValue?.semester?.schoolYear?.name,
                    dayjs(initialValue?.startDate).format('HH:mm DD/MM/YYYY'),
                    dayjs(initialValue?.endDate).format('HH:mm DD/MM/YYYY'),
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã LMH',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên LMH',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số TC',
                                width: 200,
                                align: 'center',
                                render: (_, record) => record?.subject?.credit || '',
                            },
                            {
                                title: 'Giảng viên',
                                render: (_, record) =>
                                    [
                                        record.mainLecturer?.userProfile.fullname,
                                        record.extraLecturer?.userProfile.fullname,
                                    ]
                                        .filter(Boolean)
                                        .join(', '),
                            },
                            {
                                title: 'Phòng học',
                                align: 'center',
                                width: 150,
                                render: (_, record) => record.room?.name,
                            },
                            {
                                title: 'Số lượng',
                                align: 'center',
                                width: 80,
                                render: (_, record) =>
                                    `${record._count?.classRegisterLogs || 0}/${record.maxStudent}`,
                            },
                            {
                                title: 'Thời khoá biểu',
                                width: 300,
                                align: 'center',
                                render: (_, record) => {
                                    return record.subjectClassTimes?.map?.(
                                        (tkb: SubjectClassTime) => {
                                            return (
                                                <p>
                                                    {tkb.dayOfWeek === 8
                                                        ? 'CN'
                                                        : `T${tkb.dayOfWeek}`}{' '}
                                                    - {tkb.startPeriod} - {tkb.endPeriod}
                                                </p>
                                            )
                                        }
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 300,
                                align: 'center',
                                render: (_, record) => {
                                    return (
                                        <div className="flex items-center justify-center gap-2">
                                            <CreateIcon title="Nhập lớp học phần" />
                                            <DeleteIcon
                                                title="Huỷ lớp học phần"
                                                popConfirm={{
                                                    title: 'Bạn có chắc chắn muốn huỷ lớp học phần này?',
                                                    description:
                                                        'Hành động này sẽ huỷ tất cả các đăng ký học phần của sinh viên trong lớp này.',
                                                    onConfirm: async () => {
                                                        // await deleteSubjectClass(record.id)
                                                    },
                                                }}
                                            />
                                        </div>
                                    )
                                },
                            },
                        ]}
                        data={data}
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

ClassRegisterLogs.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Kế hoạch đào tạo' },
                {
                    title: 'Đợt đăng ký học',
                    href: ROUTER_PATH.QL_DAO_TAO.KE_HOACH_GIAO_DUC_DOT_DANG_KY_HOC,
                },
                { title: 'Các lớp môn học' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
