import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { buildOrgTree, type OrgTreeItem } from "@lib/utils"
import type { Prisma, QuestionBank } from "@workspace/db/client"
import { Space, Tooltip, Tree } from "antd"
import { BookOpen, BookPlus, Building2, Database, FileText } from "lucide-react"
import type React from "react"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"
import type { PutQuestionBankInput } from ".."

type DonViType = Prisma.DM_DonViGetPayload<{
  include: {
    subjects: {
      include: {
        subjectVersion: {
          include: {
            questionBanks: true
            _count: {
              select: {
                examFramework: true
              }
            }
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
  onOpenPutQuestionBank: (input?: PutQuestionBankInput) => void
  handleDeleteQuestionBank: (id: string) => void
  onOpenNganHangKhungDe: (input: { subjectVersionId: string }) => void
}

const OrganizationTitle = memo(({ code, name }: { code: string | null; name: string }) => (
  <Space align="center">
    <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
    <span className="font-semibold">
      {code ? `${code} - ` : ""}
      {name}
    </span>
  </Space>
))
OrganizationTitle.displayName = "OrganizationTitle"

const SubjectTitle = memo(({ code, name }: { code: string | null; name: string }) => (
  <Space align="center">
    <BookOpen className="w-4 h-4 flex-shrink-0 text-purple-600" />
    <span className="font-medium">
      {code ? `${code} - ` : ""}
      {name}
    </span>
  </Space>
))
SubjectTitle.displayName = "SubjectTitle"

const SubjectVersionTitle = memo(
  ({
    code,
    name,
    versionId,
    examFrameworkCount,
    onOpenPutQuestionBank,
    onOpenNganHangKhungDe,
  }: {
    code: string | null
    name: string
    versionId: string
    examFrameworkCount: number
    onOpenPutQuestionBank: (input?: PutQuestionBankInput) => void
    onOpenNganHangKhungDe: (input: { subjectVersionId: string }) => void
  }) => {
    const handleAddClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onOpenPutQuestionBank({ subjectVersionId: versionId })
      },
      [versionId, onOpenPutQuestionBank]
    )

    const handleBadgeClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onOpenNganHangKhungDe({ subjectVersionId: versionId })
      },
      [versionId, onOpenNganHangKhungDe]
    )

    return (
      <div className="flex items-center w-full py-2 relative pr-8">
        <Space size="middle" align="center">
          <FileText className="w-4 h-4 flex-shrink-0 text-orange-600" />
          <span className="font-medium">
            {code ? `${code} - ` : ""}
            {name}
          </span>
          {examFrameworkCount > 0 && (
            <Tooltip title={`${examFrameworkCount} khung đề`}>
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full cursor-pointer hover:bg-green-200"
                onClick={handleBadgeClick}
              >
                {examFrameworkCount}
              </span>
            </Tooltip>
          )}
        </Space>
        <Tooltip title="Thêm mới" placement="top">
          <BookPlus
            className="text-[#028850] flex-shrink-0 cursor-pointer absolute right-0"
            size={17}
            onClick={handleAddClick}
          />
        </Tooltip>
      </div>
    )
  }
)
SubjectVersionTitle.displayName = "SubjectVersionTitle"

const QuestionBankTitle = memo(
  ({
    qb,
    onOpenPutQuestionBank,
    handleDeleteQuestionBank,
  }: {
    qb: QuestionBank
    onOpenPutQuestionBank: (input?: PutQuestionBankInput) => void
    handleDeleteQuestionBank: (id: string) => void
  }) => {
    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onOpenPutQuestionBank({ id: qb.id })
      },
      [qb.id, onOpenPutQuestionBank]
    )

    const handleDeleteConfirm = useCallback(
      (e?: React.MouseEvent) => {
        e?.stopPropagation()
        handleDeleteQuestionBank(qb.id)
      },
      [qb.id, handleDeleteQuestionBank]
    )

    return (
      <div className="flex items-center justify-between w-full py-2">
        <Space size="middle" align="center">
          <Database className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span className="font-medium">{qb.name}</span>
        </Space>
        <div className="flex items-center gap-2 ml-5" onClick={(e) => e.stopPropagation()}>
          <EditIcon
            onClick={handleEditClick}
            className="text-blue-700 cursor-pointer flex-shrink-0 w-4 h-4"
          />
          <DeleteIcon
            popConfirm={{
              onConfirm: handleDeleteConfirm,
            }}
          />
        </div>
      </div>
    )
  }
)
QuestionBankTitle.displayName = "QuestionBankTitle"

