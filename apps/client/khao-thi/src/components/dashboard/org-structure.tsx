import { Pie } from '@ant-design/plots'
import type React from 'react'
import { useMemo } from 'react'

interface DataItem {
    type: string
    value: number
}
interface ChartProps {
    className?: string
    dataMap?: DataItem[]
}

const PieChart: React.FC<ChartProps> = ({ className, dataMap }) => {
    const data = useMemo(() => {
        if (dataMap) {
            return dataMap
        }
        return [
            { type: 'Học viên quân sự', value: 2000 },
            { type: 'Học viên dân sự', value: 400 },
        ]
    }, [dataMap])

    const config = {
        data,
        angleField: 'value',
        colorField: 'type',
        label: {
            text: 'value',
            style: { fontWeight: 'bold' },
        },
        legend: {
            color: {
                position: 'right',
                // rowPadding: 4,
            },
        },
    }

    return (
        <div className={className}>
            <Pie {...config} />
        </div>
    )
}

export default PieChart
