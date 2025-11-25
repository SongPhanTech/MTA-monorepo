import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import type { PutQuestionBankInput } from '@components/modal/put-ngan-hang-cau-hoi'
import type {
    OrganizationNode,
    QuestionBankNode,
    SubjectNode,
    SubjectVersionNode,
} from '@constants/types/exam-bank'
import type { QuestionBank as QB } from '@workspace/db'
import type { Prisma } from '@workspace/db/client'
import type { PERMISSIONS } from '@workspace/permissions/hooks'
import {
    type DANG_KY_HOC_PERMISSION,
    KHAO_THI_PERMISSION,
    type QL_DAO_TAO_PERMISSION,
    type QL_HO_SO_PERMISSION,
    type TRO_LY_AO_PERMISSION,
} from '@workspace/router'
import { Space, Tooltip, Tree } from 'antd'
import { BookOpen, BookPlus, Building2, Database, FileText } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'

type DonViType = Prisma.DM_DonViGetPayload<{
    include: {
        subjects: {
            include: {
                subjectVersion: {
                    include: {
                        questionBanks: true
                    }
                }
            }
        }
    }
}>

interface QuestionBankTreeProps {
    searchName: string
    expandedKeys: React.Key[]
    setExpandedKeys: (keys: React.Key[]) => void
    setSelectedQuestionBankId: (id: string) => void
    donViData: DonViType[]
    can: (
        subject:
            | KHAO_THI_PERMISSION
            | DANG_KY_HOC_PERMISSION
            | QL_DAO_TAO_PERMISSION
            | TRO_LY_AO_PERMISSION
            | QL_HO_SO_PERMISSION,
        ...action: (keyof typeof PERMISSIONS)[]
    ) => boolean
    onOpenPutQuestionBank: (input?: PutQuestionBankInput) => void
    handleDeleteQuestionBank: (id: string) => void
}

export function QuestionBankTree({
    searchName,
    expandedKeys,
    setExpandedKeys,
    setSelectedQuestionBankId,
    donViData,
    can,
    onOpenPutQuestionBank,
    handleDeleteQuestionBank,
}: QuestionBankTreeProps) {
    const { treeData, autoExpandedKeys } = useMemo(() => {
        const normalizedSearch = searchName?.toLowerCase().trim() || ''
        const keysToExpand: React.Key[] = []

        const matchesSearch = (
            text: string | null | undefined,
            code: string | null | undefined
        ) => {
            if (!normalizedSearch) return true
            if (!text && !code) return false
            return (
                text?.toLowerCase().includes(normalizedSearch) ||
                code?.toLowerCase().includes(normalizedSearch)
            )
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
                            'SUA'
                        ) && (
                            <EditIcon
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenPutQuestionBank({ id: qb.id })
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

        const treeNodes = donViData.reduce((organizations: OrganizationNode[], org: any) => {
            const orgMatches = matchesSearch(org.sTen, null)
            const orgKey = `org-${org.Id}`

            const subjectNodes = (org.subjects || []).reduce(
                (subjects: SubjectNode[], subject: any) => {
                    const subjectMatches = matchesSearch(subject.name, subject.code)
                    const subjectKey = `sub-${subject.id}`

                    const versionNodes = subject.subjectVersion.reduce(
                        (versions: SubjectVersionNode[], version: any) => {
                            const versionMatches = matchesSearch(version.name, version.code)
                            const versionKey = `ver-${version.id}`

                            const bankNodes = (version.questionBanks || [])
                                .filter(
                                    (qb: QB) =>
                                        orgMatches ||
                                        subjectMatches ||
                                        versionMatches ||
                                        matchesSearch(qb.name, qb.code)
                                )
                                .map(createQuestionBankNode)

                            if (bankNodes.length === 0) return versions

                            if (normalizedSearch) {
                                keysToExpand.push(orgKey, subjectKey, versionKey)
                            }

                            versions.push({
                                key: versionKey,
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
                            return versions
                        },
                        []
                    )

                    if (versionNodes.length === 0) return subjects

                    subjects.push({
                        key: subjectKey,
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
                    return subjects
                },
                []
            )

            if (subjectNodes.length === 0) return organizations

            organizations.push({
                key: orgKey,
                title: (
                    <Space align="center">
                        <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span className="font-semibold">{org.sTen}</span>
                    </Space>
                ),
                children: subjectNodes,
                data: org,
            })
            return organizations
        }, [])

        return {
            treeData: treeNodes,
            autoExpandedKeys: normalizedSearch ? keysToExpand : [],
        }
    }, [donViData, searchName, onOpenPutQuestionBank, can, handleDeleteQuestionBank])

    const finalExpandedKeys = useMemo(() => {
        if (searchName?.trim()) {
            return autoExpandedKeys
        }
        return expandedKeys
    }, [searchName, autoExpandedKeys, expandedKeys])

    return (
        <Tree
            showLine
            showIcon={false}
            expandedKeys={finalExpandedKeys}
            onExpand={(keys) => {
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
                        setSelectedQuestionBankId(qbId)
                    }
                } else {
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
    )
}
