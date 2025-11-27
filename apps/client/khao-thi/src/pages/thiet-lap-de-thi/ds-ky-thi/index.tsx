import ExamLayout from '@layouts/default-layout/exam-layout'
import { Segmented, Tabs } from 'antd'
import { useState } from 'react'
import Exam from './components/ky-thi'
import SubjectVersion from './components/lop-mon-hoc'

function Page() {
    const [activeKey, setActiveKey] = useState('class')

    const items = [
        {
            key: 'class',
            label: 'Lớp môn học',
            children: <SubjectVersion />,
        },
        {
            key: 'exam',
            label: 'Kỳ thi',
            children: <Exam />,
        },
    ]

    return (
        <>
            <Segmented
                value={activeKey}
                onChange={(val) => setActiveKey(val as string)}
                options={[
                    { label: 'Lớp môn học', value: 'class' },
                    { label: 'Kỳ thi', value: 'exam' },
                ]}
                style={{ marginBottom: 14 }}
            />

            <Tabs
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                items={items}
                tabBarStyle={{ display: 'none' }}
            />
        </>
    )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactNode) {
    return <ExamLayout>{page}</ExamLayout>
}
