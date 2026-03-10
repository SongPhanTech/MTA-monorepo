import { queryClient } from '@api/index'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useAcademicActionTypeOption } from '@hooks/academicActionType'
import { useCriteriaFieldOptions } from '@hooks/criteriaField'
import { useCriteriaOperatorOptions } from '@hooks/criteriaOperator'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountAcademicActionRuleSet,
    useCreateAcademicActionRuleSet,
    useFindManyAcademicActionRuleSet,
    useFindUniqueAcademicActionConfig,
    useUpdateAcademicActionCondition,
    useUpdateAcademicActionRuleSet,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Checkbox, Col, Divider, Flex, Input, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | undefined
}

export default function AcademicActionCondition() {
    const router = useRouter()
    const configId = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { showSpinner, hideSpinner } = useSpinner()
    const { getAcademicActionTypeLabel } = useAcademicActionTypeOption()
    const { getCriteriaFieldLabel } = useCriteriaFieldOptions()
    const { getCriteriaOperatorLabel } = useCriteriaOperatorOptions()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { data: initialValue } = useFindUniqueAcademicActionConfig(
        {
            where: { id: configId },
        },
        { enabled: !!configId }
    )

    const { data, refetch } = useFindManyAcademicActionRuleSet(
        {
            where: {
                configId,
                ...(filters.searchText && filters.searchText !== ''
                    ? {
                          conditions: {
                              some: {
                                  code: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
            },
            include: {
                conditions: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!configId }
    )

    const { data: count } = useCountAcademicActionRuleSet(
        {
            where: {
                configId,
                ...(filters.searchText && filters.searchText !== ''
                    ? {
                          conditions: {
                              some: {
                                  code: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                deletedAt: null,
            },
        },
        { enabled: !!configId }
    )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { mutateAsync: createAcademicActionRuleSet } = useCreateAcademicActionRuleSet()
    async function handleCreateAcademicActionRuleSet(configId: string) {
        if (!configId) return
        try {
            showSpinner()
            const data = {
                configId,
            }
            await createAcademicActionRuleSet({ data })
            message.success('Thêm mới thành công')

            queryClient.invalidateQueries({
                queryKey: ['AcademicActionRuleSet'],
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

    const { mutateAsync: updateAcademicActionConfig } = useUpdateAcademicActionRuleSet()
    async function handleDeleteAcademicActionRuleSet(id: string) {
        try {
            showSpinner()
            await updateAcademicActionConfig({
                where: { id },
                data: { deletedAt: new Date() },
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

    const { mutateAsync: updateAcademicActionCondition } = useUpdateAcademicActionCondition()
    async function handleDeleteAcademicActionCondition(id: string) {
        try {
            showSpinner()
            await updateAcademicActionCondition({
                where: { id },
                data: { deletedAt: new Date() },
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

    const { onOpen: onOpenPutAcademicActionCondition } = useDisclosure<{
        id: string
        ruleSetId: string
    }>({
        tag: 'PutAcademicActionCondition',
    })

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    initialValue?.code,
                    initialValue?.name,
                    initialValue?.actionType &&
                        getAcademicActionTypeLabel(initialValue?.actionType),
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Flex justify="space-between">
                        <Input
                            id="search"
                            onChange={(e) => handleFilterChange('searchText', e.target.value)}
                            style={{ width: '290px', height: 32 }}
                            prefix={
                                <Search
                                    size={15}
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.25)',
                                    }}
                                />
                            }
                            placeholder="Tìm kiếm mã điều kiện"
                            allowClear
                        />

                        <Flex justify="end">
                            <Button
                                onClick={() => handleCreateAcademicActionRuleSet(configId)}
                                type="primary"
                            >
                                <BookPlus />
                                Thêm bộ quy tắc mới
                            </Button>
                        </Flex>
                    </Flex>
                </Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        data={data}
                        headerTitleKey={(record) => {
                            const indexInPage =
                                data?.findIndex((item) => item.id === record.id) ?? -1
                            const globalIndex =
                                indexInPage >= 0
                                    ? (currentPage - 1) * numberOfPages + indexInPage + 1
                                    : ''
                            return `Bộ quy tắc ${globalIndex}`
                        }}
                        childrenFieldName="conditions"
                        defaultExpandAll
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Mã điều kiện',
                                dataIndex: 'code',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Trường được đánh giá',
                                dataIndex: 'field',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                render: (value) => getCriteriaFieldLabel(value),
                            },
                            /* {
                                title: 'Đảo ngược so sánh',
                                dataIndex: 'invert',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            }, */
                            {
                                title: 'So sánh',
                                dataIndex: 'operator',
                                align: 'center',
                                width: 180,
                                render: (value) => getCriteriaOperatorLabel(value),
                            },
                            {
                                title: 'Ngưỡng so sánh',
                                dataIndex: 'value',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Áp dụng cho sinh viên năm thứ...',
                                dataIndex: 'yearCondition',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Áp dụng cho đối tượng ưu tiên',
                                dataIndex: 'isPriorityStudent',
                                align: 'center',
                                width: 120,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Mô tả',
                                width: 150,
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
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                fixed: 'right',
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
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
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutAcademicActionCondition({
                                                            id: record?.id,
                                                            ruleSetId: record?.ruleSetId,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteAcademicActionCondition(
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
                        headerRight={({ id: ruleSetId }) => (
                            <div className="flex gap-2.5 w-[70px] items-center">
                                <CreateIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenPutAcademicActionCondition({
                                            id: '',
                                            ruleSetId: ruleSetId,
                                        })
                                    }}
                                    title="Thêm điều kiện"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: (e) => {
                                            handleDeleteAcademicActionRuleSet(ruleSetId)
                                            e?.stopPropagation()
                                        },
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
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

AcademicActionCondition.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Danh mục' },
                {
                    title: 'Danh mục xử lý học tập',
                    href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_DANH_MUC_XU_LY_HOC_TAP,
                },
                { title: 'Điều kiện cụ thể' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
