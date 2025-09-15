import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilte'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountEvidenceCategory,
    useDeleteEvidence,
    useDeleteEvidenceCategory,
    useFindManyEvidenceCategory,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Input, message, Row, Tooltip } from 'antd'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvidenceCategory() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        searchText: '',
    })

    const where = useMemo(
        () => ({
            ...(filters.searchText && {
                name: {
                    contains: filters.searchText,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.name && {
                evidences: {
                    some: {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                },
            }),
        }),
        [filters]
    )

    const { data } = useFindManyEvidenceCategory({
        where,
        include: {
            evidences: true,
        },
        orderBy: [{ name: 'desc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountEvidenceCategory({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutEvidenceCategory } = useDisclosure<string>({
        tag: 'PutEvidenceCategory',
    })

    const { onOpen: onOpenPutEvidence } = useDisclosure<{
        id: string
        categoryId: string
    }>({
        tag: 'PutEvidence',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteEvidenceCategory } = useDeleteEvidenceCategory()
    async function handleDeleteEvidenceCategory(id: string) {
        try {
            showSpinner()
            await deleteEvidenceCategory({
                where: { id },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: deleteEvidence } = useDeleteEvidence()
    async function handleDeleteEvidence(id: string) {
        try {
            showSpinner()
            await deleteEvidence({
                where: { id },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24} className="mb-0">
                    <Row gutter={[16, 16]} align="top">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                searchText: e.target.value,
                                            })
                                        }
                                        className="py-0 h-8"
                                        placeholder="Tìm kiếm"
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
                                </Col>
                            </Flex>
                        </Col>
                        {/* Thêm mới */}
                        <Col span={12}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        onOpenPutEvidenceCategory()
                                    }}
                                >
                                    <BookPlus />
                                    Thêm mới nhóm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey="name"
                        childrenFieldName="evidences"
                        defaultExpandAll
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        headerRight={(record) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutEvidence({
                                            id: '',
                                            categoryId: record?.id,
                                        })
                                    }}
                                    title="Thêm mới minh chứng"
                                />
                                <EditIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutEvidenceCategory(record?.id)
                                    }}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: (e) => {
                                            handleDeleteEvidenceCategory(record?.id)
                                            e?.stopPropagation()
                                        },
                                        onCancel: (e) => {
                                            e?.stopPropagation()
                                        },
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        // onRowClick={({ id }) => {
                        //     router.push(
                        //         `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI}/${id}`
                        //     )
                        // }}
                        columns={[
                            {
                                title: 'Tên minh chứng',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Người thực hiện',
                                dataIndex: 'issuer',
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Mô tả',
                                width: 200,
                                align: 'center',
                                dataIndex: 'description',
                                render: (value: string) => {
                                    return (
                                        <Tooltip title={value}>
                                            <div className="line-clamp-2">{value}</div>
                                        </Tooltip>
                                    )
                                },
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
                                                {/* <Tooltip title="Chi tiết tiêu chí" placement="top">
                                                    <EyeOutlined className="text-sm cursor-pointer" />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutEvidence({
                                                            id: record?.id,
                                                            categoryId: record?.categoryId,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteEvidence(record?.id)
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => {
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

EvidenceCategory.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
