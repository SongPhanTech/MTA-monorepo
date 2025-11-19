import {
    TabChuDeKhaoSat,
    TabDoiTuongKhaoSat,
    TabNhomCauHoi,
} from '@components/features/thiet-lap-khao-sat'
import DefaultLayout from '@layouts/default-layout'
import { Tabs, type TabsProps } from 'antd'

function Page() {
    const onChange = (key: string) => {
        console.log(key)
    }

    const items: TabsProps['items'] = [
           {
            key: '1',
            label: 'Đối tượng làm khảo sát',
            children: <TabDoiTuongKhaoSat />,
        },
        {
            key: '2',
            label: 'Chủ đề khảo sát',
            children: <TabChuDeKhaoSat />,
        },
        {
            key: '3',
            label: 'Nhóm câu hỏi khảo sát',
            children: <TabNhomCauHoi />,
        },
        // {
        //     key: '4',
        //     label: 'Câu hỏi khảo sát',
        //     children: <CauHoiKhaoSat id={selectedID} />,
        //     disabled: !selectedID,
        // },
    ]
    return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
