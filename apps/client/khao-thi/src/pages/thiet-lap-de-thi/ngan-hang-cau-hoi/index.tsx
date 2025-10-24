import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import type { PutQuestionBankInput } from '@components/modal/put-ngan-hang-cau-hoi'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DM_DonVi, QuestionBank as QB } from '@workspace/db'
import { useFindManyDM_DonVi, useUpdateQuestionBank } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Card, Col, Flex, Input, message, Row, Space, Tooltip, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { BookPlus, Building2, BookOpen, FileText, Database, EyeIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface QuestionBankNode extends DataNode {
    key: string
    title: React.ReactNode
    isLeaf: true
    data: {
        id: string
        code: string | null
        name: string
        description: string | null
        deletedAt: Date | null
        subjectVersionId: string
    }
}

interface SubjectVersionNode extends DataNode {
    key: string
    title: React.ReactNode
    children: QuestionBankNode[]
    data: {
        id: string
        code: string | null
        name: string
        period: number
        credit: number
    }
}

interface SubjectNode extends DataNode {
    key: string
    title: React.ReactNode
    children: SubjectVersionNode[]
    data: {
        id: string
        code: string | null
        name: string
    }
}

interface OrganizationNode extends DataNode {
    key: string
    title: React.ReactNode
    children: SubjectNode[]
    data: DM_DonVi
}

export default function QuestionBank() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const [searchName, setSearchName] = useState('')
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

    const { data: donViData = [] } = useFindManyDM_DonVi({
        include: {
            subjects: {
                include: {
                    subjectVersion: {
                        include: {
                            questionBanks: {
                                where: {
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
                where: {
                    deletedAt: null,
                },
            },
        },
    })

    const { onOpen: onOpenPutQuestionBank } = useDisclosure<PutQuestionBankInput>({
        tag: 'PutQuestionBank',
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: updateQuestionBank } = useUpdateQuestionBank()

    async function handleDeleteQuestionBank(id: string) {
        try {
            showSpinner()
            await updateQuestionBank({
                where: { id },
                data: { deletedAt: new Date() },
            })
            message.success('Xóa thành công')
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

    const treeData = useMemo((): OrganizationNode[] => {
        const normalizedSearchName = searchName?.toLowerCase().trim()
        const keysToExpand: React.Key[] = []

        const matchesSearchTerm = (text: string | null | undefined, code?: string | null) => {
            if (!normalizedSearchName) return true
            if (!text && !code) return false

            const nameMatch = text?.toLowerCase().includes(normalizedSearchName)
            const codeMatch = code?.toLowerCase().includes(normalizedSearchName)

            return nameMatch || codeMatch
        }

        const createQuestionBankNode = (qb: QB): QuestionBankNode => ({
            key: `qb-${qb.id}`,
            title: (
                <div className="flex items-center justify-between w-full py-2">
                    <Space size="middle" align="center">
                        <Database className="w-4 h-4 flex-shrink-0 text-green-600" />
                        <span className="font-medium">
                            {qb.code && `${qb.code} - `}
                            {qb.name}
                        </span>
                        {qb.description && (
                            <Tooltip title={qb.description}>
                                <span className="text-gray-500 text-xs">
                                    ({qb.description.substring(0, 30)}
                                    {qb.description.length > 30 && '...'})
                                </span>
                            </Tooltip>
                        )}
                    </Space>
                    <Space size="small" className="ml-5" align="center">
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                            'XEM_CHI_TIET'
                        ) && (
                            <Tooltip title="Danh sách câu hỏi" placement="top">
                                <EyeIcon
                                    size={16}
                                    className="text-sm cursor-pointer text-blue-600 hover:text-blue-800 text-center flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(
                                            `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI}/${qb.id}`
                                        )
                                    }}
                                />
                            </Tooltip>
                        )}
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                            'SUA'
                        ) && (
                            <EditIcon
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenPutQuestionBank({
                                        id: qb.id,
                                    })
                                }}
                                className="text-sm text-blue-700 cursor-pointer flex-shrink-0"
                            />
                        )}
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                            'XOA'
                        ) && (
                            <DeleteIcon
                                popConfirm={{
                                    onConfirm: (e) => {
                                        handleDeleteQuestionBank(qb.id)
                                        e?.stopPropagation()
                                    },
                                    onCancel: (e) => e?.stopPropagation(),
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 text-red-500"
                            />
                        )}
                    </Space>
                </div>
            ),
            isLeaf: true,
            data: qb,
        })

        return donViData.reduce((acc, org) => {
            const orgMatches = matchesSearchTerm(org.sTen)
            const orgKey = `org-${org.Id}`

            const subjectNodes = (org.subjects || []).reduce<SubjectNode[]>((subAcc, subject) => {
                const subjectMatches = matchesSearchTerm(subject.name, subject.code)
                const subjectKey = `sub-${subject.id}`

                const versionNodes = subject.subjectVersion.reduce<SubjectVersionNode[]>(
                    (verAcc, version) => {
                        const versionMatches = matchesSearchTerm(version.name, version.code)
                        const versionKey = `ver-${version.id}`

                        const bankNodes = (version.questionBanks || [])
                            .filter((qb) => {
                                if (orgMatches || subjectMatches || versionMatches) {
                                    return true
                                }
                                return matchesSearchTerm(qb.name, qb.code)
                            })
                            .map(createQuestionBankNode)

                        if (bankNodes.length === 0) return verAcc

                        if (normalizedSearchName && bankNodes.length > 0) {
                            keysToExpand.push(orgKey, subjectKey, versionKey)
                        }

                        verAcc.push({
                            key: `ver-${version.id}`,
                            title: (
                                <Space align="center">
                                    <FileText className="w-4 h-4 flex-shrink-0 text-orange-600" />
                                    <span className="font-medium">
                                        {version.code && `${version.code} - `}
                                        {version.name}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        ({version.period} tiết, {version.credit} tín chỉ)
                                    </span>

                                    <Tooltip title="Thêm mới" placement="top">
                                        <BookPlus
                                            className="text-[#028850] flex-shrink-0 cursor-pointer"
                                            size={17}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenPutQuestionBank({
                                                    subjectVersionId: version.id,
                                                })
                                            }}
                                        />
                                    </Tooltip>
                                </Space>
                            ),
                            children: bankNodes,
                            data: version,
                        })
                        return verAcc
                    },
                    []
                )

                if (versionNodes.length === 0) return subAcc

                subAcc.push({
                    key: `sub-${subject.id}`,
                    title: (
                        <Space align="center">
                            <BookOpen className="w-4 h-4 flex-shrink-0 text-purple-600" />
                            <span className="font-medium">
                                {subject.code && `${subject.code} - `}
                                {subject.name}
                            </span>
                        </Space>
                    ),
                    children: versionNodes,
                    data: subject,
                })
                return subAcc
            }, [])

            if (subjectNodes.length === 0) return acc

            acc.push({
                key: `org-${org.Id}`,
                title: (
                    <Space align="center">
                        <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="font-semibold">{org.sTen}</span>
                    </Space>
                ),
                children: subjectNodes,
                data: org,
            })
            return acc
        }, [] as OrganizationNode[])
    }, [donViData, searchName, can, router, onOpenPutQuestionBank])

    const autoExpandedKeys = useMemo(() => {
        if (!searchName?.trim()) return []

        const keysToExpand: React.Key[] = []
        const normalizedSearchName = searchName.toLowerCase().trim()

        const matchesSearchTerm = (text: string | null | undefined, code?: string | null) => {
            if (!text && !code) return false
            const nameMatch = text?.toLowerCase().includes(normalizedSearchName)
            const codeMatch = code?.toLowerCase().includes(normalizedSearchName)
            return nameMatch || codeMatch
        }

        donViData.forEach((org) => {
            const orgMatches = matchesSearchTerm(org.sTen)
            const orgKey = `org-${org.Id}`
            let orgHasResults = false

            org.subjects?.forEach((subject) => {
                const subjectMatches = matchesSearchTerm(subject.name, subject.code)
                const subjectKey = `sub-${subject.id}`
                let subjectHasResults = false

                subject.subjectVersion.forEach((version) => {
                    const versionMatches = matchesSearchTerm(version.name, version.code)
                    const versionKey = `ver-${version.id}`

                    const hasMatchingBanks = version.questionBanks?.some((qb) => {
                        if (orgMatches || subjectMatches || versionMatches) return true
                        return matchesSearchTerm(qb.name, qb.code)
                    })

                    if (hasMatchingBanks) {
                        keysToExpand.push(versionKey)
                        subjectHasResults = true
                    }
                })

                if (subjectHasResults) {
                    keysToExpand.push(subjectKey)
                    orgHasResults = true
                }
            })

            if (orgHasResults) {
                keysToExpand.push(orgKey)
            }
        })

        return keysToExpand
    }, [donViData, searchName])

    const finalExpandedKeys = useMemo(() => {
        if (searchName?.trim()) {
            return autoExpandedKeys
        }
        return expandedKeys
    }, [searchName, autoExpandedKeys, expandedKeys])

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex justify="space-between" align="center">
                        <Space size="middle">
                            <Input
                                placeholder="Tìm theo tên hoặc mã (Đơn vị, Nhóm môn học, Môn học, Ngân hàng câu hỏi)"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-96"
                                allowClear
                            />
                        </Space>
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                            'THEM'
                        ) && (
                            <Button onClick={() => onOpenPutQuestionBank()} type="primary">
                                <BookPlus />
                                Thêm mới
                            </Button>
                        )}
                    </Flex>
                </Col>

                <Col span={24}>
                    <div className="flex gap-4">
                        <span className="flex gap-2 items-center justify-end">
                            <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                            Đơn vị
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <BookOpen className="w-4 h-4 flex-shrink-0 text-purple-600" />
                            Nhóm môn học
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <FileText className="w-4 h-4 flex-shrink-0 text-orange-600" />
                            Môn học
                        </span>
                        <span className="flex gap-2 items-center justify-end">
                            <Database className="w-4 h-4 flex-shrink-0 text-green-600" />
                            Ngân hàng câu hỏi
                        </span>
                    </div>
                </Col>

                <Col span={24}>
                    <Card>
                        <Tree
                            showLine
                            showIcon={false}
                            // blockNode // Cho phép click toàn bộ node
                            expandedKeys={finalExpandedKeys}
                            onExpand={(keys) => {
                                // Chỉ cập nhật expandedKeys khi không có search
                                if (!searchName?.trim()) {
                                    setExpandedKeys(keys)
                                }
                            }}
                            onSelect={(selectedKeys, info) => {
                                const key = info.node.key as string

                                if (key.startsWith('qb-')) {
                                    const qbId = key.replace('qb-', '')
                                    if (
                                        can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI,
                                            'XEM_CHI_TIET'
                                        )
                                    ) {
                                        router.push(
                                            `${ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_NGAN_HANG_CAU_HOI}/${qbId}`
                                        )
                                    }
                                } else {
                                    // Chỉ cho phép expand/collapse thủ công khi không có search
                                    if (!searchName?.trim()) {
                                        const isExpanded = expandedKeys.includes(key)
                                        if (isExpanded) {
                                            setExpandedKeys(expandedKeys.filter((k) => k !== key))
                                        } else {
                                            setExpandedKeys([...expandedKeys, key])
                                        }
                                    }
                                }
                            }}
                            treeData={treeData}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

QuestionBank.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
