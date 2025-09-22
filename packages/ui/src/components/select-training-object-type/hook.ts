import { Store, useStore } from '@tanstack/react-store'
export type TrainingObjectTypeState = {
    selectedTrainingObjectTypeId?: string
}

export const trainingObjectTypeStore = new Store<TrainingObjectTypeState>({
    selectedTrainingObjectTypeId: undefined,
})

export const selectTrainingObjectType = (id: string) => {
    trainingObjectTypeStore.setState((prev) => ({
        ...prev,
        selectedTrainingObjectTypeId: id,
    }))
}

export const useTrainingObjectTypeStore = () => {
    const { selectedTrainingObjectTypeId } = useStore(trainingObjectTypeStore)
    return { id: selectedTrainingObjectTypeId, onSelect: selectTrainingObjectType }
}
