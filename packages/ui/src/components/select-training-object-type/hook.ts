import type { DefaultError, UseQueryOptions } from "@tanstack/react-query"
import { Store, useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db"
import type { Prisma } from "@workspace/db/client"
import { useFindManyTrainingObjectType, useFindUniqueUserProfile } from "@workspace/db/hooks"
import { useGetPermission } from "@workspace/libs/api/get-permission"
import { isDevEnvironment } from "@workspace/libs/utils"
import type { ExtraQueryOptions } from "@zenstackhq/tanstack-query/runtime-v5"
import { useEffect, useMemo } from "react"
import { selectFixedClass } from "../select-fixed-class"
import { selectTrainingCourse } from "../select-training-course"
import { selectTrainingMajor } from "../select-training-major"

declare global {
  interface Window {
    contextData?: {
      userId: string
      userName: string
      organizationId: string
    }
  }
}

export type TrainingObjectTypeState = {
  selectedTrainingObjectTypeId?: string
}

const TRAINING_OBJECT_TYPE_SELECT = {
  id: true,
  name: true,
  code: true,
  active: true,
  type: true,
} satisfies Prisma.TrainingObjectTypeSelect

type StudentTrainingObjectType = Prisma.TrainingObjectTypeGetPayload<{
  select: typeof TRAINING_OBJECT_TYPE_SELECT
}>

export const trainingObjectTypeStore = new Store<TrainingObjectTypeState>({
  selectedTrainingObjectTypeId: undefined,
})

export const selectTrainingObjectType = (id: string) => {
  const prevId = trainingObjectTypeStore.state.selectedTrainingObjectTypeId
  localStorage.setItem("selectedTrainingObjectTypeId", id)
  trainingObjectTypeStore.setState((prev) => ({
    ...prev,
    selectedTrainingObjectTypeId: id,
  }))
  // Đổi ĐTĐT → khóa/ngành/lớp cũ (localStorage) không còn hợp lệ; nếu giữ sẽ gọi API 200 với data []
  if (prevId && prevId !== id) {
    selectTrainingCourse()
    selectTrainingMajor()
    selectFixedClass()
  }
}

export const useTrainingObjectTypeStore = () => {
  const { selectedTrainingObjectTypeId } = useStore(trainingObjectTypeStore)

  const getLabel = (type?: $Enums.TrainingObjectTypes) => {
    switch (type) {
      case $Enums.TrainingObjectTypes.CIVILIAN:
        return "Dân sự"
      case $Enums.TrainingObjectTypes.INTERNATIONAL_MILITARY:
        return "Quốc tế"
      // case $Enums.TrainingObjectTypes.MILITARY:
      //     return 'Quân sự'
      default:
        return "Quân sự"
    }
  }

  useEffect(() => {
    const idLocalStorage = localStorage.getItem("selectedTrainingObjectTypeId")
    if (idLocalStorage) {
      selectTrainingObjectType(idLocalStorage)
    }
  }, [])
  return { id: selectedTrainingObjectTypeId, onSelect: selectTrainingObjectType, getLabel }
}

export function useFindManyTrainingObjectTypePermission<
  TArgs extends Prisma.TrainingObjectTypeFindManyArgs,
  TQueryFnData = Array<Prisma.TrainingObjectTypeGetPayload<TArgs> & { $optimistic?: boolean }>,
  TData = TQueryFnData,
  TError = DefaultError,
>(
  args?: Prisma.SelectSubset<TArgs, Prisma.TrainingObjectTypeFindManyArgs>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData>, "queryKey"> &
    ExtraQueryOptions & {
      subsystem?: string
    }
) {
  const { data: session, status: sessionStatus } = useSession()
  const profileId =
    session?.sDM_NhanVienId ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MOCK_USER_PROFILE_ID : undefined)

  // Truy vấn quá trình học tập của tài khoản (nếu là học viên/sinh viên)
  const { data: userProfile, isLoading: isUserProfileLoading } = useFindUniqueUserProfile(
    {
      where: { id: profileId! },
      select: {
        bLaHocVien: true,
        bLaSinhVien: true,
        bLaCanBoNhanVien: true,
        educationAndTraining: {
          where: {
            deletedAt: null,
          },
          select: {
            fixedClass: {
              select: {
                trainingCourse: {
                  select: {
                    trainingObjectType: {
                      select: TRAINING_OBJECT_TYPE_SELECT,
                    },
                  },
                },
                curriculumVersion: {
                  select: {
                    trainingObjectType: {
                      select: TRAINING_OBJECT_TYPE_SELECT,
                    },
                    trainingCourse: {
                      select: {
                        trainingObjectType: {
                          select: TRAINING_OBJECT_TYPE_SELECT,
                        },
                      },
                    },
                  },
                },
              },
            },
            curriculumVersion: {
              select: {
                trainingObjectType: {
                  select: TRAINING_OBJECT_TYPE_SELECT,
                },
                trainingCourse: {
                  select: {
                    trainingObjectType: {
                      select: TRAINING_OBJECT_TYPE_SELECT,
                    },
                  },
                },
              },
            },
            curriculumVersionParallel: {
              select: {
                trainingObjectType: {
                  select: TRAINING_OBJECT_TYPE_SELECT,
                },
                trainingCourse: {
                  select: {
                    trainingObjectType: {
                      select: TRAINING_OBJECT_TYPE_SELECT,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!profileId,
    }
  )

  const studentTrainingObjectTypes = useMemo(() => {
    if (!userProfile?.educationAndTraining?.length) return []
    const map = new Map<string, StudentTrainingObjectType>()
    userProfile.educationAndTraining.forEach((et) => {
      const candidates = [
        et.fixedClass?.trainingCourse?.trainingObjectType,
        et.fixedClass?.curriculumVersion?.trainingObjectType,
        et.fixedClass?.curriculumVersion?.trainingCourse?.trainingObjectType,
        et.curriculumVersion?.trainingObjectType,
        et.curriculumVersion?.trainingCourse?.trainingObjectType,
        et.curriculumVersionParallel?.trainingObjectType,
        et.curriculumVersionParallel?.trainingCourse?.trainingObjectType,
      ]
      for (const tot of candidates) {
        if (tot?.id && tot.active !== false) {
          map.set(tot.id, tot)
        }
      }
    })
    return Array.from(map.values())
  }, [userProfile])

  const isStudent = useMemo(() => {
    // Cán bộ nhân viên quản lý/quản trị không bị giới hạn đối tượng đào tạo như học viên
    if (userProfile?.bLaCanBoNhanVien) return false

    return Boolean(
      userProfile?.bLaHocVien || userProfile?.bLaSinhVien || studentTrainingObjectTypes.length > 0
    )
  }, [userProfile, studentTrainingObjectTypes])

  const { data: permission } = useGetPermission(
    "lms",
    (typeof window !== "undefined" ? window.contextData?.userId : "") ?? ""
  )

  const permissions = useMemo(() => {
    if (permission?.status !== 200) return []
    return permission.data.Roles ?? []
  }, [permission])

  const whereCondition = useMemo((): Prisma.TrainingObjectTypeWhereInput => {
    const baseWhere: Prisma.TrainingObjectTypeWhereInput = {
      active: true,
      ...args?.where,
    }

    if (isStudent) {
      if (studentTrainingObjectTypes.length > 0) {
        return {
          ...baseWhere,
          id: { in: studentTrainingObjectTypes.map((item) => item.id) },
        }
      }
      if (userProfile?.bLaHocVien && !userProfile?.bLaSinhVien) {
        return {
          ...baseWhere,
          type: $Enums.TrainingObjectTypes.MILITARY,
        }
      }
      if (userProfile?.bLaSinhVien && !userProfile?.bLaHocVien) {
        return {
          ...baseWhere,
          type: $Enums.TrainingObjectTypes.CIVILIAN,
        }
      }
      return {
        ...baseWhere,
        id: { in: [] },
      }
    }

    if (isDevEnvironment() || options?.subsystem === "ems") {
      return baseWhere
    }

    return {
      ...baseWhere,
      vaiTro: {
        hasSome: permissions.map((item) => item.sRoleId).filter((id): id is string => Boolean(id)),
      },
    }
  }, [
    isStudent,
    studentTrainingObjectTypes,
    userProfile,
    permissions,
    options?.subsystem,
    args?.where,
  ])

  const isQueryReady =
    sessionStatus !== "loading" &&
    (!profileId || (!isUserProfileLoading && userProfile !== undefined))

  const queryArgs = {
    ...(args as Prisma.TrainingObjectTypeFindManyArgs | undefined),
    where: whereCondition,
    orderBy: { name: "asc" },
  } satisfies Prisma.TrainingObjectTypeFindManyArgs

  const res = useFindManyTrainingObjectType(queryArgs, {
    ...options,
    enabled: options?.enabled !== false && isQueryReady,
  })

  return res
}
