import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import KhaoSatLayout from '@layouts/khao-sat-layout'
import { useFindUniqueSurvey } from '@workspace/db/hooks'
import { Button, Col, Flex, Row } from 'antd'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

type SurveyQuestion = {
    id: string
    name: string
    surveyQuestionGroupId: string
    surveyQuestionGroup: {
        id: string
        name: string
    }
}

type GroupedSurveyQuestion = {
    id: string // group id
    name: string // group name
    children: {
        id: string
        name: string
    }[]
}
function TakeTestPage() {
    const router = useRouter()
    const id = router.query.id as string
    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id },
            include: {
                surveyQuestion: {
                    include: {
                        surveyQuestionGroup: true,
                    },
                },
            },
        },
        {
            enabled: !!id,
        }
    )

    const dataTest = useMemo(() => {
        const groupedMap = (survey?.surveyQuestion ?? []).reduce<
            Record<string, GroupedSurveyQuestion>
        >((acc: any, item: any, index: number) => {
            const groupId = item.surveyQuestionGroupId

            if (!acc[groupId]) {
                acc[groupId] = {
                    id: item.surveyQuestionGroup.id,
                    name: item.surveyQuestionGroup.name,
                    children: [],
                }
            }

            acc[groupId].children.push({
                id: item.id,
                name: item.name,
                type: item.type,
            })

            return acc
        }, {})

        // Chuyển thành array
        const grouped: GroupedSurveyQuestion[] = Object.values(groupedMap).map((i: any, index) => {
            return { ...i, name: `${index + 1}. ${i.name}` }
        })
        return grouped || []
        // return classGroups
    }, [survey?.surveyQuestion])

    return (
        <div className="p-6">
            <div className="text-xl font-bold">{survey?.name}</div>
            <Row>
                <Col span={24}>
                    <Table
                        dataSource={[{ id: 'abc' }]}
                        columns={[
                            {
                                title: 'Hoàn toàn đồng ý',
                                dataIndex: 'rate1',
                                width: 100,
                                align: 'center',
                                render: () => (
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                            1
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Đồng ý',
                                dataIndex: 'rate2',
                                width: 80,
                                align: 'center',
                                render: () => (
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                            2
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Không đồng ý',
                                dataIndex: 'rate3',
                                width: 100,
                                align: 'center',
                                render: () => (
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                            3
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Hoàn toàn không đồng ý',
                                dataIndex: 'rate4',
                                width: 150,
                                align: 'center',
                                render: () => (
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                            4
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Không ý kiến',
                                dataIndex: 'rate5',
                                width: 100,
                                align: 'center',
                                render: () => (
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px]">
                                            5
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                        pagination={false}
                    />
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        currentPage={1}
                        headerTitleKey={({ name }) => (
                            <div className="flex items-center">
                                <div className="font-bold">{name}</div>
                            </div>
                        )}
                        childrenFieldName="children"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Nội dung phản hồi',
                                align: 'left',
                                dataIndex: 'name',
                                fixed: 'left',
                            },
                            {
                                title: 'Mức phản hồi',
                                align: 'center',
                                width: 200,
                                render: (_, record) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            {[1, 2, 3, 4, 5].map((i) => {
                                                return (
                                                    <div className="flex items-center justify-center w-6 h-6 border-solid border-[1px] border-[#ed9e9e] text-[#ea1212] text-[12px] mr-[6px]">
                                                        {i}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                },
                            },
                        ]}
                        data={dataTest}
                        pagination={{
                            hideOnSinglePage: true,
                        }}
                    />
                </Col>
                <Col span={24} className="mt-6">
                    <Flex justify="end">
                        <Button type="primary">Lưu</Button>
                    </Flex>
                </Col>
            </Row>
        </div>
    )
}

export default TakeTestPage
TakeTestPage.getLayout = function getLayout(page: React.ReactNode) {
    return <KhaoSatLayout>{page}</KhaoSatLayout>
}
