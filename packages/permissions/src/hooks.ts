import NAVIGATION, {
  type CONG_GIANG_VIEN_PERMISSION,
  type CONG_HOC_VIEN_PERMISSION,
  type CONG_SINH_VIEN_PERMISSION,
  type KHAO_THI_PERMISSION,
  type MenuItem,
  type QL_DAO_TAO_PERMISSION,
  type QL_HO_SO_PERMISSION,
  ROUTER_PATH,
  type TRO_LY_AO_PERMISSION,
} from "@workspace/router"
import { useMemo } from "react"
import {
  type getPermissionResponse,
  useGetPermission,
} from "../../libs/src/api/get-permission"
import { useGetUserPermissionsAccessLevelAppCodeUserId } from "../../libs/src/api/system"
import { getRuntimeEnv } from "../../libs/src/utils"
import ability from "./ability"

declare global {
  interface Window {
    contextData?: {
      userId: string
      userName: string
      organizationId: string
    }
    MTAMenuComponents?: any
    tenantCode?: string
    docEditor: any
  }
}

const PERMISSIONS = {
  XEM: 1 << 0,
  XEM_TAT_CA: 1 << 1,
  XEM_CHI_TIET: 1 << 2,
  THEM: 1 << 3,
  SUA: 1 << 4,
  IN: 1 << 5,
  NHAP_EXCEL: 1 << 6,
  XUAT_EXCEL: 1 << 7,
  TAI_TEP: 1 << 8,
  NHAP_DIEM: 1 << 9,
  DUYET: 1 << 10,
  IN_PHIEU_DIEM: 1 << 11,
  IN_DS_THI: 1 << 12,
  XOA: 1 << 13,
} as const

function combine(perms: (keyof typeof PERMISSIONS)[]): number {
  return perms.map((p) => PERMISSIONS[p]).reduce((mask, p) => mask | p, 0)
}

const useAbility = () => {
  return {
    can: (
      subject:
        | KHAO_THI_PERMISSION
        | CONG_SINH_VIEN_PERMISSION
        | CONG_HOC_VIEN_PERMISSION
        | QL_DAO_TAO_PERMISSION
        | TRO_LY_AO_PERMISSION
        | QL_HO_SO_PERMISSION
        | CONG_GIANG_VIEN_PERMISSION,
      ...action: (keyof typeof PERMISSIONS)[]
    ) => {
      if (
        process?.env?.NODE_ENV === "development" ||
        window?.location.host?.startsWith("localhost") ||
        window?.contextData?.userName === "superadmin"
      )
        return true
      const perm = ability.actionsFor(subject)
      if (perm.length === 0) return false
      const actions = combine(action)

      return (Number(perm[perm.length - 1]) & actions) === actions
    },
    canSome: (
      subject:
        | KHAO_THI_PERMISSION
        | CONG_SINH_VIEN_PERMISSION
        | CONG_HOC_VIEN_PERMISSION
        | QL_DAO_TAO_PERMISSION
        | TRO_LY_AO_PERMISSION
        | QL_HO_SO_PERMISSION
        | CONG_GIANG_VIEN_PERMISSION,
      ...action: (keyof typeof PERMISSIONS)[]
    ) => {
      if (
        process?.env?.NODE_ENV === "development" ||
        window?.location.host?.startsWith("localhost") ||
        window?.contextData?.userName === "superadmin"
      )
        return true
      const perm = ability.actionsFor(subject)
      if (perm.length === 0) return false

      return action
        .map((p) => PERMISSIONS[p])
        .some((a) => (Number(perm[perm.length - 1]) & a) === a)
    },
    // cannot: (action: keyof typeof PERMISSIONS, subject = '') => {
    //     const perm = ability.actionsFor(subject)
    //     if (perm.length === 0) return false

    //     return (
    //         (Number(ability.actionsFor(subject).pop()) & PERMISSIONS[action]) !==
    //         PERMISSIONS[action]
    //     )
    // },
  }
}

function getDynamicTitle(navKey: keyof typeof NAVIGATION, pathname: string): string {
  const menus = NAVIGATION[navKey]?.menus || []

  for (const menu of menus) {
    // Không có children
    if (!menu?.children && pathname === menu?.path) {
      return menu?.label as string
    }

    // Có children
    if (menu?.children) {
      const child = menu?.children?.find((child) => child?.path === pathname)
      if (child) {
        // return `${menu?.label} / ${child?.label}`
        return `${child?.label}`
      }
    }
  }

  // Fallback
  return NAVIGATION[navKey]?.label || "PHÂN HỆ QUẢN LÝ ĐÀO TẠO"
}

