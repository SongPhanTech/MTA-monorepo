import { Store, useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
export type SemesterState = {
    selectedSemesterId?: string
}

export const semesterStore = new Store<SemesterState>({
    selectedSemesterId: undefined,
})

export const selectSemester = (id: string) => {
    localStorage.setItem('selectedSemesterId', id)
    semesterStore.setState((prev) => ({
        ...prev,
        selectedSemesterId: id,
    }))
}

export const useSemesterStore = () => {
    const { selectedSemesterId } = useStore(semesterStore)
    useEffect(() => {
        const idLocalStorage = localStorage.getItem('selectedSemesterId')
        if (idLocalStorage) {
            selectSemester(idLocalStorage)
        }
    }, [])
    return { id: selectedSemesterId, onSelect: selectSemester }
}
