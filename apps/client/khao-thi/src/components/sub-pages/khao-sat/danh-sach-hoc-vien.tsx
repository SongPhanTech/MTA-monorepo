import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useCountUserProfile, useFindManyUserProfile } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { Col, Row, Tag } from 'antd'
import { useRouter } from 'next/router'
import {  useMemo, useState } from 'react'

function DanhSachHocVien({ surveyId }: { surveyId: string }) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        code: '',
        idCardNumber:'',
        phoneNumber:'',
        statusSurvey:undefined
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
                ...(
                    filters.statusSurvey && filters.statusSurvey?.length===1 &&filters.statusSurvey[0]===true&&{
                        surveySession: {
                            some: {
                                surveyId: surveyId,
                            },
                        }
                    }
                ),
                   ...(
                    filters.statusSurvey && filters.statusSurvey?.length===1 &&filters.statusSurvey[0]===false&&{
                        surveySession: {
                            none: {
                                surveyId: surveyId,
                            },
                        }
                    }
                ),
                
                ...(filters.name&&{
                    OR:[
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
                        }
                    ]
                }),
                  ...(filters.code&&{
                         code: {
                                contains: filters.code,
                                mode: 'insensitive' as const,
                            },
                }),
                   ...(filters.idCardNumber&&{
                         idCardNumber: {
                                contains: filters.idCardNumber,
                                mode: 'insensitive' as const,
                            },
                            
                }),
                  ...(filters.phoneNumber&&{
                         phoneNumber: {
                                contains: filters.phoneNumber,
                                mode: 'insensitive' as const,
                            },
                            
                }),
            }
    },[surveyId,filters]
    
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
                                    survey: {
                                        include: {
                                            surveySessions: true,
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            },
            surveySession: {
                where: { surveyId }
            }
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

    const checkStatus=(record:any)=>{
        if(record?.surveySession?.length===1){
          return <Tag color="green">{'Đã làm'}</Tag>
        }
        return <Tag color={'red'}>{'Chưa làm'}</Tag>
    }

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
                                dataIndex: 'code',
                                type:'input',
                                render: (_, record) => record?.code || '',
                            },
                            {
                                title: 'Người làm khảo sát',
                                dataIndex: 'name',
                                type:'input',
                                render: (_, record) => {
                                    return `${record?.lastName || ''} ${record?.firstName || ''}`
                                },
                            },
                            {
                                title: 'CCCD',
                                dataIndex: 'idCardNumber',
                                 type:'input',
                                render: (_, record) => record?.idCardNumber || '',
                            },
                            {
                                title: 'SĐT',
                                dataIndex: 'phoneNumber',
                                 type:'input',
                                render: (_, record) => record?.phoneNumber || '',
                            },
                            {
                                title: 'Trạng thái KS',
                                dataIndex: 'statusSurvey',
                                align: 'center',
                                 type:'select',
                                 options: [
                                    {
                                        value: true,
                                        label: 'Đã làm',
                                    },
                                    {
                                        value: false,
                                        label: 'Chưa làm',
                                    },
                                ],
                                render:(__,record)=>{
                                    return checkStatus(record)
                                }
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

export default DanhSachHocVien
