import { useAbility } from "@workspace/permissions/hooks"
import NAVIGATION, { QL_DAO_TAO_PERMISSION, type MenuItem } from "@workspace/router"
import { Popover, Tooltip } from "antd"
import { Award, BarChart3, BookOpen, Globe, LayoutGrid, Settings } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

const CATEGORY_MENU_ID = "category"
const TRAINING_GROUP_ID = "danh-muc-dao-tao"
const SCORE_GROUP_ID = "danh-muc-diem"
const EXCLUDED_MENU_IDS = new Set<string>([
  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CAU_HINH_THONG_BAO_GIANG_VIEN,
])

type CatalogColumn = {
  key: string
  title: string
  icon: typeof Globe
  items: MenuItem[]
}

const isLeaf = (item: MenuItem) => !item.children?.length

const canViewItem = (item: MenuItem, can: ReturnType<typeof useAbility>["can"]) => {
  if (item.hidden || !item.path) return false
  return can(item.id as QL_DAO_TAO_PERMISSION, "XEM")
}

const visibleLinks = (items: MenuItem[], can: ReturnType<typeof useAbility>["can"]) =>
  items.filter((item) => isLeaf(item) && !EXCLUDED_MENU_IDS.has(item.id) && canViewItem(item, can))

/** Mục lá trên thanh ngang đã được đưa vào panel, nên không hiện lại ở menu mở rộng. */
export const getMenuIdsShownInCatalog = () => {
  const menus = NAVIGATION.QL_DAO_TAO.menus
  const categoryIndex = menus.findIndex((menu) => menu.id === CATEGORY_MENU_ID)
  const ids = new Set<string>()
  if (categoryIndex < 0) return ids

  ids.add(menus[categoryIndex].id)
  for (const menu of menus.slice(categoryIndex + 1)) {
    if (isLeaf(menu) && !EXCLUDED_MENU_IDS.has(menu.id)) ids.add(menu.id)
  }
  return ids
}

const buildColumns = (can: ReturnType<typeof useAbility>["can"]): CatalogColumn[] => {
  const menus = NAVIGATION.QL_DAO_TAO.menus
  const categoryIndex = menus.findIndex((menu) => menu.id === CATEGORY_MENU_ID)
  const category = categoryIndex >= 0 ? menus[categoryIndex] : undefined
  const categoryChildren = category?.children ?? []

  const commonItems = [
    ...visibleLinks(categoryChildren, can),
    ...visibleLinks(categoryIndex >= 0 ? menus.slice(categoryIndex + 1) : [], can),
  ]

  const trainingGroup = categoryChildren.find((item) => item.id === TRAINING_GROUP_ID)
  const scoreGroup = categoryChildren.find((item) => item.id === SCORE_GROUP_ID)

  return [
    {
      key: "common",
      title: "Danh mục chung",
      icon: Globe,
      items: commonItems,
    },
    {
      key: "training",
      title: "Đào tạo",
      icon: BookOpen,
      items: (trainingGroup?.children ?? []).filter((item) => canViewItem(item, can)),
    },
    {
      key: "score",
      title: "Điểm và Xếp loại",
      icon: Award,
      items: (scoreGroup?.children ?? []).filter((item) => canViewItem(item, can)),
    },
    {
      key: "reports",
      title: "Tổng hợp báo cáo",
      icon: BarChart3,
      items: [],
    },
  ]
}

const CatalogConfigMenu = () => {
  const [open, setOpen] = useState(false)
  const { can } = useAbility()
  const columns = useMemo(() => buildColumns(can), [can])

  const panel = (
    <div className="w-[920px] max-w-[calc(100vw-32px)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <LayoutGrid size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">Danh mục & Cấu hình</div>
          <div className="text-xs text-slate-500">
            Truy cập nhanh các danh mục dùng chung và tham số của hệ thống
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 items-start">
        {columns.map((column) => {
          const Icon = column.icon
          return (
            <div
              key={column.key}
              className="max-h-[420px] min-w-0 overflow-y-auto overscroll-contain border-r border-slate-100 px-4 py-3 last:border-r-0"
            >
              <div className="sticky top-0 z-10 mb-3 flex items-start gap-2 bg-white pb-1">
                <Icon size={15} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-4 tracking-wide text-slate-700">
                  {column.title}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[11px] leading-5 text-slate-500">
                  {column.items.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {column.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.path || "#"}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2 rounded px-1 py-1 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-primary"
                    >
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Popover
      content={panel}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      zIndex={1100}
      overlayInnerStyle={{ padding: 0, overflow: "hidden" }}
      destroyTooltipOnHide
    >
      <span className="inline-flex">
        <Tooltip title="Danh mục & Cấu hình" open={open ? false : undefined}>
          <button
            type="button"
            aria-label="Danh mục & Cấu hình"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-white text-primary hover:bg-primary/10"
          >
            <Settings size={16} />
          </button>
        </Tooltip>
      </span>
    </Popover>
  )
}

export default CatalogConfigMenu
