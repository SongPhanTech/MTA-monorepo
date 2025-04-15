import React, { useEffect, useRef } from 'react'
import { Column } from '@ant-design/plots'

const TypeOfTraining = () => {
    const chartRef = useRef<any>(null)

    // Fake data cho các loại hình đào tạo và 2 cột Quân sự, Dân sự
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
        xField: 'type', // Loại hình đào tạo (Đại học, Thạc sĩ, Tiến sĩ)
        yField: 'count', // Số lượng
        colorField: 'category', // Phân biệt màu sắc theo Quân sự và Dân sự
        group: true, // Nhóm các cột theo loại hình đào tạo
        color: ['#1890FF', '#FF7A45'], // Chỉnh màu cho Quân sự và Dân sự
        style: {
            inset: 5,
        },
        onReady: (chart: any) => {
            chartRef.current = chart
            try {
                chart.on('afterrender', () => {
                    // Có thể thay đổi logic sau khi vẽ biểu đồ ở đây
                    chart.emit('legend:filter', {
                        data: { channel: 'color', values: ['Quân sự'] },
                    })
                })
            } catch (e) {
                console.error(e)
            }
        },
    }

    return <Column {...config} />
}

export default TypeOfTraining
