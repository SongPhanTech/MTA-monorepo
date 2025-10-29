import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { useCountSurvey, useFindManySurvey } from '@workspace/db/hooks'
import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function DetailSurveyPage() {
    const router = useRouter()
    const id = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        surveyQuestionType: undefined,
        surveyId: undefined,
    })
    const where = useMemo(
        () => ({
            clusterSurveyId: id,
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.surveyId
                ? Array.isArray(filters.surveyId)
                    ? { surveyId: { in: filters.surveyId } }
                    : { surveyId: filters.surveyId }
                : {}),
            ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
                ? {
                      type: { in: filters.surveyQuestionType },
                  }
                : {}),
        }),
        [filters.code, filters.name, filters.surveyId, filters.surveyQuestionType, id]
    )
    const { data = [], refetch } = useFindManySurvey(
        {
            where,
            include: {
                clusterSurvey: true,
                surveyObjectType: true,
                lecture: {
                    include: {
                        userProfile: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!id,
        }
    )

    const { data: count } = useCountSurvey({
        where: {
            ...where,
            deletedAt: null,
        },
    })
    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <div className="text-base font-bold">Tên đợt khảo sát:</div>
            </Col>
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
                            width: 20,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Đối tượng được khảo sát',
                            dataIndex: 'name',
                            type: 'input',
                        },

                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',

                            // render: (_, { id, surveyQuestionGroupId }) => (
                            //     <Row className="justify-center gap-2">
                            //         {can(
                            //             KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                            //             'SUA'
                            //         ) && (
                            //             <EditIcon
                            //                 onClick={onOpen.bind(null, {
                            //                     id,
                            //                     surveyQuestionGroupId,
                            //                 })}
                            //                 className="text-sm text-blue-700 cursor-pointer"
                            //             />
                            //         )}
                            //         {can(
                            //             KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                            //             'XOA'
                            //         ) && (
                            //             <DeleteIcon
                            //                 popConfirm={{
                            //                     onConfirm: () => handleDelete(id),
                            //                 }}
                            //             />
                            //         )}
                            //     </Row>
                            // ),
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
    )
}
DetailSurveyPage.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
