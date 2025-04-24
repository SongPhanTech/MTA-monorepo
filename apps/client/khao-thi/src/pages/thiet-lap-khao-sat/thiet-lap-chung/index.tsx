import DefaultLayout from '@layouts/default-layout'
import { type TabsProps, Tabs } from 'antd'
import {
    TabChuDeKhaoSat,
    TabDoiTuongKhaoSat,
    TabDotKhaoSat,
    TabLoaiCauHoiKhaoSat,
} from '@components/features/thiet-lap-khao-sat'

function Page() {
    const onChange = (key: string) => {
        console.log(key)
    }

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Đợt khảo sát',
            children: <TabDotKhaoSat />,
        },
        {
            key: '2',
            label: 'Chủ đề khảo sát',
            children: <TabChuDeKhaoSat />,
        },
        {
            key: '3',
            label: 'Đối tượng khảo sát',
            children: <TabDoiTuongKhaoSat />,
        },
        {
            key: '4',
            label: 'Loại câu hỏi khảo sát',
            children: <TabLoaiCauHoiKhaoSat />,
        },
    ]
    return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