const listRouter = [
  {
    id: "educational-level",
    label: "Trình độ học vấn",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_HOC_VAN,
    description: "Trình độ học vấn",
  },
  {
    id: "political-theory-level",
    label: "Trình độ lý luận chính trị",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_LY_LUAN_CHINH_TRI,
    description: "Trình độ lý luận chính trị",
  },
  {
    id: "state-management-level",
    label: "Trình độ quản lý nhà nước",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRINH_DO_QUAN_LY_NHA_NUOC,
    description: "Trình độ quản lý nhà nước",
  },
  {
    id: "working-status",
    label: "Trạng thái làm việc",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TRANG_THAI_LAM_VIEC,
    description: "Trạng thái làm việc",
  },
  {
    id: "marital-status",
    label: "Tình trạng hôn nhân",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_HON_NHAN,
    description: "Tình trạng hôn nhân",
  },
  {
    id: "forms-of-government-commendation",
    label: "Hình thức khen thưởng của chính quyền",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_CHINH_QUYEN,
    description: "Hình thức khen thưởng của chính quyền",
  },
  {
    id: "forms-of-party-commendation",
    label: "Hình thức khen thưởng của Đảng",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_HINH_THUC_KHEN_THUONG_CUA_DANG,
    description: "Hình thức khen thưởng của Đảng",
  },
  {
    id: "cadre-evaluation",
    label: "Xếp loại đánh giá cán bộ",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CAN_BO,
    description: "Xếp loại đánh giá cán bộ",
  },
  {
    id: "party-member-quality-evaluation",
    label: "Xếp loại đánh giá chất lượng đảng viên",
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_XEP_LOAI_DANH_GIA_CHAT_LUONG_DANG_VIEN,
    description: "Xếp loại đánh giá chất lượng đảng viên",
  },
  {
    id: "type-of-work",
    label: "Loại hình công tác",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_CONG_TAC,
    description: "Loại hình công tác",
  },
  {
    id: "working-status",
    label: "Tình Trạng Công Tác",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_CONG_TAC,
    description: "Tình Trạng Công Tác",
  },
  {
    id: "national",
    label: "Quốc tịch",
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_QUOC_GIA,
    description: "Quốc tịch",
  },
  {
    id: "type-of-study",
    label: "Loại hình đi học tập",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_HINH_DI_HOC_TAP,
    description: "Loại hình đi học tập",
  },
  {
    id: "study-status",
    label: "Tình trạng đi học tập",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TINH_TRANG_DI_HOC_TAP,
    description: "Tình trạng đi học tập",
  },
  {
    id: "coutries-sending-for-study",
    label: "Các nước cử đi học tập",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_NUOC_CU_DI_HOC_TAP,
    description: "Các nước cử đi học tập",
  },
  {
    id: "professional-title-of-lecturer",
    label: "Chức danh CMNV ngạch giảng viên",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_GIANG_VIEN,
    description: "Chức danh CMNV ngạch giảng viên",
  },
  {
    id: "professional-title-of-researcher",
    label: "Chức danh CMNV ngạch nghiên cứu viên",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_NGHIEN_CUU_VIEN,
    description: "Chức danh CMNV ngạch nghiên cứu viên",
  },
  {
    id: "professional-title-of-engineer",
    label: "Chức danh CMNV ngạch kỹ sư",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUC_DANH_CMNV_NGACH_KY_SU,
    description: "Chức danh CMNV ngạch kỹ sư",
  },
  {
    id: "universities",
    label: "Các trường đào tạo bậc đại học",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_TRUONG_DAO_TAO_BAC_DAI_HOC,
    description: "Các trường đào tạo bậc đại học",
  },
  {
    id: "undergraduate-training-majors",
    label: "Các chuyên ngành đào tạo bậc đại học",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CAC_CHUYEN_NGANH_DAO_TAO_BAC_DAI_HOC,
    description: "Các chuyên ngành đào tạo bậc đại học",
  },
  {
    id: "blood-group",
    label: "Nhóm máu",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NHOM_MAU,
    description: "Nhóm máu",
  },
  {
    id: "trinh-do-chuyen-mon-quan-ly",
    label: "Trình độ chuyên môn quản lý",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHI_HUY_QUAN_LY,
    description: "Trình độ chuyên môn quản lý",
  },
  {
    id: "trinh-do-chuyen-mon-ky-thuat",
    label: "Trình độ chuyên môn kỹ thuật",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_CHUYEN_MON_KY_THUAT,
    description: "Trình độ chuyên môn kỹ thuật",
  },
  {
    id: "loai-suc-khoe",
    label: "Loại sức khỏe",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_SUC_KHOE,
    description: "Loại sức khỏe",
  },
  {
    id: "loai-thuong-tat",
    label: "Loại thương tật",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_LOAI_THUONG_TAT,
    description: "Loại thương tật",
  },
  {
    id: "nganh-hoc",
    label: "Ngành học",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGANH_HOC,
    description: "Ngành học",
  },
  {
    id: "to-chuc-xa-hoi",
    label: "Tổ chức xã hội",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_TO_CHUC_XA_HOI,
    description: "Tổ chức xã hội",
  },
  {
    id: "ngach",
    label: "Ngạch",

    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_NGACH,
    description: "Ngạch",
  },
  {
    id: "bac-luong",
    label: "Bậc lương",
    path: ROUTER_PATH.QL_HO_SO.DANH_MUC_HO_SO_BAC_LUONG,
    description: "Bậc lương",
  },
]

