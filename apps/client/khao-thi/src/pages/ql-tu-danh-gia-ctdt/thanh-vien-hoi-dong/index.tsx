import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutEvaluationCouncilMember } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountEvaluationCouncilMember,
    useFindManyEvaluationCouncilMember,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncilMember() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [filters.name]
    )

    const { data, refetch } = useFindManyEvaluationCouncilMember({
        include: {
            evaluationCouncil: true,
            lecturer: {
                include: {
                    userProfile: true,
                    organization: true,
                },
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountEvaluationCouncilMember({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutEvaluationCouncilMember } = useDisclosure<string>({
        tag: PutEvaluationCouncilMember.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateEvaluationCouncilMember } = useUpdateEvaluationCouncilMember()
    async function handleDeleteEvaluationCouncilMember(id: string) {
        try {
            showSpinner()
            await updateEvaluationCouncilMember({
                where: { id },
                data: { deletedAt: new Date() },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Thêm mới */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        onOpenPutEvaluationCouncilMember()
                                    }}
                                >
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
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
                                title: 'Tên đồng chí',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                                fixed: 'left',
                                render: (__, record) => {
                                    return (
                                        record?.lecturer?.userProfile?.fullname ||
                                        `${record?.lecturer?.userProfile.lastName} ${record?.lecturer?.userProfile.firstName}`
                                    )
                                },
                            },
                            {
                                title: 'Chức vụ, đơn vị',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.lecturer?.organization?.sTen || ''
                                },
                            },
                            {
                                title: 'Hội đồng',
                                dataIndex: 'evaluationCouncil',
                                width: 150,
                                render: (__, record) => {
                                    return record?.evaluationCouncil?.name || ''
                                },
                            },
                            {
                                title: 'Chức vụ trong HĐ',
                                dataIndex: 'passFrom',
                                width: 150,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutEvaluationCouncilMember(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteEvaluationCouncilMember(
                                                                record?.id
                                                            )
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
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

EvaluationCouncilMember.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
