import { Store, useStore } from "@tanstack/react-store"
import { useFindFirstSchoolYear } from "@workspace/db/hooks"
import { useEffect, useMemo } from "react"

export type SchoolYearState = {
  selectedSchoolYearId?: string
}

export const SchoolYearStore = new Store<SchoolYearState>({
  selectedSchoolYearId: undefined,
})

export const selectSchoolYear = (id: string) => {
  if (id) {
    localStorage.setItem("selectedSchoolYearId", id)
  } else {
    localStorage.removeItem("selectedSchoolYearId")
  }

  SchoolYearStore.setState((prev) => ({
    ...prev,
    selectedSchoolYearId: id,
  }))
}

let first = true
export const useSchoolYearStore = () => {
  const { selectedSchoolYearId } = useStore(SchoolYearStore)
  const idLocalStorage = localStorage.getItem("selectedSchoolYearId")

  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const { data: schoolYear } = useFindFirstSchoolYear(
    {
      where: {
        name: {
          contains: String(currentYear),
        },
      },
    },
    {
      enabled: !idLocalStorage,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <run once>
  useEffect(() => {
    if (idLocalStorage) {
      selectSchoolYear(idLocalStorage)
      first = false
    } else if (schoolYear && first) {
      selectSchoolYear(schoolYear.id)
      first = false
    }
  }, [schoolYear])

  return { id: selectedSchoolYearId, onSelect: selectSchoolYear }
}
