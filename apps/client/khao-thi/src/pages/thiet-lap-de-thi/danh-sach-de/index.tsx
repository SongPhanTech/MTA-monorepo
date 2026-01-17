import { Col, Row, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import {Store, useStore } from "@tanstack/react-store";
import DefaultLayout from '@layouts/default-layout';
import DanhSachKeHoachThi from './_component/danh-sach-ke-hoach-thi';
import ExamListPage from './_component/danh-sach-de';
import { useSemesterStore } from '@workspace/ui';

export const store = new Store({
  examFrameworkId: undefined,
  selectedExamId: undefined,
  subjectVersionId: undefined,
});


export default function LapDanhSachThiPage() {
    const [activeKey, setActiveKey] = useState('1')
   const { id: semesterId } = useSemesterStore()
    const selectedExamId = useStore(store, (state) => state["selectedExamId"]);
    const tabItems = useMemo(() => {
        return [
            {
                key: '1',
                label: 'Danh sách môn thi',
                children: <DanhSachKeHoachThi setActiveKey={setActiveKey} />,
            },
             {
                key: '2',
                label: 'Danh sách đề thi',
                children: <ExamListPage  />,
                disabled: !selectedExamId
            },
        ]
    }, [semesterId,selectedExamId])

    return (
        <Row gutter={[12, 0]} className="bg-white ">
            <Col span={24}>
                <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
            </Col>
        </Row>
    )
}

LapDanhSachThiPage.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}

