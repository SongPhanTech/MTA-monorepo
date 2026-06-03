import { Store, useStore } from "@tanstack/react-store"

// Chế độ layout: giang-vien = Cổng Giảng viên, quan-tri = layout quản trị mặc định
export type LayoutMode = "giang-vien" | "quan-tri"

const STORAGE_KEY = "ql-dao-tao:layout-mode"

const getInitialMode = (): LayoutMode | null => {
  if (typeof window === "undefined") return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "giang-vien" || stored === "quan-tri" ? stored : null
}

export const layoutModeStore = new Store<{ mode: LayoutMode | null }>({
  mode: getInitialMode(),
})

export const setLayoutMode = (mode: LayoutMode) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }
  layoutModeStore.setState(() => ({ mode }))
}

export const useLayoutMode = () => useStore(layoutModeStore, (state) => state.mode)
