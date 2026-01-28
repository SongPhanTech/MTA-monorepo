import { EyeOutlined } from '@ant-design/icons'
import TableIndexCollapse from '@components/commons/table-collapse-index'
import type { FilterProps } from '@components/commons/typeFilter'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import useSpinner from '@hooks/spinner'
import { emptyObjectIf } from '@workspace/constant'
import { $Enums } from '@workspace/db/client'
import {
    useCountStandardCatalog,
    useDeleteCriterionCatalog,
    useDeleteStandardCatalog,
    useFindManyStandardCatalog,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function Facilities() {
    const { can, canSome } = useAbility()
    const [filters, setFilters] = useState<FilterProps>({
        order: undefined,
        name: '',
        searchText: '',
        scoreScalesId: undefined,
    })

    const where = useMemo(
        () => ({
            objectType: $Enums.StandardCatalogType.ASSET,
            ...(filters.searchText && {
                name: {
                    contains: filters.searchText,
                    mode: 'insensitive' as const,
                },
            }),
            ...(filters.name && {
                criteria: {
                    some: {
                        name: {
                            contains: filters.name,
                            mode: 'insensitive' as const,
                        },
                    },
                },
            }),
            ...(filters.scoreScalesId && {
                criteria: {
                    some: {
                        scoreScaleId: Array.isArray(filters.scoreScalesId)
                            ? filters.scoreScalesId.length > 1
                                ? { in: filters.scoreScalesId }
                                : { equals: filters.scoreScalesId[0] }
                            : { equals: filters.scoreScalesId },
                    },
                },
            }),
        }),
        [filters.searchText, filters.name, filters.scoreScalesId]
    )

    const { data, isLoading } = useFindManyStandardCatalog({
        where,
        include: {
            criteria: {
                where: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              name: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                    ...(filters.scoreScalesId && {
                        scoreScaleId: Array.isArray(filters.scoreScalesId)
                            ? filters.scoreScalesId.length > 1
                                ? { in: filters.scoreScalesId }
                                : { equals: filters.scoreScalesId[0] }
                            : { equals: filters.scoreScalesId },
                    }),
                },
                orderBy: [
                    ...emptyObjectIf(
                        [
                            {
                                order: filters.order,
                            },
                        ],
                        !!filters.order
                    ),
                    { order: 'asc' },
                ],
            },
        },
        orderBy: [{ order: 'asc' }],
    })

    const { data: count } = useCountStandardCatalog({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutStandardCatalog } = useDisclosure<{
        id: string
        count: number
        objectType?: $Enums.StandardCatalogType
    }>({
        tag: 'PutStandardCatalog',
    })

    const { onOpen: onOpenPutCriterionCatalog } = useDisclosure<{
        id: string
        standardId: string
    }>({
        tag: 'PutCriterionCatalog',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteStandardCatalog } = useDeleteStandardCatalog()
    async function handleDeleteStandardCatalog(id: string) {
        try {
            showSpinner()
            await deleteStandardCatalog({
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

    const { mutateAsync: deleteCriterionCatalog } = useDeleteCriterionCatalog()
    async function handleDeleteCriterionCatalog(id: string) {
        try {
            showSpinner()
            await deleteCriterionCatalog({
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
                <Col span={24}>
                    <Flex justify="end">
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                            'THEM'
                        ) && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    onOpenPutStandardCatalog({
                                        id: '',
                                        count: count || 0,
                                        objectType: $Enums.StandardCatalogType.ASSET,
                                    })
                                }}
                            >
                                <BookPlus />
                                Thêm mới
                            </Button>
                        )}
                    </Flex>
                </Col>

                <Col span={24}>
                    <TableIndexCollapse
                        rowKey="id"
                        headerTitleKey={({ order, name }) =>
                            `${[order, name].filter(Boolean).join(' - ')}`
                        }
                        className="w-full mt-2"
                        loading={isLoading}
                        scroll={{ y: 'calc(100vh - 240px)' }}
                        childrenFieldName="criteria"
                        defaultExpandAll
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                        }}
                        headerRight={(record) => (
                            <div className="flex px-3 gap-2.5 items-center justify-end">
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                    'THEM'
                                ) && (
                                    <CreateIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenPutCriterionCatalog({
                                                id: '',
                                                standardId: record?.id,
                                            })
                                        }}
                                        title="Thêm mới phiên bản"
                                    />
                                )}
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                    'SUA'
                                ) && (
                                    <EditIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenPutStandardCatalog({
                                                id: record?.id,
                                                count: count || 0,
                                            })
                                        }}
                                        className="text-sm text-blue-700 cursor-pointer"
                                    />
                                )}
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                    'XOA'
                                ) &&
                                    (() => {
                                        const hasCriteria = record?.criteria?.length > 0

                                        return (
                                            <Tooltip
                                                placement="top"
                                                title={
                                                    hasCriteria
                                                        ? 'Không thể xóa vì tiêu chuẩn đã có tiêu chí'
                                                        : ''
                                                }
                                            >
                                                <DeleteIcon
                                                    disabled={hasCriteria}
                                                    className={
                                                        hasCriteria
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'cursor-pointer'
                                                    }
                                                    popConfirm={
                                                        hasCriteria
                                                            ? undefined
                                                            : {
                                                                  onConfirm: (e) => {
                                                                      handleDeleteStandardCatalog(
                                                                          record?.id
                                                                      )
                                                                      e?.stopPropagation()
                                                                  },
                                                                  onCancel: (e) => {
                                                                      e?.stopPropagation()
                                                                  },
                                                              }
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Tooltip>
                                        )
                                    })()}
                            </div>
                        )}
                        columns={[
                            {
                                title: 'Tiêu chí',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Thao tác',
                                align: 'center',
                                width: 120,
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-end gap-2 px-3">
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                                    'XEM'
                                                ) && (
                                                    <Tooltip
                                                        title="Chi tiết tiêu chí"
                                                        placement="top"
                                                    >
                                                        <EyeOutlined
                                                            style={{ fontSize: '24px' }}
                                                            className="text-sm cursor-pointer"
                                                        />
                                                    </Tooltip>
                                                )}

                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onOpenPutCriterionCatalog({
                                                                id: record?.id,
                                                                standardId: record?.standardId,
                                                            })
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_TIEU_CHUAN_TIEU_CHI,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDeleteCriterionCatalog(
                                                                    record?.id
                                                                )
                                                                e?.stopPropagation()
                                                            },
                                                            onCancel: (e) => {
                                                                e?.stopPropagation()
                                                            },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                )}
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        pagination={false}
                    />
                </Col>
            </Row>
        </div>
    )
}
