import Select from '@components/commons/select'
import { cn } from '@lib/utils'
import { useFindManySchoolYear } from '@workspace/db/hooks'
import { useSchoolYearStore } from './hook'

interface SelecterSchoolYearProps {
    className?: string
}

const SelecterSchoolYear = ({ className }: SelecterSchoolYearProps) => {
    const { id: schoolYearId, onSelect } = useSchoolYearStore()

    const { data: schoolYear = [], isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
    })

    const handleChange = (value: string) => {
        onSelect(value)
    }

    return (
        <Select
            placeholder="Chọn năm học"
            value={schoolYearId}
            className={cn('w-52', className)}
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
