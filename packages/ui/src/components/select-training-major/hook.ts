import { Store, useStore } from "@tanstack/react-store"
import { useEffect } from "react"

export type TrainingMajorState = {
  selectedTrainingMajorId?: string
}

export const trainingMajorStore = new Store<TrainingMajorState>({
  selectedTrainingMajorId: undefined,
})

export const selectTrainingMajor = (id: string) => {
  if (id) {
    localStorage.setItem("selectedTrainingMajorId", id)
  } else {
    localStorage.removeItem("selectedTrainingMajorId")
    localStorage.removeItem("selectedTrainingMajorName")
  }
  trainingMajorStore.setState((prev) => ({
    ...prev,
    selectedTrainingMajorId: id,
  }))
}

export const useTrainingMajorStore = () => {
  const { selectedTrainingMajorId } = useStore(trainingMajorStore)
  useEffect(() => {
    const idLocalStorage = localStorage.getItem("selectedTrainingMajorId")
    if (idLocalStorage) {
      selectTrainingMajor(idLocalStorage)
    }
  }, [])
  return {
    id: selectedTrainingMajorId,
    onSelect: selectTrainingMajor,
  }
}
