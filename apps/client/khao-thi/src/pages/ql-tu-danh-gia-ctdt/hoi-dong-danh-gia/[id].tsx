import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { EVALUATION_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { EvaluationMemberRole } from '@workspace/db'
import { $Enums } from '@workspace/db'
import {
    useFindUniqueEvaluationCouncil,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncil() {
    const router = useRouter()
    const id = router.query.id as string
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const { data } = useFindUniqueEvaluationCouncil(
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
        tag: 'PutEvaluationCouncilMember',
    })
    const { mutateAsync: updateEvaluationCouncilMember } = useUpdateEvaluationCouncilMember()
    async function handleDeleteEvaluationCouncilMember(id: string) {
        try {
            showSpinner()
            await updateEvaluationCouncilMember({
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

    // Transform data for TableCollapse
    const tableData = useMemo(() => {
        if (!data?.members) return []

        const secretaryMembers = data.members.filter((member) =>
            member.role?.some(
                (r) =>
                    r === $Enums.EvaluationMemberRole.SECRETARY ||
                    r === $Enums.EvaluationMemberRole.HEAD_SECRETARY
            )
        )

        const otherMembers = data.members.filter(
            (member) =>
                !member.role?.some(
                    (r) =>
                        r === $Enums.EvaluationMemberRole.SECRETARY ||
                        r === $Enums.EvaluationMemberRole.HEAD_SECRETARY
                )
        )

        const result: any[] = []

        // Add other members first as individual rows (without children array to avoid collapse)
        for (const member of otherMembers) {
            result.push({
                ...member,
                key: member.id,
                type: 'child',
            })
        }

        if (secretaryMembers.length > 0) {
            result.push({
                id: 'secretary-group',
                key: 'secretary-group',
                name: 'Hội đồng thư ký',
                $type: 'parent',
                secretaryMembers: secretaryMembers.map((member) => ({
                    ...member,
                    key: member.id,
                    $type: 'child',
                })),
            })
        }

        return result
    }, [data?.members])

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
                    <TableCollapse
                        rowKey="id"
                        filters={filters}
                        setFilters={setFilters}
                        headerTitleKey="name"
                        childrenFieldName="secretaryMembers"
                        columns={[
                            {
                                title: 'Tên đồng chí',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    if (record?.id === 'secretary-group') return ''

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
                                    if (record?.id === 'secretary-group') return ''

                                    return record?.lecturer?.organization?.sTen || ''
                                },
                            },
                            {
                                title: 'Chức vụ trong HĐ',
                                dataIndex: 'role',
                                width: 200,
                                align: 'center',
                                render: (__, record) => {
                                    if (record?.id === 'secretary-group') return ''

                                    return (
                                        <ul
                                            style={{
                                                paddingLeft: 16,
                                                margin: 0,
                                            }}
                                        >
                                            {record?.role?.map(
                                                (val: EvaluationMemberRole, index: number) => (
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                                    <li key={index}>
                                                        -{' '}
                                                        {
                                                            EVALUATION_MEMBER_ROLE.find(
                                                                (i) => i.value === val
                                                            )?.label
                                                        }
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    if (record?.id && record?.id !== 'secretary-group') {
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
                        data={tableData}
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
                { title: 'QL tự đánh giá CTĐT' },
                {
                    title: 'Hội đồng đánh giá',
                    href: ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
                },
                { title: 'Chi tiết hội đồng đánh giá' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
