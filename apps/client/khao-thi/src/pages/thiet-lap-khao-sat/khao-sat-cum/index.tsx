// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'

// import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
// import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'
import DetailSurveyPage from "@components/sub-pages/khao-sat/danh-sach-giang-vien"
import DanhSachHocVien from "@components/sub-pages/khao-sat/danh-sach-hoc-vien"
import ClusterSurveyEssay from "@components/sub-pages/khao-sat/liet-ke-cum"
import TabDotKhaoSatCum from "@components/sub-pages/khat-sat-cum"
import DefaultLayout from "@layouts/default-layout"
import type { Lecturer, Survey } from "@workspace/db"
import { Col, Row, Tabs } from "antd"
import { useMemo, useState } from "react"
// import OrganizationSurveyReport from '@components/sub-pages/khao-sat/bao-cao-don-vi'

export type LectuerType = Lecturer & {
  survey: Survey[]
}

export default function ClussterSurveyPage() {
  const [activeKey, setActiveKey] = useState("1")
  const [selectedId, setSelectedId] = useState("")
  const [lecturer, setLecturer] = useState<LectuerType | null>(null)
  const [sublectClass, setSublectClass] = useState<any>(null)
  const [organizationSelected, setOrganizationSelected] = useState<string>("")
  const items = useMemo(() => {
    return [
      {
        key: "1",
        label: "Đợt khảo sát",
        children: (
          <TabDotKhaoSatCum
            selectedId={selectedId}
            setSelectedId={(value) => {
              setSelectedId(value)
              setLecturer(null)
            }}
          />
        ),
      },
      {
        key: "2",
        label: "Danh sách giảng viên",
        children: (
          <DetailSurveyPage
            selectedId={selectedId}
            surveyId={lecturer?.id || ""}
            setSurvey={(value) => {
              setLecturer(value)
            }}
          />
        ),
        disabled: !selectedId,
      },
      {
        key: "3",
        label: "Danh sách người làm khảo sát",
        children: <DanhSachHocVien lecturer={lecturer} selectedId={selectedId} />,
        disabled: !lecturer?.id,
      },
      // {
      //     key: '4',
      //     label: 'Báo cáo theo đơn vị',
      //     children: (
      //         <OrganizationSurveyReport
      //             selectedId={selectedId}
      //             surveyName=""
      //             organizationSelected={organizationSelected}
      //             setOrganizationSelected={(value) => {
      //                 setOrganizationSelected(value)
      //             }}
      //         />
      //     ),
      //     disabled: !selectedId,
      // },
      // {
      //     key: '7',
      //     label: 'Báo cáo theo giảng viên',
      //     children: (
      //         <ClusterSurveyReport
      //             selectedId={selectedId}
      //             surveyName=""
      //             surveyId={lecturer?.id || ''}
      //             setSurvey={(value) => {
      //                 setLecturer(value)
      //             }}
      //             organizationSelected={organizationSelected}
      //         />
      //     ),
      //     disabled: !organizationSelected,
      // },
      // {
      //     key: '5',
      //     label: 'Báo cáo theo lớp môn học',
      //     children: (
      //         <LecturerSurveyReport
      //             selectedId={selectedId}
      //             lectureId={lecturer?.id || ''}
      //             sublectClass={sublectClass}
      //             setSublectClass={(value: any) => {
      //                 setSublectClass(value)
      //             }}
      //         />
      //     ),
      //     disabled: !lecturer?.id,
      // },
      // {
      //     key: '6',
      //     label: 'Báo cáo chi tiết',
      //     children: <SurveyReport selectedId={sublectClass?.surveyId || ''} />,
      //     disabled: !sublectClass?.surveyId,
      // },
      {
        key: "4",
        label: "Liệt kê câu hỏi tự luận",
        children: (
          <ClusterSurveyEssay selectedId={selectedId || ""} lecturerId={lecturer?.id || ""} />
        ),
        disabled: !lecturer?.id,
      },
    ]
  }, [sublectClass, lecturer, selectedId])

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
      </Col>
    </Row>
  )
}
ClussterSurveyPage.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
