import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { EVALUATION_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { $Enums, type EvaluationMemberRole } from '@workspace/db'
import {
    useFindFirstEvaluationCouncil,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { Button, Col, Empty, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncilTab() {
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const { onOpen } = useDisclosure<{
        evaluationCouncilId?: string
        evaluationCouncilMemberId?: string
    }>({
        tag: 'PutEvaluationCouncilMember',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data: evaluationCouncil, isLoading: isLoadingEvaluationCouncil } =
        useFindFirstEvaluationCouncil(
            {
                where: {
                    periodId: selectedEvaluationPeriodId,
                },
                include: {
                    period: true,
                    members: {
                        where: {
                            deletedAt: null,
                            ...(filters.name && {
                                lecturer: {
                                    userProfile: {
                                        fullname: {
                                            contains: filters.name,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            }),
                        },
                        include: {
                            lecturer: {
                                include: {
                                    userProfile: {
                                        include: {
                                            academicDegreeType: {
                                                select: {
                                                    sTen: true,
                                                },
                                            },
                                            academicRankType: {
                                                select: {
                                                    sTen: true,
                                                },
                                            },
                                        },
                                    },
                                    organization: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            },
            {
                enabled: !!selectedEvaluationPeriodId,
            }
        )

    const tableDataCollapse = useMemo(() => {
        if (!evaluationCouncil?.members) return []

        const secretaryMembers: typeof evaluationCouncil.members = []
        const otherMembers: typeof evaluationCouncil.members = []
        const advisoryBoardMembers: typeof evaluationCouncil.members = []
        const specializedMembers: typeof evaluationCouncil.members = []

        const hasAnyRole = (
            member: (typeof evaluationCouncil.members)[0],
            roles: $Enums.EvaluationMemberRole[]
        ) => roles.some((role) => member.role?.includes(role))

        for (const member of evaluationCouncil.members) {
            if (
                hasAnyRole(member, [
                    $Enums.EvaluationMemberRole.SECRETARY,
                    $Enums.EvaluationMemberRole.HEAD_SECRETARY,
                ])
            ) {
                secretaryMembers.push(member)
            } else if (hasAnyRole(member, [$Enums.EvaluationMemberRole.ADVISORY_BOARD])) {
                advisoryBoardMembers.push(member)
            } else if (
                hasAnyRole(member, [
                    $Enums.EvaluationMemberRole.SPECIALIZED,
                    $Enums.EvaluationMemberRole.HEAD_SPECIALIZED,
                ])
            ) {
                specializedMembers.push(member)
            } else {
                otherMembers.push(member)
            }
        }

        const result: any[] = []
        let sttCounter = 1

        for (const member of otherMembers) {
            result.push({
                ...member,
                key: member.id,
                $type: 'child' as const,
                $stt: sttCounter++,
            })
        }

        if (secretaryMembers.length > 0) {
            result.push({
                id: 'secretary-group',
                key: 'secretary-group',
                name: 'Ban thư ký',
                $type: 'parent' as const,
                children: secretaryMembers.map((member) => ({
                    ...member,
                    key: member.id,
                    $type: 'child' as const,
                    $stt: sttCounter++,
                })),
            })
        }

        if (advisoryBoardMembers.length > 0) {
            result.push({
                id: 'advisory-board-group',
                key: 'advisory-board-group',
                name: 'Ban tư vấn',
                $type: 'parent' as const,
                children: advisoryBoardMembers.map((member) => ({
                    ...member,
                    key: member.id,
                    $type: 'child' as const,
                    $stt: sttCounter++,
                })),
            })
        }

        if (specializedMembers.length > 0) {
            result.push({
                id: 'specialized-group',
                key: 'specialized-group',
                name: 'Nhóm chuyên trách',
                $type: 'parent' as const,
                children: specializedMembers.map((member) => ({
                    ...member,
                    key: member.id,
                    $type: 'child' as const,
                    $stt: sttCounter++,
                })),
            })
        }

        return result
    }, [evaluationCouncil?.members])

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

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {tableDataCollapse.length === 0 ? (
                        <Flex justify="center" align="center" style={{ minHeight: 800 }}>
                            <Empty
                                description="Chưa có thành viên nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button
                                    type="primary"
                                    icon={<BookPlus size={16} className="top-1" />}
                                    size="small"
                                    onClick={() => {
                                        onOpen({
                                            evaluationCouncilId: evaluationCouncil?.id,
                                        })
                                    }}
                                >
                                    Thêm thành viên
                                </Button>
                            </Empty>
                        </Flex>
                    ) : (
                        <>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 16, fontWeight: 600 }}>
                                    Danh sách thành viên
                                </span>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<BookPlus size={16} />}
                                    onClick={() => {
                                        onOpen({
                                            evaluationCouncilId: evaluationCouncil?.id,
                                        })
                                    }}
                                >
                                    Thêm thành viên
                                </Button>
                            </Flex>

                            <TableCollapse
                                rowKey="id"
                                filters={filters}
                                setFilters={(value) => {
                                    setFilters(value)
                                }}
                                loading={isLoadingEvaluationCouncil}
                                headerTitleKey="name"
                                childrenFieldName="children"
                                defaultExpandAll
                                columns={[
                                    {
                                        title: 'Tên đồng chí',
                                        dataIndex: 'name',
                                        type: 'input',
                                        width: 200,
                                        render: (__, record) => {
                                            if (record.$type === 'parent') return ''

                                            const academicRank =
                                                record?.lecturer?.userProfile?.academicRankType
                                                    ?.sTen || ''
                                            const degree =
                                                record?.lecturer?.userProfile?.academicDegreeType
                                                    ?.sTen || ''

                                            const fullName = record?.lecturer?.userProfile?.fullname
                                                ? record?.lecturer?.userProfile?.fullname
                                                : `${record?.lecturer?.userProfile?.lastName} ${record?.lecturer?.userProfile?.firstName}`

                                            const academicTitle = [academicRank, degree]
                                                .filter(Boolean)
                                                .join('.')

                                            return academicTitle
                                                ? `${academicTitle} ${fullName}`
                                                : fullName
                                        },
                                    },
                                    {
                                        title: 'Số điện thoại',
                                        width: 100,
                                        render: (__, record) =>
                                            record?.lecturer?.userProfile?.phoneNumber,
                                    },
                                    {
                                        title: 'Email',
                                        width: 200,
                                        render: (__, record) => {
                                            return record?.lecturer?.userProfile?.email
                                        },
                                    },
                                    {
                                        title: 'Đơn vị',
                                        dataIndex: 'period',
                                        width: 200,
                                        render: (__, record) => {
                                            if (record.$type === 'parent') return ''

                                            return record?.lecturer?.organization?.sTen || ''
                                        },
                                    },
                                    {
                                        title: 'Chức vụ trong HĐ',
                                        dataIndex: 'role',
                                        width: 200,
                                        render: (__, record) => {
                                            if (record.$type === 'parent') return ''

                                            return (
                                                <ul
                                                    style={{
                                                        paddingLeft: 16,
                                                        margin: 0,
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    {record?.role?.map(
                                                        (
                                                            val: EvaluationMemberRole,
                                                            index: number
                                                        ) => (
                                                            <li key={index}>
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
                                        width: 50,
                                        align: 'center',
                                        render: (_, record) => {
                                            if (record?.id && record?.$type !== 'parent') {
                                                return (
                                                    <Row className="justify-center gap-2">
                                                        <EditIcon
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onOpen({
                                                                    evaluationCouncilMemberId:
                                                                        record.id,
                                                                })
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
                                data={tableDataCollapse}
                                pagination={false}
                            />
                        </>
                    )}
                </Col>
            </Row>
        </div>
    )
}
