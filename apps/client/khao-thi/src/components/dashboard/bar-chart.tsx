import { Bar } from '@ant-design/plots'
import type React from 'react'
import { useMemo, useRef } from 'react'

interface ChartProps {
    className?: string
    dataMap?: {
        value: number
        label: string
        state: string
    }[]
}

const BarChart: React.FC<ChartProps> = ({ className, dataMap }) => {
    const _chartRef = useRef(null)

    const data = useMemo(() => {
        if (dataMap) {
            return dataMap
        }
        return [
            {
                label: 'AL',
                state: '<10',
                value: 10,
            },
            {
                label: 'AK',
                state: '<10',
                value: 8,
            },
            {
                label: 'AZ',
                state: '<10',
                value: 12,
            },
            {
                label: 'AL',
                state: '>10',
                value: 10,
            },
            {
                label: 'AK',
                state: '>10',
                value: 8,
            },
            {
                label: 'AZ',
                state: '>10',
                value: 12,
            },
            {
                label: 'AL',
                state: '<20',
                value: 10,
            },
            {
                label: 'AK',
                state: '<20',
                value: 8,
            },
            {
                label: 'AZ',
                state: '210',
                value: 12,
            },
        ]
    }, [dataMap])

    const config = {
        data,
        xField: 'letter',
        yField: 'frequency',
        tooltip: {
            formatter: (datum: { letter: string; frequency: number }) => {
                if (datum?.frequency) {
                    return { name: 'Số lượng', value: datum.frequency }
                }
                return { name: 'Số lượng', value: 'N/A' }
            },
        },
        onReady: (chart: import('@ant-design/plots').Plot) => {
            try {
                const { height } = chart._container.getBoundingClientRect()
                const tooltipItem = data[Math.floor(Math.random() * data.length)]
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
            <Bar {...config} />
        </div>
    )
}

export default BarChart
