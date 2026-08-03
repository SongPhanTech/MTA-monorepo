import NAVIGATION from "@workspace/router"
import { type ReactNode, useMemo } from "react"

type QuyenCoBanInput = {
  id: string
  label: string
  subSystem: string
  description: string
}

const toLowerCaseString = (str?: ReactNode | null) => {
  if (!str) return ""
  return str.toString().toLowerCase()
}

const useQuyenCoBan = (input?: Partial<QuyenCoBanInput>) => {
  const quyenCoBan = useMemo(() => {
    return Object.entries(NAVIGATION).flatMap(([, value]) =>
      value.menus.flatMap((menu, idx) => ({
        id: menu.id,
        label: menu.label,
        key: menu.id,
        subSystem: value.label,
        description: menu.description,
        index: `${idx + 1}`,
        children: menu.children?.map((child, idxChild) => ({
          ...child,
          key: child.id,
          subSystem: value.label,
          index: `${idx + 1}.${idxChild + 1}`,
          parent: {
            id: menu.id,
            label: menu.label,
          },
        })),
      }))
    )
  }, [])

  const quyenCoBanFlat = useMemo(() => {
    return Object.entries(NAVIGATION).flatMap(([, value]) =>
      value.menus.flatMap((menu, idx) =>
        menu.children
          ? menu.children?.map((child, idxChild) => ({
              ...child,
              key: child.id,
              subSystem: value.label,
              index: `${idx + 1}.${idxChild + 1}`,
              parent: {
                id: menu.id,
                label: menu.label,
              },
            }))
          : {
              id: menu.id,
              label: menu.label,
              key: menu.id,
              subSystem: value.label,
              description: menu.description,
              index: `${idx + 1}`,
              parent: {
                id: "",
                label: "",
              },
            }
      )
    )
  }, [])

  const count = quyenCoBan.length

  const filteredQuyenCoBan = useMemo(() => {
    if (!input) {
      return quyenCoBan
    }
    return quyenCoBan.filter(
      (item) =>
        toLowerCaseString(item?.label).includes(toLowerCaseString(input?.label)) ||
        toLowerCaseString(item?.subSystem).includes(toLowerCaseString(input?.subSystem)) ||
        toLowerCaseString(item?.description).includes(toLowerCaseString(input?.description)) ||
        toLowerCaseString(item?.id).includes(toLowerCaseString(input?.id))
    )
  }, [input, quyenCoBan])

  const filteredQuyenCoBanFlat = useMemo(() => {
    if (!input) {
      return quyenCoBanFlat
    }
    return quyenCoBanFlat.filter(
      (item) =>
        toLowerCaseString(item?.label).includes(toLowerCaseString(input?.label)) ||
        toLowerCaseString(item?.subSystem).includes(toLowerCaseString(input?.subSystem)) ||
        toLowerCaseString(item?.description).includes(toLowerCaseString(input?.description)) ||
        toLowerCaseString(item?.id).includes(toLowerCaseString(input?.id))
    )
  }, [input, quyenCoBanFlat])

  return { data: filteredQuyenCoBan, dataFlat: filteredQuyenCoBanFlat, count }
}

export default useQuyenCoBan
