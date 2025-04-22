import React, { useState, useEffect } from 'react'
import { Pie } from '@ant-design/plots'

interface ChartProps {
    className?: string
}

const PieChart: React.FC<ChartProps> = ({ className }) => {
    const [data, setData] = useState<any>([])

    useEffect(() => {
        setTimeout(() => {
            setData([
                { type: 'Học viên quân sự', value: 2000 },
                { type: 'Học viên dân sự', value: 400 },
            ])
        }, 1000)
    }, [])

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
