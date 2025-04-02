import React, { useEffect, useRef } from 'react';
import { Column } from '@ant-design/plots';

const StaffLevel = () => {
    const chartRef = useRef<any>(null);

    const dataFake = [
        { 月份: 'Jan', 月均降雨量: 50, name: 'London' },
        { 月份: 'Feb', 月均降雨量: 80, name: 'London' },
        { 月份: 'Mar', 月均降雨量: 45, name: 'London' },
        { 月份: 'Apr', 月均降雨量: 70, name: 'London' },
        { 月份: 'Jan', 月均降雨量: 30, name: 'New York' },
        { 月份: 'Feb', 月均降雨量: 60, name: 'New York' },
        { 月份: 'Mar', 月均降雨量: 35, name: 'New York' },
        { 月份: 'Apr', 月均降雨量: 50, name: 'New York' },
    ];

    const config = {
        data: dataFake,
        xField: '月份',
        yField: '月均降雨量',
        colorField: 'name',
        group: true,
        style: {
            inset: 5,
        },
        onReady: (chart: any) => {
            chartRef.current = chart;
            try {
                chart.on('afterrender', () => {
                    chart.emit('legend:filter', {
                        data: { channel: 'color', values: ['London'] },
                    });
                });
            } catch (e) {
                console.error(e);
            }
        },
    };

    return <Column {...config} />;
};


export default StaffLevel;
