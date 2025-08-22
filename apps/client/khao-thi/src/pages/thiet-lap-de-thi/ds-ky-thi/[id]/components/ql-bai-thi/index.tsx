import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import EditIcon from '@components/icons/edit'
import { PutFax } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useCountExamSession, useFindManyExamSession } from '@workspace/db/hooks'
import { Col, Row } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ExamSessionProps {
    id: string
}

export default function ExamSession({ id }: ExamSessionProps) {
    const { showSpinner, hideSpinner } = useSpinner()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        code: '',
        fax: '',
    })

    const { onOpen: onOpenPutFax } = useDisclosure<{
        id: string
        examId: string
    }>({
        tag: PutFax.name,
    })

    const where = useMemo(
        () => ({
            examId: id,
            ...(filters.name && filters.name !== ''
                ? {
                      student: {
                          userProfile: {
                              fullname: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.code && filters.code !== ''
                ? {
                      student: {
                          code: {
                              contains: filters.code,
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(filters.fax && filters.fax !== ''
                ? {
                      fax: {
                          contains: filters.fax,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [id, filters.name, filters.code, filters.fax]
    )

    const { data = [] } = useFindManyExamSession(
        {
            where,
            include: {
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!id }
    )

    const { data: count } = useCountExamSession(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        { enabled: !!id }
    )

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Table
                        rowKey="key"
                        filters={filters}
                        setFilters={setFilters}
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.student?.code || '',
                            },
                            {
                                title: 'Họ và tên',
                                dataIndex: 'name',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                render: (_, record) => record?.student?.userProfile?.fullname || '',
                            },
                            {
                                title: 'Fax',
                                dataIndex: 'fax',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (__, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                    onClick={onOpenPutFax.bind(null, {
                                                        id: record.id,
                                                        examId: id,
                                                    })}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
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
