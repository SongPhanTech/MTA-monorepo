import { Store, useStore } from "@tanstack/react-store"
import { useFindFirstSemester } from "@workspace/db/hooks"
import { useEffect, useMemo } from "react"

export type SemesterState = {
  selectedSemesterId?: string
}

export const semesterStore = new Store<SemesterState>({
  selectedSemesterId: undefined,
})

export const selectSemester = (id: string) => {
  if (id) {
    localStorage.setItem("selectedSemesterId", id)
  } else {
    localStorage.removeItem("selectedSemesterId")
  }
  semesterStore.setState((prev) => ({
    ...prev,
    selectedSemesterId: id,
  }))
}

let first = true
export const useSemesterStore = () => {
  const { selectedSemesterId } = useStore(semesterStore)
  const idLocalStorage = localStorage.getItem("selectedSemesterId")

  const now = useMemo(() => new Date().toISOString(), [])

  const { data: semester } = useFindFirstSemester(
    { where: { startDate: { lte: now }, endDate: { gte: now } } },
    { enabled: !idLocalStorage }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <run once>
  useEffect(() => {
    if (idLocalStorage) {
      selectSemester(idLocalStorage)
      first = false
    } else if (semester && first) {
      selectSemester(semester.id)
      first = false
    }
  }, [semester])
  return { id: selectedSemesterId, onSelect: selectSemester }
}
