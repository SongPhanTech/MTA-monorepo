import MemberSidebar, {
  createTreeData,
  type GroupKey,
} from "@components/features/thanh-lap-hoi-dong/member-sidebar"
import MemberTable, {
  type CouncilMemberType,
} from "@components/features/thanh-lap-hoi-dong/member-table"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { $Enums } from "@workspace/db"
import {
  useFindFirstEvaluationCouncil,
  useUpdateEvaluationCouncilMember,
} from "@workspace/db/hooks"
import { Button, Empty, Flex, message, Typography } from "antd"
import { BookPlus } from "lucide-react"
import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function EvaluationCouncilTab() {
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("all")
  const [expandedNodes, setExpandedNodes] = useState<string[]>(["specialized"])

  const { onOpen } = useDisclosure<{
    evaluationCouncilId?: string
    evaluationCouncilMemberId?: string
  }>({
    tag: "PutEvaluationCouncilMember",
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
            },
            include: {
              lecturer: {
                include: {
                  userProfile: {
                    include: {
                      donVi: true,
                      academicDegreeType: {
                        select: { sTen: true },
                      },
                      academicRankType: {
                        select: { sTen: true },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      {
        enabled: !!selectedEvaluationPeriodId,
      }
    )

  const categorizedMembers = useMemo(() => {
    if (!evaluationCouncil?.members) {
      return {
        leaders: [],
        secretary: [],
        advisory: [],
        nonCouncilMembers: [],
        specialized: {},
      }
    }

    const leaders: CouncilMemberType[] = []
    const secretary: CouncilMemberType[] = []
    const advisory: CouncilMemberType[] = []
    const nonCouncilMembers: CouncilMemberType[] = []
    const specialized: Record<string, CouncilMemberType[]> = {}

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
        secretary.push(member)
      } else if (hasAnyRole(member, [$Enums.EvaluationMemberRole.ADVISORY_BOARD])) {
        advisory.push(member)
      } else if (hasAnyRole(member, [$Enums.EvaluationMemberRole.NONCOUNCIL_MEMBERS])) {
        nonCouncilMembers.push(member)
      } else if (
        hasAnyRole(member, [
          $Enums.EvaluationMemberRole.SPECIALIZED,
          $Enums.EvaluationMemberRole.HEAD_SPECIALIZED,
        ])
      ) {
        const groupName = member.groupName || "Chưa phân nhóm"
        if (!specialized[groupName]) {
          specialized[groupName] = []
        }
        specialized[groupName].push(member)
      } else {
        leaders.push(member)
      }
    }

    return { leaders, secretary, advisory, nonCouncilMembers, specialized }
  }, [evaluationCouncil?.members])

  const treeData = useMemo(() => {
    const specializedGroups = Object.entries(categorizedMembers.specialized).map(
      ([groupName, members]) => ({
        key: groupName,
        label: groupName,
        count: members.length,
      })
    )

    return createTreeData(
      categorizedMembers.leaders.length,
      categorizedMembers.secretary.length,
      categorizedMembers.advisory.length,
      categorizedMembers.nonCouncilMembers.length,
      specializedGroups
    )
  }, [categorizedMembers])

  const displayedMembers = useMemo((): CouncilMemberType[] => {
    const { leaders, secretary, advisory, nonCouncilMembers, specialized } = categorizedMembers
    const allSpecialized = Object.values(specialized).flat()

    switch (selectedGroup) {
      case "all":
        return [...leaders, ...secretary, ...advisory, ...nonCouncilMembers, ...allSpecialized]
      case "leaders":
        return leaders
      case "secretary":
        return secretary
      case "advisory":
        return advisory
      case "nonCouncilMembers":
        return nonCouncilMembers
      case "specialized":
        return allSpecialized
      default:
        if (selectedGroup.startsWith("specialized-")) {
          const groupName = selectedGroup.replace("specialized-", "")
          return specialized[groupName] || []
        }
        return []
    }
  }, [selectedGroup, categorizedMembers])

  const currentGroupLabel = useMemo(() => {
    const findLabel = (nodes: typeof treeData): ReactNode => {
      for (const node of nodes) {
        if (node.key === selectedGroup) return node.label
        if (node.children) {
          const found = findLabel(node.children)
          if (found) return found
        }
      }
      return ""
    }
    return findLabel(treeData) || "Tất cả thành viên"
  }, [selectedGroup, treeData])

  const handleToggleNode = useCallback((key: string) => {
    setExpandedNodes((prev) =>
      prev.includes(key) ? prev.filter((n) => n !== key) : [...prev, key]
    )
  }, [])

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
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleEdit = useCallback(
    (id: string) => {
      onOpen({ evaluationCouncilMemberId: id })
    },
    [onOpen]
  )

  const totalMembers = evaluationCouncil?.members?.length || 0

  if (!isLoadingEvaluationCouncil && totalMembers === 0) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "calc(100vh - 200px)" }}>
        <Empty description="Chưa có thành viên nào" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button
            type="primary"
            icon={<BookPlus size={16} className="mr-1" />}
            onClick={() => {
              onOpen({ evaluationCouncilId: evaluationCouncil?.id })
            }}
          >
            Thêm thành viên hội đồng đánh giá
          </Button>
        </Empty>
      </Flex>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <Typography.Title level={4}>Danh sách thành viên hội đồng</Typography.Title>
        <Button
          type="primary"
          icon={<BookPlus size={16} />}
          onClick={() => {
            onOpen({ evaluationCouncilId: evaluationCouncil?.id })
          }}
        >
          Thêm thành viên
        </Button>
      </div>

      <div className="flex">
        <MemberSidebar
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          expandedNodes={expandedNodes}
          onToggleNode={handleToggleNode}
          treeData={treeData}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800">{currentGroupLabel}</span>
              <span className="text-sm text-gray-500">({displayedMembers.length} thành viên)</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <MemberTable
              data={displayedMembers}
              loading={isLoadingEvaluationCouncil}
              onEdit={handleEdit}
              onDelete={handleDeleteEvaluationCouncilMember}
            />
          </div>
        </div>
      </div>
    </>
  )
}
