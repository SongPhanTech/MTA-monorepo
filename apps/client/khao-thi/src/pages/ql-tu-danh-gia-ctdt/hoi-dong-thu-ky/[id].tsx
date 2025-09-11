import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { EVALUATION_SECRETARY_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { EvaluationSecretaryMemberRole } from '@workspace/db'
import {
    useFindUniqueEvaluationSecretarYCouncil,
    useUpdateEvaluationSecretaryMember,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncil() {
    const router = useRouter()
    const id = router.query.id as string
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const { data } = useFindUniqueEvaluationSecretarYCouncil(
        {
            where: {
                id: router.query.id as string,
            },
            include: {
                period: true,
                members: {
                    include: {
                        lecturer: {
                            include: {
                                userProfile: true,
                                organization: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!id,
        }
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen } = useDisclosure<string>({
        tag: 'PutEvaluationSecretaryMember',
    })
    const { mutateAsync: updateEvaluationSecretaryMember } = useUpdateEvaluationSecretaryMember()
    async function handleDeleteEvaluationSecretaryMember(id: string) {
        try {
            showSpinner()
            await updateEvaluationSecretaryMember({
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
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        onOpen()
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
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Tên đồng chí',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                render: (__, record) => {
                                    return (
                                        record?.lecturer?.userProfile?.fullname ||
                                        `${record?.lecturer?.userProfile?.lastName} ${record?.lecturer?.userProfile?.firstName}`
                                    )
                                },
                            },
                            {
                                title: 'Chức vụ, đơn vị',
                                dataIndex: 'period',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.lecturer?.organization?.sTen || ''
                                },
                            },
                            {
                                title: 'Chức vụ trong HĐ',
                                dataIndex: 'role',
                                width: 200,
                                align: 'center',
                                render: (__, record) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                        }}
                                    >
                                        {record?.role?.map(
                                            (val: EvaluationSecretaryMemberRole, index: number) => (
                                                // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                                <li key={index}>
                                                    -{' '}
                                                    {
                                                        EVALUATION_SECRETARY_MEMBER_ROLE.find(
                                                            (i) => i.value === val
                                                        )?.label
                                                    }
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ),
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
                                                        onOpen(record?.id)
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteEvaluationSecretaryMember(
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
                        data={data?.members || []}
                        pagination={false}
                    />
                </Col>
            </Row>
        </div>
    )
}

EvaluationCouncil.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý Tự đánh giá CTĐT' },
                {
                    title: 'Hội đồng đánh giá',
                    href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_THU_KY,
                },
                { title: 'Chi tiết hội đồng thư ký' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
