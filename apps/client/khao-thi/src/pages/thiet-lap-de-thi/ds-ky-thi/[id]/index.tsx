import DefaultLayout from '@layouts/default-layout'
import { ROUTER_PATH } from '@workspace/router'
import { Segmented, Tabs } from 'antd'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useState } from 'react'
import TestStructureRule from './components/cau-hinh-sinh-de'
import ExamBank from './components/danh-sach-de-thi'
import ExamSession from './components/ql-bai-thi'
import Information from './components/thong-tin-ky-thi'

export default function PageId() {
    const router = useRouter()
    const examId = router.query.id as string
    const { ids } = router.query
    const selectedIds = ids ? ids.toString().split(',') : []

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
            children: <Information id={id} selectedIds={selectedIds} />,
        },
        {
            key: 'sinhDeTuDong',
            label: 'Cấu hình sinh đề tự động',
            children: <TestStructureRule id={id} />,
        },
        {
            key: 'examBank',
            label: 'Danh sách đề thi',
            children: <ExamBank id={id} />,
        },
        {
            key: 'examSession',
            label: 'Quản lý bài thi',
            children: <ExamSession id={id} />,
        },
    ]

    return (
        <>
            <Segmented
                value={activeKey}
                onChange={(val) => setActiveKey(val as string)}
                options={[
                    { label: 'Thông tin kỳ thi', value: 'infor' },
                    { label: 'Cấu hình sinh đề tự động', value: 'sinhDeTuDong' },
                    { label: 'Danh sách đề thi', value: 'examBank' },
                    { label: 'Quản lý bài thi', value: 'examSession' },
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
