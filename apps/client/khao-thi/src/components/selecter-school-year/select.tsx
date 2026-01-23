import Select from '@components/commons/select'
import { useSchoolYearStore } from './hook'
import { useFindManySchoolYear } from '@workspace/db/hooks'

const SelecterSchoolYear = () => {
    const { id: schoolYearId, onSelect } = useSchoolYearStore()

    const { data: schoolYear = [], isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: {
            startDate: 'desc',
        },
    })

    const handleChange = (value: string) => {
        onSelect(value)
    }

    return (
        <Select
            placeholder="Chọn năm học"
            value={schoolYearId}
            className="w-52"
            loading={schoolYearLoading}
            onChange={handleChange}
            options={schoolYear.map((year) => ({
                label: year.name,
                value: year.id,
            }))}
        />
    )
}

export { SelecterSchoolYear }
