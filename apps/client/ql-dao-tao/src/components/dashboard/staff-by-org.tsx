import React, { useRef } from 'react'
import { Column } from '@ant-design/plots'

interface ChartProps {
    className?: string
}

const StaffByOrg: React.FC<ChartProps> = ({ className }) => {
    const chartRef = useRef(null)

    const data = [
        { letter: 'Công nghệ phần mềm', frequency: 15 },
        { letter: 'Kỹ thuật cơ khí', frequency: 12 },
        { letter: 'Kỹ thuật điện', frequency: 17 },
        { letter: 'Vũ khí', frequency: 13 },
        { letter: 'Trí tuệ nhân tạo', frequency: 8 },
        { letter: 'Kỹ thuật viễn thông', frequency: 9 },
        { letter: 'Kỹ thuật vật liệu', frequency: 14 },
        { letter: 'Cơ điện tử', frequency: 10 },
        { letter: 'Kỹ thuật điều khiển', frequency: 16 },
        { letter: 'Kỹ thuật hàng không', frequency: 7 },
        { letter: 'Công nghệ chế tạo máy', frequency: 11 },
        { letter: 'An toàn thông tin', frequency: 19 },
        { letter: 'Hệ thống thông tin', frequency: 6 },
        { letter: 'Kỹ thuật công trình', frequency: 12 },
        { letter: 'Kỹ thuật điều khiển tự động', frequency: 9 },
        { letter: 'Công nghệ năng lượng', frequency: 8 },
        { letter: 'Kỹ thuật điện tử', frequency: 17 },
        { letter: 'Kỹ thuật an ninh', frequency: 7 },
        { letter: 'Công nghệ môi trường', frequency: 14 },
        { letter: 'Toán', frequency: 8 },
        { letter: 'Vật lý đại cương', frequency: 17 },
        { letter: 'Tiếng Anh', frequency: 7 },
        { letter: 'Tiếng Nga', frequency: 14 },
    ]

    const config = {
        data,
        xField: 'letter',
        yField: 'frequency',
        tooltip: {
            formatter: (datum: any) => {
                console.log('datum in tooltip:', datum)
                if (datum && datum.frequency) {
                    return { name: 'Số lượng', value: datum.frequency }
                }
                return { name: 'Số lượng', value: 'N/A' }
            },
        },
        onReady: (chart: any) => {
            try {
                const { height } = chart._container.getBoundingClientRect()
                const tooltipItem =
                    data[Math.floor(Math.random() * data.length)]
                chart.on(
                    'afterrender',
                    () => {
                        chart.emit('tooltip:show', {
                            data: {
                                data: tooltipItem,
                            },
                            offsetY: height / 2 - 60,
                        })
                    },
                    true
                )
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

export default StaffByOrg
