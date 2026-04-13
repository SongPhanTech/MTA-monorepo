import DefaultLayout from "@layouts/default-layout"
import { useState } from "react"
import { Col, message, Row } from "antd"
import SemesterTrainingScore from "./_component/SemesterTrainingScore"
import LopBienCheItem from "./_component/lop-bien-che"
import useSpinner from "@hooks/spinner"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import SubjectClassList from "./_component/SubjectClassList"

export default function QuanLyDiemRenLuyen() {
  const [activeTabKey, setActiveTabKey] = useState(0)
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()
  const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)

  const handleChangeFixedClass = (id: string) => {
    try {
      showSpinner()
      const classId = id.includes("class-") ? id.replace("class-", "") : id
      setSelectedFixedClass(classId)
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div className="px-4">
      <Row gutter={[16, 0]}>
        <Col span={4} className="bg-white rounded-lg shadow-sm">
          <LopBienCheItem
            onChangeSelected={handleChangeFixedClass}
            objectTrainingTypeId={trainingObjectId}
          />
        </Col>
        <Col span={20}>
          <Row gutter={[0, 16]}>
            <Col span={24} className="bg-white rounded-lg shadow-sm p-4">
              <p className="font-medium mb-3">Môn học trong học kỳ</p>
              <SubjectClassList selectedFixedClass={selectedFixedClass} />
            </Col>
            <Col span={24}>
              <SemesterTrainingScore selectedFixedClass={selectedFixedClass} />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

QuanLyDiemRenLuyen.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
