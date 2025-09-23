import { Store, useStore } from '@tanstack/react-store'
import { useLocalStorage } from '@workspace/libs/hook/use-localstorage'
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
    const [idLocalStorage] = useLocalStorage('selectedTrainingObjectTypeId', '')
    useEffect(() => {
        if (idLocalStorage) {
            selectTrainingObjectType(idLocalStorage)
        }
    }, [idLocalStorage])
    const { selectedTrainingObjectTypeId } = useStore(trainingObjectTypeStore)
    return { id: selectedTrainingObjectTypeId, onSelect: selectTrainingObjectType }
}
