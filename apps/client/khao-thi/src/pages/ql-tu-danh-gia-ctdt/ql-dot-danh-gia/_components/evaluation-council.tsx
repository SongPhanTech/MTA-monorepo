import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, EVALUATION_MEMBER_ROLE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { $Enums, type EvaluationMemberRole } from '@workspace/db'
import {
    useCountEvaluationCouncil,
    useFindManyEvaluationCouncil,
    useFindUniqueEvaluationCouncil,
    useUpdateEvaluationCouncil,
    useUpdateEvaluationCouncilMember,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function EvaluationCouncilTab() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const [selectedRowKey, setSelectedRowKey] = useState<string>()

    const { onOpen: onOpenPutEvaluationCouncil } = useDisclosure<{
        evaluationPeriodId?: string
        evaluationCouncilId?: string
    }>({
        tag: 'PutEvaluationCouncil',
    })

    const { onOpen } = useDisclosure<{
        evaluationCouncilId?: string
        evaluationCouncilMemberId?: string
    }>({
        tag: 'PutEvaluationCouncilMember',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

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

    const { data, isLoading } = useFindManyEvaluationCouncil(
        {
            where: {
                ...where,
                periodId: selectedEvaluationPeriodId,
            },
            include: {
                members: true,
                evaluationCriterion: true,
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!selectedEvaluationPeriodId,
        }
    )

    const { data: count } = useCountEvaluationCouncil({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: evaluationCouncil, isLoading: isLoadingEvaluationCouncil } =
        useFindUniqueEvaluationCouncil(
            {
                where: {
                    id: selectedRowKey,
                },
                include: {
                    period: true,
                    members: {
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
                    },
                },
            },
            {
                enabled: !!selectedRowKey,
            }
        )

    const tableDataCollapse = useMemo(() => {
        if (!evaluationCouncil?.members) return []

        const secretaryMembers: typeof evaluationCouncil.members = []
        const otherMembers: typeof evaluationCouncil.members = []
        const advisoryBoardMembers: typeof evaluationCouncil.members = []

        const hasRole = (
            member: (typeof evaluationCouncil.members)[0],
            role: $Enums.EvaluationMemberRole
        ) => member.role?.includes(role)

        for (const member of evaluationCouncil.members) {
            const isSecretary = hasRole(member, $Enums.EvaluationMemberRole.SECRETARY)
            const isHeadSecretary = hasRole(member, $Enums.EvaluationMemberRole.HEAD_SECRETARY)
            const isAdvisory = hasRole(member, $Enums.EvaluationMemberRole.ADVISORY_BOARD)

            if (isSecretary || isHeadSecretary) {
                secretaryMembers.push(member)
            } else if (isAdvisory) {
                advisoryBoardMembers.push(member)
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

        return result
    }, [evaluationCouncil?.members])

    const { mutateAsync: updateEvaluationCouncil } = useUpdateEvaluationCouncil()
    async function handleDeleteEvaluationCouncil(id: string) {
        try {
            showSpinner()
            await updateEvaluationCouncil({
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
        <Row gutter={[8, 8]} align="top">
            <Col span={10}>
                <Flex justify="end">
                    {can(
                        KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
                        'THEM'
                    ) && (
                        <Button
                            type="primary"
                            onClick={() => {
                                onOpenPutEvaluationCouncil({
                                    evaluationPeriodId: selectedEvaluationPeriodId,
                                })
                            }}
                        >
                            <BookPlus />
                            Thêm mới
                        </Button>
                    )}
                </Flex>
                <Table
                    rowKey="id"
                    loading={isLoading}
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
                        onChange: (selectedRowKeys) => {
                            setSelectedRowKey(selectedRowKeys[0] as string)
                        },
                    }}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                setSelectedRowKey(record.id)
                            },
                        }
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
                            title: 'Tên hội đồng',
                            dataIndex: 'name',
                            width: 200,
                            align: 'center',
                            type: 'input',
                            fixed: 'left',
                        },
                        {
                            title: 'Số thành viên trong HĐ',
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
                                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
                                'XEM_CHI_TIET',
                                'SUA',
                                'XOA'
                            ),
                            render: (_, record) => {
                                if (record?.id) {
                                    return (
                                        <Row className="justify-center gap-2">
                                            {can(
                                                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
                                                'SUA'
                                            ) && (
                                                <EditIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenPutEvaluationCouncil({
                                                            evaluationCouncilId: record.id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                            )}
                                            {can(
                                                KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_HOI_DONG_DANH_GIA,
                                                'XOA'
                                            ) && (
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDeleteEvaluationCouncil(
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
            <Col span={14}>
                <Flex justify="end">
                    <Button
                        type="primary"
                        onClick={() => {
                            onOpen({
                                evaluationCouncilId: selectedRowKey!,
                            })
                        }}
                    >
                        <BookPlus />
                        Thêm mới
                    </Button>
                </Flex>
                <TableCollapse
                    rowKey="id"
                    loading={isLoadingEvaluationCouncil}
                    filters={filters}
                    setFilters={setFilters}
                    headerTitleKey="name"
                    childrenFieldName="children"
                    defaultExpandAll
                    columns={[
                        {
                            title: 'Tên đồng chí',
                            dataIndex: 'name',
                            width: 200,
                            align: 'center',
                            render: (__, record) => {
                                if (record.$type === 'parent') return ''

                                const academicRank =
                                    record?.lecturer?.userProfile?.academicRankType?.sTen || ''
                                const degree =
                                    record?.lecturer?.userProfile?.academicDegreeType?.sTen || ''

                                const fullName = record?.lecturer?.userProfile?.fullname
                                    ? record?.lecturer?.userProfile?.fullname
                                    : `${record?.lecturer?.userProfile?.lastName} ${record?.lecturer?.userProfile?.firstName}`

                                const academicTitle = [academicRank, degree]
                                    .filter(Boolean)
                                    .join('.')

                                return academicTitle ? `${academicTitle} ${fullName}` : fullName
                            },
                        },
                        {
                            title: 'Đơn vị',
                            dataIndex: 'period',
                            width: 200,
                            align: 'center',
                            render: (__, record) => {
                                if (record.$type === 'parent') return ''

                                return record?.lecturer?.organization?.sTen || ''
                            },
                        },
                        {
                            title: 'Chức vụ trong HĐ',
                            dataIndex: 'role',
                            width: 200,
                            align: 'center',
                            render: (__, record) => {
                                if (record.$type === 'parent') return ''

                                return (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                        }}
                                    >
                                        {record?.role?.map(
                                            (val: EvaluationMemberRole, index: number) => (
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
                                if (record?.id && record?.$type !== 'parent') {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onOpen({
                                                        evaluationCouncilMemberId: record.id,
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
            </Col>
        </Row>
    )
}
