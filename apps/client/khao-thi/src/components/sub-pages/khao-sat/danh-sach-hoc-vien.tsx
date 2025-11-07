import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useCountUserProfile, useFindManyUserProfile } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import {  useMemo, useState } from 'react'

function DanhSachHọcVien({ surveyId }: { surveyId: string }) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        surveyObjectTypeId: undefined,
        surveyTopicId: undefined,
        startDate: undefined,
        endDate: undefined,
        isPublic: undefined,
        anonymous: undefined,
    })
    const router = useRouter()
const where = useMemo(()=>{
return {
            educationAndTraining: {
                some: {
                    subjectClassStudent: {
                        some: {
                            subjectClass: {
                                survey: {
                                    some: {
                                        id: surveyId,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
},[surveyId]
    
) 
    const { data } = useFindManyUserProfile({
        where,
        include: {
            educationAndTraining: {
                include: {
                    subjectClassStudent: {
                        include: {
                            subjectClass: {
                                include: {
                                    survey: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { 
            firstName: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
      const { data: count } = useCountUserProfile({
        where:{...where,deletedAt: null},
    })

    const { showSpinner, hideSpinner } = useSpinner()

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã người làm KS',
                                dataIndex: 'name',
                                render: (_, record) => record?.code || '',
                            },
                            {
                                title: 'Người làm khảo sát',
                                dataIndex: 'name',
                                render: (_, record) => {
                                    return `${record?.firstName || ''} ${record?.lastName || ''}`
                                },
                            },
                            {
                                title: 'CCCD',
                                dataIndex: 'name',
                                render: (_, record) => record?.idCardNumber || '',
                            },
                            {
                                title: 'SĐT',
                                dataIndex: 'phoneNumber',
                                render: (_, record) => record?.phoneNumber || '',
                            },

                            {
                                title: 'Trạng thái KS',
                                dataIndex: '',
                            },
                        ]}
                        data={data || []}
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

export default DanhSachHọcVien
