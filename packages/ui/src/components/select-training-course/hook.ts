import { Store, useStore } from "@tanstack/react-store"
import { useEffect } from "react"
import { selectFixedClass } from "../select-fixed-class"

export type TrainingCourseState = {
  selectedTrainingCourseId?: string
}

export const trainingCourseStore = new Store<TrainingCourseState>({
  selectedTrainingCourseId: undefined,
})

export const selectTrainingCourse = (id?: string) => {
  if (id) {
    localStorage.setItem("selectedTrainingCourseId", id)
  } else {
    localStorage.removeItem("selectedTrainingCourseId")
  }

  // clear selected fixed class when training course changes
  selectFixedClass()
  trainingCourseStore.setState((prev) => ({
    ...prev,
    selectedTrainingCourseId: id,
  }))
}

export const useTrainingCourseStore = () => {
  const { selectedTrainingCourseId } = useStore(trainingCourseStore)
  useEffect(() => {
    const idLocalStorage = localStorage.getItem("selectedTrainingCourseId")
    if (idLocalStorage) {
      selectTrainingCourse(idLocalStorage)
    }
  }, [])
  return { id: selectedTrainingCourseId, onSelect: selectTrainingCourse }
}
