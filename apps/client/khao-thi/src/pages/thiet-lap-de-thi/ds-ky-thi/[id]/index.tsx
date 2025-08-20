import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'
import { Segmented, Tabs } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useState } from 'react'
import Information from './components/thong-tin-ky-thi'

export default function PageId() {
    const router = useRouter()
    const examId = router.query.id as string
    const [id, setId] = useState('')
    useEffect(() => {
        if (!examId) return

        if (examId === 'create') {
            setId('')
        } else {
            setId(examId)
        }
    }, [examId])

    const [activeKey, setActiveKey] = useState('infor')

    const items = [
        {
            key: 'infor',
            label: 'Thông tin kỳ thi',
            children: <Information id={id} />,
        },
        {
            key: 'examBank',
            label: 'Danh sách đề thi',
            children: <div>3423</div>,
        },
    ]

    return (
        <>
            <Segmented
                value={activeKey}
                onChange={(val) => setActiveKey(val as string)}
                options={[
                    { label: 'Thông tin kỳ thi', value: 'infor' },
                    { label: 'Danh sách đề thi', value: 'examBank' },
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

PageId.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                {
                    title: 'Thiết lập đề thi',
                },
                {
                    title: 'Danh sách kỳ thi',
                    href: ROUTER_PATH.KHAO_THI.THIET_LAP_DE_THI_DS_KY_THI,
                },
                {
                    title: 'Chi tiết kỳ thi',
                },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
