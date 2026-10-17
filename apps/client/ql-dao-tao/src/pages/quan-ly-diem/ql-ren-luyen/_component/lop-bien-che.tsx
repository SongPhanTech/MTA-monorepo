import { useSession } from "@workspace/auth/react"
import {
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useFindUniqueLecturer,
  useFindUniqueStaff,
} from "@workspace/db/hooks"
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
  const { data: session } = useSession()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: currentLecturer, isLoading: isLoadingLecturer } = useFindUniqueLecturer(
    {
      where: {
        userProfileId: session?.sDM_NhanVienId || "",
      },
    },
    {
      enabled: !!session?.sDM_NhanVienId,
    }
  )

  const { data: currentStaff, isLoading: isLoadingStaff } = useFindUniqueStaff(
    {
      where: {
        userProfileId: session?.sDM_NhanVienId || "",
      },
    },
    {
      enabled: !!session?.sDM_NhanVienId,
    }
  )

  const isClassManager = !!currentLecturer?.id || !!currentStaff?.id

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

  const buildFixedClassWhere = () => {
    const baseWhere = {
      trainingCourse: {
        id: { in: trainingCourses.map((course) => course.id) },
        trainingObjectTypeId: objectTrainingTypeId ? objectTrainingTypeId : undefined,
      },
      name: className ? { contains: className } : undefined,
    }

    const orConditions: Array<{ lecturerManagementId: string } | { staffManagementId: string }> = []

    if (currentLecturer?.id) {
      orConditions.push({ lecturerManagementId: currentLecturer.id })
    }

    if (currentStaff?.id) {
      orConditions.push({ staffManagementId: currentStaff.id })
    }

    if (orConditions.length === 0) {
      return {
        ...baseWhere,
        id: "no-match",
      }
    }

    return {
      ...baseWhere,
      OR: orConditions,
    }
  }

  const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass(
    {
      where: buildFixedClassWhere(),
    },
    {
      enabled: !isLoadingLecturer && !isLoadingStaff,
    }
  )

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
        {isClassManager && (
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
            expandAction="click"
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
          <p>
            {isClassManager
              ? "Bạn chưa được phân công quản lý lớp nào."
              : "Không có lớp quản lý để hiển thị."}
          </p>
        )}
      </div>
    </div>
  )
}

export default LopBienCheItem
