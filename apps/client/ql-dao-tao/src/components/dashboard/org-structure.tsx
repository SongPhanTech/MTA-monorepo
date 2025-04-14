import React, { useState, useEffect } from 'react'
import { Pie } from '@ant-design/plots'

const PieChart = () => {
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
                title: false,
                position: 'right',
                rowPadding: 5,
            },
        },
    }

    return <Pie {...config} />
}

export default PieChart
