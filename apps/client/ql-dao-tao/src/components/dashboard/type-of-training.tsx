import type React from 'react'
import { useRef } from 'react'
import { Column } from '@ant-design/plots'
import type { Plot } from '@ant-design/plots'

interface ChartProps {
    className?: string
}

const TypeOfTraining: React.FC<ChartProps> = ({ className }) => {
    const chartRef = useRef<Plot | null>(null)

    const dataFake = [
        { type: 'Đại học', category: 'Quân sự', count: 500 },
        { type: 'Đại học', category: 'Dân sự', count: 1000 },
        { type: 'Thạc sĩ', category: 'Quân sự', count: 300 },
        { type: 'Thạc sĩ', category: 'Dân sự', count: 800 },
        { type: 'Tiến sĩ', category: 'Quân sự', count: 150 },
        { type: 'Tiến sĩ', category: 'Dân sự', count: 450 },
    ]

    const config = {
        data: dataFake,
        xField: 'type',
        yField: 'count',
        colorField: 'category',
        group: true,
        color: ['#1890FF', '#FF7A45'],
        style: {
            inset: 5,
        },
        onReady: (chart: Plot) => {
            chartRef.current = chart
            try {
                chart.on('afterrender', () => {
                    chart.emit('legend:filter', {
                        data: { channel: 'color', values: ['Quân sự'] },
                    })
                })
            } catch (e) {
                console.error(e)
            }
        },
    }

    return (
        <div className={className}>
            <Column {...config} />
        </div>
    )
}

export default TypeOfTraining
