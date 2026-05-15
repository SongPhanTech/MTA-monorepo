import DefaultLayout from "@layouts/default-layout"

import { useState } from "react"
import { Col, message, Row } from "antd"
import SchoolYearTrainingScore from "./_component/SchoolYearTrainingScore"
import LopBienCheItem from "./_component/lop-bien-che"
import useSpinner from "@hooks/spinner"
import { useTrainingObjectTypeStore } from "@workspace/ui"

export default function QuanLyDiemRenLuyenTheoNam() {
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
      <Row gutter={[0, 0]}>
        <Col span={4} className="bg-white rounded-lg shadow-sm">
          <LopBienCheItem
            onChangeSelected={handleChangeFixedClass}
            objectTrainingTypeId={trainingObjectId}
          />
        </Col>
        <Col span={20}>
          <SchoolYearTrainingScore selectedFixedClass={selectedFixedClass} />
        </Col>
      </Row>
    </div>
  )
}

QuanLyDiemRenLuyenTheoNam.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
