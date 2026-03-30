import { Store, useStore } from "@tanstack/react-store"
import { useEffect } from "react"

export type FixedClassState = {
  selectedFixedClassId?: string
}

export const fixedClassStore = new Store<FixedClassState>({
  selectedFixedClassId: undefined,
})

export const selectFixedClass = (id?: string) => {
  if (id) {
    localStorage.setItem("selectedFixedClassId", id)
  } else {
    localStorage.removeItem("selectedFixedClassId")
  }
  fixedClassStore.setState((prev) => ({
    ...prev,
    selectedFixedClassId: id,
  }))
}

export const useFixedClassStore = () => {
  const { selectedFixedClassId } = useStore(fixedClassStore)
  useEffect(() => {
    const idLocalStorage = localStorage.getItem("selectedFixedClassId")
    if (idLocalStorage) {
      selectFixedClass(idLocalStorage)
    }
  }, [])
  return { id: selectedFixedClassId, onSelect: selectFixedClass }
}
