import DefaultLayout from "@layouts/default-layout"
import { Col, Row, Tabs } from "antd"
import { useMemo, useState } from "react"
import { TabsProps } from "antd/lib"
import DanhSachLopMonHoc from "./_component/DanhSachLopMonHoc"
import DiemDanhList from "./_component/DiemDanhList"
export default function DiemDanh() {
  const [activeKey, setActiveKey] = useState("1")
  const [selectedSubjectClassId, setSelectedSubjectClassId] = useState("")
  const items = useMemo(() => {
    const baseMenu: TabsProps["items"] = [
      {
        label: "Danh sách lớp môn học",
        key: "1",
        children: (
          <DanhSachLopMonHoc
            selectedSubjectClassId={selectedSubjectClassId}
            setSelectedSubjectClassId={(value: any) => setSelectedSubjectClassId(value)}
            setActiveKey={(value: string) => setActiveKey(value)}
          />
        ),
      },
      {
        label: "Điểm danh",
        key: "2",
        children: (
          <DiemDanhList
            selectedSubjectClassId={selectedSubjectClassId}
            setSelectedSubjectClassId={(value: any) => setSelectedSubjectClassId(value)}
          />
        ),
      },
    ]
    return baseMenu
  }, [activeKey, selectedSubjectClassId])
  return (
    <Row gutter={[8, 4]}>
      <Col span={24}>
        <Tabs
          className="-mt-3"
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={items}
        />
      </Col>
    </Row>
  )
}

DiemDanh.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
