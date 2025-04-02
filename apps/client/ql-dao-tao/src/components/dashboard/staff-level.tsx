import React, { useEffect, useRef } from 'react';
import { Column } from '@ant-design/plots';

const StaffLevel = () => {
    const chartRef = useRef<any>(null);

    const dataFake = [
        { name: 'Cử nhân', count: 50 },
        { name: 'Thạc sĩ', count: 30 },
        { name: 'Tiến sĩ', count: 12 },
        { name: 'Tiến sĩ khoa học', count: 3 },
        { name: 'Phó giáo sư', count: 15 },
        { name: 'Giáo sư', count: 5 },
    ];


    const config = {
        data: dataFake,
        xField: 'name',
        yField: 'count',
        color: '#1890ff',
        style: {
            inset: 5,
        },
    };

    return <Column {...config} />;
};


export default StaffLevel;
