import { UserOutlined } from "@ant-design/icons"
import type { Prisma } from "@workspace/db/client"
import { getMinioUrl } from "@workspace/libs/utils"

export type BaseTreeItem = {
  id: string
  title?: string
  value: string // dữ liệu là id
  selectable?: boolean // true nếu là profile, false nếu là organization
  checkable?: boolean // true nếu là profile, false nếu là organization
  icon?: React.ReactNode // icon hiển thị trong tree
  children?: BaseTreeItem[]
}

export type OrgProfileTreeItem = BaseTreeItem & {
  parentId?: string | null
  organizationType?: string
}

export function buildOrgProfileTree(
  rawList: Array<
    Prisma.DM_DonViGetPayload<false> & {
      lecturers?: Array<
        Prisma.LecturerGetPayload<{
          include: {
            userProfile: {
              select: {
                id: true
                fullname: true
                firstName: true
                lastName: true
                avatar: true
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
        }>
      >
    }
  >,
  rootId?: string | null,
  selectOrg?: boolean
): OrgProfileTreeItem[] {
  const map = new Map<string, OrgProfileTreeItem>()
  const roots: OrgProfileTreeItem[] = []

  // B1: Convert raw objects to OrgItem
  for (const org of rawList) {
    const item: OrgProfileTreeItem = {
      id: org.Id,
      title: org.sTen ?? undefined,
      value: org.Id,
      parentId: org.sParentId,
      selectable: selectOrg,
      children: org.lecturers
        ? org.lecturers.flatMap((lecturer) => {
            const profile = lecturer.userProfile
            if (!profile) return []

            const academicRank = profile.academicRankType?.sTen || ""
            const degree = profile.academicDegreeType?.sTen || ""
            const fullName =
              profile.fullname ||
              `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
              "-"
            const academicTitle = [academicRank, degree].filter(Boolean).join(".")
            const title = `${lecturer.code ? `${lecturer.code} - ` : ""}${academicTitle ? `${academicTitle} ` : ""}${fullName}`

            return [
              {
                id: lecturer.id,
                title,
                value: lecturer.id,
                selectable: true,
                icon: profile.avatar ? (
                  <img
                    src={getMinioUrl(profile.avatar)}
                    alt={profile.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserOutlined />
                  </div>
                ),
              },
            ]
          })
        : [],
    }
    map.set(item.id, item)
  }

  // B2: Xây cây từ map
  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)
      if (!parent) {
        continue
      }
      parent.children?.push(item)
    } else {
      roots.push(item)
    }
  }

  // B3: Xử lý rootId - lọc cây theo root được chỉ định
  if (rootId) {
    const specificRoot = map.get(rootId)
    if (specificRoot) {
      return [specificRoot]
    }
    // Nếu rootId không tồn tại trong dữ liệu, trả về mảng rỗng
    return []
  }

  return roots
}
