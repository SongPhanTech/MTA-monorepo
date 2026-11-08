import type { DefaultError, UseQueryOptions } from "@tanstack/react-query"
import { Store, useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db"
import type { Prisma } from "@workspace/db/client"
import { useFindManyTrainingObjectType, useFindUniqueUserProfile } from "@workspace/db/hooks"
import { useGetUserPermissionsPermissionAppCodeUserId } from "@workspace/libs/api/system"
import { isDevEnvironment } from "@workspace/libs/utils"
import type { ExtraQueryOptions } from "@zenstackhq/tanstack-query/runtime-v5"
import { useEffect, useMemo } from "react"
import { selectFixedClass } from "../select-fixed-class"
import { selectTrainingCourse } from "../select-training-course"
import { selectTrainingMajor } from "../select-training-major"

export type TrainingObjectTypeState = {
  selectedTrainingObjectTypeId?: string
}

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
  const { data: session } = useSession()
  const profileId =
    session?.sDM_NhanVienId ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MOCK_USER_PROFILE_ID : undefined)

  // Truy vấn quá trình học tập của tài khoản (nếu là học viên/sinh viên)
  const { data: userProfile } = useFindUniqueUserProfile(
    {
      where: { id: profileId! },
      select: {
        bLaHocVien: true,
        bLaSinhVien: true,
        educationAndTraining: {
          select: {
            fixedClass: {
              select: {
                trainingCourse: {
                  select: {
                    trainingObjectType: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                        active: true,
                        type: true,
                      },
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
    const map = new Map<string, any>()
    userProfile.educationAndTraining.forEach((et) => {
      const tot = et.fixedClass?.trainingCourse?.trainingObjectType
      if (tot?.id && tot.active !== false) {
        map.set(tot.id, tot)
      }
    })
    return Array.from(map.values())
  }, [userProfile])

  const isStudent = useMemo(() => {
    return Boolean(
      userProfile?.bLaHocVien ||
      userProfile?.bLaSinhVien ||
      studentTrainingObjectTypes.length > 0
    )
  }, [userProfile, studentTrainingObjectTypes])

  const { data: permission } = useGetUserPermissionsPermissionAppCodeUserId(
    "lms",
    window?.contextData?.userId ?? ""
  )

  const permissions = useMemo(() => {
    if (permission?.status !== 200) return []
    return (permission?.data as any)?.Roles || []
  }, [permission])

  const res = useFindManyTrainingObjectType(
    {
      where: {
        active: true,
        ...(isStudent && studentTrainingObjectTypes.length > 0
          ? {
              id: { in: studentTrainingObjectTypes.map((item) => item.id) },
            }
          : isDevEnvironment() || options?.subsystem === "ems"
            ? {}
            : {
                vaiTro: {
                  hasSome: permissions.map((item: any) => item.sRoleId).filter(Boolean),
                },
              }),
      },
      orderBy: { name: "asc" },
      ...(args as any),
    },
    {
      ...options,
      enabled: options?.enabled !== false && (!profileId || userProfile !== undefined),
    } as any
  )

  return res
}
