import type { FilterProps } from '@components/commons/typeFilte'
import EvaluatedPage from '@components/sub-pages/tu-danh-gia'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { EvaluationStandard } from '@workspace/db'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { Col, Row, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function EvaluationPeriodPage() {
    const router = useRouter()
    const [search, setSearch] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const id = router.query.id as string
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        startDate: undefined,
        endDate: undefined,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useFindUniqueEvaluationPeriod({
        where: { id },
        include: {
            standards: {
                include: {
                    criteria: {
                        include: {
                            requirementCriterions: {
                                include: {
                                    evidences: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    const dataTab = useMemo(() => {
        if (data) {
            return data.standards.map((i: EvaluationStandard, index: number) => {
                return {
                    key: i.id,
                    label: `Tiêu chuẩn ${index + 1}`,
                    children: <EvaluatedPage key={i.id} data={i} index={index + 1} />,
                }
            })
        }
    }, [data])

    return (
        <div className="h-full">
            <Row gutter={[16, 0]}>
                <Col span={24} className="font-bold text-xl mb-6 px-8">
                    {data?.name}
                </Col>
                <Col span={24}>
                    <Tabs
                        className="h-[calc(100vh-200px)] oveflow-y-auto"
                        tabPosition={'left'}
                        items={dataTab}
                        tabBarStyle={{ height: '100%', overflow: 'auto', width: '175px' }}
                    />
                </Col>
            </Row>
        </div>
    )
}

EvaluationPeriodPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý đợt tự đánh giá' },
                { title: 'Chi tiết đượt tự đánh giá' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
