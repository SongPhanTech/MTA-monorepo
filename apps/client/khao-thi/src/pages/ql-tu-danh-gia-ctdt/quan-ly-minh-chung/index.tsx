import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import useSpinner from '@hooks/spinner'
import EvaluateLayout from '@layouts/evaluate-layout'
import {
    useDeleteEvidence,
    useDeleteEvidenceCategory,
    useFindManyEvidenceCategory,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvidenceCategory() {
    const { can, canSome } = useAbility()
    const [filters, setFilters] = useState<FilterProps>({
        evidenceName: '',
        information: '',
        issuer: '',
    })

    const where = useMemo(
        () => ({
            deletedAt: null,
            ...(filters.evidenceName
                ? {
                      name: {
                          contains: filters.evidenceName,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.information
                ? {
                      information: {
                          contains: filters.information,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.issuer
                ? {
                      issuer: {
                          contains: filters.issuer,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
        }),
        [filters.evidenceName, filters.information, filters.issuer]
    )

    const { data } = useFindManyEvidenceCategory({
        include: {
            evidences: {
                where,
            },
        },
        orderBy: [{ name: 'desc' }],
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
                <Col span={24} className="mb-2">
                    <Flex justify="end">
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                            'THEM'
                        ) && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    onOpenPutEvidenceCategory()
                                }}
                            >
                                <BookPlus />
                                Thêm mới nhóm
                            </Button>
                        )}
                    </Flex>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="id"
                        headerTitleKey="name"
                        childrenFieldName="evidences"
                        defaultExpandAll
                        className="w-full"
                        scroll={{ y: 'calc(100vh - 200px)', x: 'max-content' }}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                        }}
                        headerRight={(record) => (
                            <div className="flex gap-2.5 w-[85px] items-center">
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                    'THEM'
                                ) && (
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
                                )}
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                    'SUA'
                                ) && (
                                    <EditIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenPutEvidenceCategory(record?.id)
                                        }}
                                        className="text-sm text-blue-700 cursor-pointer"
                                    />
                                )}
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                    'XOA'
                                ) && (
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
                                )}
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
                                dataIndex: 'evidenceName',
                                width: 200,
                                align: 'left',
                                type: 'input',
                                render: (__, record) => record?.name,
                            },
                            {
                                title: 'Số, ngày/tháng ban hành',
                                width: 200,
                                dataIndex: 'information',
                                align: 'left',
                                type: 'input',
                                render: (_, record) =>
                                    record?.information ? record.information : '',
                            },
                            {
                                title: 'Nơi ban hành',
                                type: 'input',
                                dataIndex: 'issuer',
                                width: 100,
                                align: 'left',
                                render: (_, record) => (record?.issuer ? record.issuer : ''),
                            },
                            {
                                title: 'Ghi chú',
                                width: 100,
                                align: 'left',
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
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {/* <Tooltip title="Chi tiết tiêu chí" placement="top">
                                                    <EyeOutlined className="text-sm cursor-pointer" />
                                                </Tooltip> */}

                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                                    'SUA'
                                                ) && (
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
                                                )}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QUAN_LY_MINH_CHUNG,
                                                    'XOA'
                                                ) && (
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

EvidenceCategory.getLayout = function getLayout(page: React.ReactElement) {
    return <EvaluateLayout>{page}</EvaluateLayout>
}
