import { Store, useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
export type TrainingObjectTypeState = {
    selectedTrainingObjectTypeId?: string
}

export const trainingObjectTypeStore = new Store<TrainingObjectTypeState>({
    selectedTrainingObjectTypeId: undefined,
})

export const selectTrainingObjectType = (id: string) => {
    localStorage.setItem('selectedTrainingObjectTypeId', id)
    trainingObjectTypeStore.setState((prev) => ({
        ...prev,
        selectedTrainingObjectTypeId: id,
    }))
}

export const useTrainingObjectTypeStore = () => {
    const { selectedTrainingObjectTypeId } = useStore(trainingObjectTypeStore)
    useEffect(() => {
        const idLocalStorage = localStorage.getItem('selectedTrainingObjectTypeId')
        if (idLocalStorage) {
            selectTrainingObjectType(idLocalStorage)
        }
    }, [])
    return { id: selectedTrainingObjectTypeId, onSelect: selectTrainingObjectType }
}
