import type React from 'react'
import { useRef } from 'react'
import { Column } from '@ant-design/plots'

interface ChartProps {
    className?: string
}

const StaffLevel: React.FC<ChartProps> = ({ className }) => {
    const chartRef = useRef<React.MutableRefObject<typeof Column | null>>(null)

    const dataFake = [
        { name: 'Cử nhân', count: 50 },
        { name: 'Thạc sĩ', count: 30 },
        { name: 'Tiến sĩ', count: 12 },
        { name: 'Tiến sĩ khoa học', count: 3 },
        { name: 'Phó giáo sư', count: 15 },
        { name: 'Giáo sư', count: 5 },
    ]

    const config = {
        data: dataFake,
        xField: 'name',
        yField: 'count',
        color: '#1890ff',
        style: {
            inset: 5,
        },
    }

    return (
        <div className={className}>
            <Column {...config} />
        </div>
    )
}

export default StaffLevel
