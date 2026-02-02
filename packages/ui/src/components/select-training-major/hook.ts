import { Store, useStore } from '@tanstack/react-store'
import { useEffect } from 'react'

export type TrainingMajorState = {
    selectedTrainingMajorId?: string
    selectedTrainingMajorName?: string
}

export const trainingMajorStore = new Store<TrainingMajorState>({
    selectedTrainingMajorId: undefined,
    selectedTrainingMajorName: undefined,
})

export const selectTrainingMajor = (id: string, name: string) => {
    if (name) {
        localStorage.setItem('selectedTrainingMajorName', name)
    }
    if (id) {
        localStorage.setItem('selectedTrainingMajorId', id)
    } else {
        localStorage.removeItem('selectedTrainingMajorId')
        localStorage.removeItem('selectedTrainingMajorName')
    }
    trainingMajorStore.setState((prev) => ({
        ...prev,
        selectedTrainingMajorId: id,
        selectedTrainingMajorName: name,
    }))
}

export const useTrainingMajorStore = () => {
    const { selectedTrainingMajorId } = useStore(trainingMajorStore)
    const { selectedTrainingMajorName } = useStore(trainingMajorStore)
    useEffect(() => {
        const idLocalStorage = localStorage.getItem('selectedTrainingMajorId')
        const nameLocalStorage = localStorage.getItem('selectedTrainingMajorName')
        if (idLocalStorage) {
            selectTrainingMajor(idLocalStorage, nameLocalStorage ?? '')
        }
    }, [])
    return {
        id: selectedTrainingMajorId,
        name: selectedTrainingMajorName,
        onSelect: selectTrainingMajor,
    }
}
