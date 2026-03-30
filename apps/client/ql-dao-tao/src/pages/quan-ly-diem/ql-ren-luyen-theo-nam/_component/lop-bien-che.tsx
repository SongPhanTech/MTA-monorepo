import { useSession } from "@workspace/auth/react"
import {
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useFindUniqueLecturer,
  useFindUniqueStaff,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Tree } from "antd"
import type React from "react"

interface LopBienCheItemProps {
  onChangeSelected?: (selected: string) => void
  className?: string
  objectTrainingTypeId?: string
}

const LopBienCheItem: React.FC<LopBienCheItemProps> = ({
  onChangeSelected,
  className,
  objectTrainingTypeId,
}) => {
  const { can } = useAbility()
  const { data: session } = useSession()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  // Kiểm tra quyền XEM_TAT_CA
  const canViewAll = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN, "XEM_TAT_CA")

  // Lấy thông tin Lecturer của user hiện tại (nếu có)
  const { data: currentLecturer, isLoading: isLoadingLecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: session?.sDM_NhanVienId || "",
      },
    },
    {
      enabled: !!session?.sDM_NhanVienId && !canViewAll,
    }
  )

  // Lấy thông tin Staff của user hiện tại (nếu có)
  const { data: currentStaff, isLoading: isLoadingStaff } = useFindUniqueStaff(
    {
      where: {
        userProfileId: session?.sDM_NhanVienId || "",
      },
    },
    {
      enabled: !!session?.sDM_NhanVienId && !canViewAll,
    }
  )

  // Xác định xem user có phải là người quản lý lớp hay không
  const isManager = !canViewAll && (!!currentLecturer?.id || !!currentStaff?.id)

  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    where: {
      trainingObjectTypeId,
      deletedAt: null,
      active: true,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  // Xây dựng điều kiện filter cho FixedClass
  const buildFixedClassWhere = () => {
    const baseWhere = {
      trainingCourse: {
        id: { in: trainingCourses.map((course) => course.id) },
        trainingObjectTypeId: objectTrainingTypeId ? objectTrainingTypeId : undefined,
      },
      name: className ? { contains: className } : undefined,
    }

    // Nếu có quyền xem tất cả -> không filter thêm
    if (canViewAll) {
      return baseWhere
    }

    // Nếu không có quyền xem tất cả -> filter theo lecturer hoặc staff
    const orConditions: any[] = []

    if (currentLecturer?.id) {
      orConditions.push({ lecturerManagementId: currentLecturer.id })
    }

    if (currentStaff?.id) {
      orConditions.push({ staffManagementId: currentStaff.id })
    }

    // Nếu không có lecturer và staff thì trả về điều kiện không khớp gì
    if (orConditions.length === 0) {
      return {
        ...baseWhere,
        id: "no-match", // Điều kiện không khớp
      }
    }

    return {
      ...baseWhere,
      OR: orConditions,
    }
  }

  // Lấy danh sách Fixed Classes
  const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass({
    where: buildFixedClassWhere(),
  })

  // Tạo cấu trúc cây từ dữ liệu
  const treeData = trainingCourses
    .map((course) => {
      const children = fixedClasses
        .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
        .map((fixedClass) => ({
          title: fixedClass.name || `Lớp ${fixedClass.id}`,
          key: `${fixedClass.id}`,
        }))

      if (children.length === 0) return null

      return {
        title: course.name || `Khoá học ${course.id}`,
        key: `course-${course.id}`,
        children,
      }
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null)

  const isLoading = isLoadingLecturer || isLoadingStaff || fixedClassesLoading

  return (
    <div style={{ width: "100%", padding: "16px", borderRadius: "8px" }}>
      <h2 className="text-lg font-semibold px-[6]" style={{ marginBottom: "12px" }}>
        Danh sách lớp
        {isManager && (
          <span className="text-sm font-normal text-gray-500 block">(Lớp bạn quản lý)</span>
        )}
      </h2>
      <div style={{ maxHeight: 500, overflowY: "auto" }}>
        {isLoading ? (
          <p>Đang tải...</p>
        ) : treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            showLine
            blockNode
            onSelect={(selectedKeys) => {
              if (selectedKeys.length > 0) {
                const selectedKey = selectedKeys[0] as string
                if (!selectedKey.startsWith("course-")) {
                  onChangeSelected?.(selectedKey)
                }
              }
            }}
          />
        ) : (
          <p>{isManager ? "Bạn chưa được phân công lớp nào." : "Không có dữ liệu để hiển thị."}</p>
        )}
      </div>
    </div>
  )
}

export default LopBienCheItem
