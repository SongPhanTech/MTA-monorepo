import {
  TabChuDeKhaoSat,
  TabDoiTuongKhaoSat,
  TabNhomCauHoi,
} from "@components/features/thiet-lap-khao-sat"
import DefaultLayout from "@layouts/default-layout"
import type { SurveyTopic } from "@workspace/db"
import { Tabs, type TabsProps } from "antd"
import { useMemo, useState } from "react"

function Page() {
  const [topicSlected, setTopicSelected] = useState<SurveyTopic | null>(null)
  const onChange = (key: string) => {
    console.log(key)
  }

  const items: TabsProps["items"] = useMemo(() => {
    return [
      {
        key: "1",
        label: "Đối tượng làm khảo sát",
        children: <TabDoiTuongKhaoSat />,
      },
      {
        key: "2",
        label: "Chủ đề khảo sát",
        children: (
          <TabChuDeKhaoSat
            topicSlected={topicSlected}
            setTopicSelected={(value) => {
              setTopicSelected(value)
            }}
          />
        ),
      },
      {
        key: "3",
        label: "Nhóm câu hỏi khảo sát",
        children: <TabNhomCauHoi topicSlected={topicSlected} />,
        disabled: !topicSlected?.id,
      },
      // {
      //     key: '4',
      //     label: 'Câu hỏi khảo sát',
      //     children: <CauHoiKhaoSat id={selectedID} />,
      //     disabled: !selectedID,
      // },
    ]
  }, [topicSlected])
  return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