function getDynamicBreadcrumb(
  navKey: keyof typeof NAVIGATION,
  pathname: string
): { title: string; href?: string }[] | [] {
  const menus: MenuItem[] =
    NAVIGATION[navKey]?.menus.map((i) => {
      if (i?.id === "danh-muc-ho-so") {
        return { ...i, children: listRouter }
      }
      return i
    }) || []

  for (const menu of menus) {
    // Không có children
    if (pathname === menu?.path) {
      return [{ title: menu?.label as string }]
    }
    // Có children
    if (menu?.children) {
      for (const child of menu?.children || []) {
        if (child.children) {
          for (const grandChild of child.children) {
            if (grandChild?.path === pathname) {
              return [
                { title: menu?.label as string },
                { title: child?.label as string, href: child?.path },
                { title: grandChild?.label as string },
              ]
            }
          }
        }
        if (child?.path === pathname) {
          return [{ title: menu?.label as string }, { title: child?.label as string }]
        }
      }
    }
  }
  return []
}

const mapPermissionResponse = (data?: getPermissionResponse) => {
  if (data?.status !== 200) return []
  return (data.data.Permissions ?? []).map((p) => ({
    name: p.sFormName ?? "",
    permission: p.lPermission ?? 0,
  }))
}

const usePermissionsState = (userId?: string) => {
  const resolvedUserId =
    userId || (typeof window !== "undefined" ? (window.contextData?.userId ?? "") : "")
  const {
    data,
    isFetched,
    isError,
    isSuccess: isQuerySuccess,
  } = useGetPermission(getRuntimeEnv("NEXT_PUBLIC_APP_CODE"), resolvedUserId, {
    query: {
      enabled: Boolean(resolvedUserId),
    },
  })

  const permissions = useMemo(() => mapPermissionResponse(data), [data])
  const hasUserId = Boolean(resolvedUserId)
  const isSuccess = hasUserId && isFetched && isQuerySuccess && data?.status === 200

  return {
    permissions,
    isFetched: hasUserId && isFetched,
    isError: hasUserId && (isError || (isFetched && data?.status !== 200)),
    isSuccess,
    /** Settled (fetched or errored) — does not mean permissions are usable. Prefer `isSuccess`. */
    isReady: hasUserId && (isFetched || isError),
  }
}

const usePermissions = () => {
  const { data } = useGetPermission(
    getRuntimeEnv("NEXT_PUBLIC_APP_CODE"),
    window?.contextData?.userId ?? ""
  )

  return useMemo(() => mapPermissionResponse(data), [data])
}

const useOrgPermissions = () => {
  const { data } = useGetUserPermissionsAccessLevelAppCodeUserId(
    getRuntimeEnv("NEXT_PUBLIC_APP_CODE"),
    window?.contextData?.userId ?? ""
  )
  if (data?.status !== 200) return undefined
  return data?.data?.sDM_DonviId
}

export {
  getDynamicBreadcrumb,
  getDynamicTitle,
  PERMISSIONS,
  useAbility,
  usePermissions,
  usePermissionsState,
  useOrgPermissions,
}
