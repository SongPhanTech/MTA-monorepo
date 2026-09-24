import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { EVALUATION_MEMBER_ROLE_MAP } from "@constants/constants"
import type { Prisma } from "@workspace/db/client"
import { Flex, Row } from "antd"

export type CouncilMemberType = Prisma.EvaluationCouncilMemberGetPayload<{
  include: {
    lecturer: {
      include: {
        userProfile: {
          select: {
            fullname: true
            firstName: true
            lastName: true
            phoneNumber: true
            email: true
            donVi: {
              select: {
                sTen: true
              }
            }
            academicDegreeType: {
              select: {
                sTen: true
              }
            }
            academicRankType: {
              select: {
                sTen: true
              }
            }
          }
        }
      }
    }
  }
}>

interface MemberTableProps {
  data: CouncilMemberType[]
  loading?: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const MemberTable = ({ data, onDelete, onEdit, loading }: MemberTableProps) => {
  const getMemberName = (record: CouncilMemberType) => {
    const academicRank = record?.lecturer?.userProfile?.academicRankType?.sTen || ""
    const degree = record?.lecturer?.userProfile?.academicDegreeType?.sTen || ""

    const fullName = record?.lecturer?.userProfile?.fullname
      ? record?.lecturer?.userProfile?.fullname
      : `${record?.lecturer?.userProfile?.lastName || ""} ${record?.lecturer?.userProfile?.firstName || ""}`.trim()

    const academicTitle = [academicRank, degree].filter(Boolean).join(".")

    return academicTitle ? `${academicTitle} ${fullName}` : fullName
  }

  return (
    <Table
      rowKey="id"
      columns={[
        {
          title: "STT",
          width: 60,
          align: "center",
          render: (_, __, index) => <span className="text-gray-500">{index + 1}</span>,
        },
        {
          title: "Tên đồng chí",
          width: 220,
          render: (_, record) => (
            <span className="font-medium text-gray-800">
              {getMemberName(record as CouncilMemberType)}
            </span>
          ),
        },
        {
          title: "Số điện thoại",
          width: 120,
          render: (_, record) => (
            <span className="text-gray-600">
              {record?.lecturer?.userProfile?.phoneNumber || "-"}
            </span>
          ),
        },
        {
          title: "Email",
          width: 220,
          render: (_, record) => <span>{record?.lecturer?.userProfile?.email || "-"}</span>,
        },
        {
          title: "Đơn vị",
          width: 180,
          render: (_, record) => (
            <span className="text-gray-600">{record?.lecturer?.userProfile?.donVi?.sTen || "-"}</span>
          ),
        },
        {
          title: "Chức vụ trong HĐ",
          width: 200,
          render: (_, record) => {
            if (!record.role) return "-"

            const roles = Array.isArray(record.role) ? record.role : [record.role]

            return (
              <Flex gap={4} wrap="wrap">
                {roles.map((role, index) => (
                  <span>
                    {EVALUATION_MEMBER_ROLE_MAP[role as keyof typeof EVALUATION_MEMBER_ROLE_MAP] ||
                      role}
                  </span>
                ))}
              </Flex>
            )
          },
        },
        {
          title: "Thao tác",
          width: 80,
          align: "center",
          render: (_, record) => (
            <Row className="justify-center gap-2">
              <EditIcon
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(record.id)
                }}
                className="text-sm text-blue-700 cursor-pointer hover:text-blue-500 transition-colors"
              />
              <DeleteIcon
                popConfirm={{
                  onConfirm: (e) => {
                    onDelete(record.id)
                    e?.stopPropagation()
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </Row>
          ),
        },
      ]}
      data={data}
      loading={loading}
    />
  )
}
export default MemberTable