export default function QuestionBankTree({
  searchName,
  expandedKeys,
  setExpandedKeys,
  setSelectedQuestionBankId,
  donViData,
  onOpenPutQuestionBank,
  handleDeleteQuestionBank,
  onOpenNganHangKhungDe,
}: QuestionBankTreeProps) {
  const processedData = useMemo(() => {
    const normalizedSearch = searchName?.toLowerCase().trim() || ""
    const keysToExpand: React.Key[] = []

    const matchesSearch = (text: string | null | undefined, code: string | null | undefined) => {
      if (!normalizedSearch) return true
      if (!text && !code) return false
      return (
        text?.toLowerCase().includes(normalizedSearch) ||
        code?.toLowerCase().includes(normalizedSearch)
      )
    }

    const orgMap = new Map(donViData.map((org) => [org.Id, org]))

    const buildDataStructure = (orgTreeItems: OrgTreeItem[]): any[] => {
      return orgTreeItems
        .map((orgItem): any => {
          const org = orgMap.get(orgItem.value)
          if (!org) return null

          const orgKey = `org-${org.Id}`
          const orgMatches = matchesSearch(org.sTen, org.sMa)

          const subjectData = (org.subjects || []).reduce((subjects: any[], subject: any) => {
            const subjectKey = `sub-${subject.id}`
            const subjectMatches = matchesSearch(subject.name, subject.code)

            const versionData = (subject.subjectVersion || []).reduce(
              (versions: any[], version: any) => {
                const versionKey = `ver-${version.id}`
                const versionMatches = matchesSearch(version.name, version.code)

                const bankData = (version.questionBanks || [])
                  .filter((qb: QuestionBank) => qb.deletedAt === null)
                  .map((qb: QuestionBank) => {
                    const qbMatches = matchesSearch(qb.name, qb.code)
                    return {
                      key: `qb-${qb.id}`,
                      isLeaf: true,
                      qb,
                      matches: qbMatches,
                    }
                  })
                  .filter(
                    (item: {
                      matches: boolean
                      key: string
                      isLeaf: boolean
                      qb: QuestionBank
                    }) => {
                      if (!normalizedSearch) return true
                      return orgMatches || subjectMatches || versionMatches || item.matches
                    }
                  )

                if (normalizedSearch) {
                  const hasMatch =
                    orgMatches || subjectMatches || versionMatches || bankData.length > 0

                  if (!hasMatch) {
                    return versions
                  }

                  keysToExpand.push(orgKey, subjectKey, versionKey)
                }

                versions.push({
                  key: versionKey,
                  children: bankData,
                  version,
                })
                return versions
              },
              []
            )

            if (normalizedSearch && versionData.length === 0 && !subjectMatches) {
              return subjects
            }

            if (normalizedSearch && versionData.length > 0) {
              keysToExpand.push(subjectKey)
            }

            subjects.push({
              key: subjectKey,
              children: versionData,
              subject,
            })
            return subjects
          }, [])

          const childOrgData = orgItem.children ? buildDataStructure(orgItem.children) : []

          const allChildren = [...subjectData, ...childOrgData]

          if (normalizedSearch && allChildren.length === 0 && !orgMatches) {
            return null
          }

          if (normalizedSearch && allChildren.length > 0) {
            keysToExpand.push(orgKey)
          }

          return {
            key: orgKey,
            children: allChildren,
            org,
          }
        })
        .filter((node): node is any => node !== null)
    }

    const orgTree = buildOrgTree(
      donViData.map((org) => ({
        Id: org.Id,
        sTen: org.sTen,
        sParentId: org.sParentId,
        sMa: org.sMa,
      }))
    )

    const dataStructure = buildDataStructure(orgTree)

    return {
      dataStructure,
      autoExpandedKeys: normalizedSearch ? Array.from(new Set(keysToExpand)) : [],
    }
  }, [donViData, searchName])

  const treeData = useMemo(() => {
    const convertToTreeNodes = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        if (node.qb) {
          return {
            key: node.key,
            title: (
              <QuestionBankTitle
                qb={node.qb}
                onOpenPutQuestionBank={onOpenPutQuestionBank}
                handleDeleteQuestionBank={handleDeleteQuestionBank}
              />
            ),
            isLeaf: true,
            data: node.qb,
          }
        }

        if (node.version) {
          return {
            key: node.key,
            title: (
              <SubjectVersionTitle
                code={node.version.code}
                name={node.version.name}
                versionId={node.version.id}
                examFrameworkCount={node.version._count?.examFramework ?? 0}
                onOpenPutQuestionBank={onOpenPutQuestionBank}
                onOpenNganHangKhungDe={onOpenNganHangKhungDe}
              />
            ),
            children: convertToTreeNodes(node.children || []),
            data: node.version,
          }
        }

        if (node.subject) {
          return {
            key: node.key,
            title: <SubjectTitle code={node.subject.code} name={node.subject.name} />,
            children: convertToTreeNodes(node.children || []),
            data: node.subject,
          }
        }

        if (node.org) {
          return {
            key: node.key,
            title: <OrganizationTitle code={node.org.sMa} name={node.org.sTen} />,
            children: convertToTreeNodes(node.children || []),
            data: node.org,
          }
        }

        return node
      })
    }

    return convertToTreeNodes(processedData.dataStructure)
  }, [processedData.dataStructure, onOpenPutQuestionBank, handleDeleteQuestionBank, onOpenNganHangKhungDe])

  const previousSearchRef = useRef<string>("")

  useEffect(() => {
    const currentSearch = searchName?.trim() || ""
    const hadSearch = previousSearchRef.current !== ""
    const hasSearch = currentSearch !== ""

    if (hadSearch !== hasSearch) {
      if (hasSearch) {
        setExpandedKeys(processedData.autoExpandedKeys)
      } else {
        setExpandedKeys([])
      }
    }

    previousSearchRef.current = currentSearch
  }, [searchName, processedData.autoExpandedKeys, setExpandedKeys])

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      setExpandedKeys(keys)
    },
    [setExpandedKeys]
  )

  const handleSelect = useCallback(
    (_: React.Key[], info: any) => {
      const key = info.node.key as string

      if (key.startsWith("qb-")) {
        const qbId = key.replace("qb-", "")
        setSelectedQuestionBankId(qbId)
      } else {
        const isExpanded = expandedKeys.includes(key)
        if (isExpanded) {
          setExpandedKeys(expandedKeys.filter((k) => k !== key))
        } else {
          setExpandedKeys([...expandedKeys, key])
        }
      }
    },
    [expandedKeys, setExpandedKeys, setSelectedQuestionBankId]
  )

  return (
    <Tree
      showLine
      showIcon={false}
      expandedKeys={expandedKeys}
      autoExpandParent={false}
      onExpand={handleExpand}
      onSelect={handleSelect}
      treeData={treeData}
      virtual
      height={800}
    />
  )
}
