import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountEvaluationSecretarYCouncil,
    useFindManyEvaluationSecretarYCouncil,
    useUpdateEvaluationSecretarYCouncil,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationSecretarYCouncil() {
    const { can, canSome } = useAbility()
    const router = useRouter()
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

    const { data, refetch } = useFindManyEvaluationSecretarYCouncil({
        include: {
            period: true,
            members: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountEvaluationSecretarYCouncil({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen: onOpenPutEvaluationSecretarYCouncil } = useDisclosure<string>({
        tag: 'PutEvaluationSecretarYCouncil',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateEvaluationSecretarYCouncil } = useUpdateEvaluationSecretarYCouncil()
    async function handleDeleteEvaluationSecretarYCouncil(id: string) {
        try {
            showSpinner()
            await updateEvaluationSecretarYCouncil({
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

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Thêm mới */}
                        <Col span={24}>
                            <Flex justify="end">
                                {can(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                                    'THEM'
                                ) && (
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            onOpenPutEvaluationSecretarYCouncil()
                                        }}
                                    >
                                        <BookPlus />
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                title: 'Tên hội đồng thư ký',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                                fixed: 'left',
                            },
                            {
                                title: 'Đợt đánh giá CTDT',
                                dataIndex: 'period',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.period?.name || ''
                                },
                            },
                            {
                                title: 'Số thành viên',
                                dataIndex: 'members',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.members?.length || ''
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                                    'XEM_CHI_TIET',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip title={'Xem chi tiết'} placement="top">
                                                        <EyeOutlined
                                                            style={{ fontSize: '16px' }}
                                                            onClick={() => {
                                                                router.push(
                                                                    `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY}/${record?.id}`
                                                                )
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onOpenPutEvaluationSecretarYCouncil(
                                                                record?.id
                                                            )
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: (e) => {
                                                                handleDeleteEvaluationSecretarYCouncil(
                                                                    record?.id
                                                                )
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

EvaluationSecretarYCouncil.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
