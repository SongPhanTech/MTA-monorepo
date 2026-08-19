import Table from "@components/commons/table"
import DefaultLayout from "@layouts/default-layout"
import { debtStatistics, useOpenSubjectClassRetake } from "@workspace/libs/api/training"
import { getFilenameFromContentDisposition } from "@workspace/libs/utils"
import {
  useSemesterStore,
  useTrainingCourseStore,
  useTrainingMajorStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { Button, Col, Form, Input, message, Row } from "antd"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js"
import type React from "react"
import { useMemo, useState } from "react"
import HSSVChuaDat from "../../../ke-hoach-giao-duc/_pages/lap-ke-hoach/_components/hssv-chua-dat"

interface SubjectBySemesterForm {
  searchText?: string
  trainingCourseId?: string
  trainingMajorId?: string
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ThongKeNoHocLai() {
  const [form] = Form.useForm<SubjectBySemesterForm>()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()
  const { id: trainingMajorId } = useTrainingMajorStore()

  const searchText = Form.useWatch("searchText", form)
  const [subjectVersionId, setSubjectVersionId] = useState<string>()
  const [loading, setLoading] = useState(false)

  const downloadStatsFile = async () => {
    if (!trainingObjectTypeId) {
      message.error("Vui lòng chọn ĐTĐT")
      return
    }
    try {
      setLoading(true)
      const { status, headers, data } = await debtStatistics({
        trainingObjectTypeId: trainingObjectTypeId,
        trainingCourseId,
        semesterId,
        trainingMajorId: trainingMajorId || undefined,
      })
      if (status === 200) {
        const filename = getFilenameFromContentDisposition(
          headers.get("content-disposition") as string
        )
        const blob = new Blob([data], { type: headers.get("content-type") as string })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename || "thong-ke-no.xlsx"
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(error)
      message.error("Lỗi khi tải file")
    } finally {
      setLoading(false)
    }
  }

  const { data: res } = useOpenSubjectClassRetake(
    {
      search: searchText || undefined,
      trainingCourseId: trainingCourseId as string,
      trainingMajorId,
      semesterId: semesterId as string,
      trainingObjectTypeId: trainingObjectTypeId as string,
      viewAll: 1,
    },
    { query: { enabled: !!trainingObjectTypeId && !!semesterId && !!trainingCourseId } }
  )

  const rawData = useMemo(() => {
    const items = res?.status === 200 ? res?.data.data : []
    const merged = new Map<string, (typeof items)[0]>()
    for (const item of items) {
      const existing = merged.get(item.id)
      if (existing) {
        merged.set(item.id, { ...existing, count: existing.count + item.count })
      } else {
        merged.set(item.id, { ...item })
      }
    }
    return Array.from(merged.values())
  }, [res])

  return (
    <Row gutter={[8, 8]}>
      <Col span={8}>
        <Form form={form}>
          <Row gutter={[8, 0]}>
            <Col span={7}>
              <Form.Item className="mb-0" name="searchText">
                <Input id="search" placeholder="Tìm kiếm" allowClear />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Button type="primary" onClick={downloadStatsFile} loading={loading}>
                Tải thống kê
              </Button>
            </Col>
            <Col span={24}>
              <Form.Item hidden name="subjectSelected" />
            </Col>
          </Row>
        </Form>
        <Table
          data={rawData}
          rowKey={"id"}
          rowSelection={{
            type: "radio",
            selectedRowKeys: subjectVersionId ? [subjectVersionId] : [],
            onChange: (selectedRowKeys) => {
              setSubjectVersionId(selectedRowKeys[0] as string)
            },
            columnWidth: 35,
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                setSubjectVersionId(record.id)
              },
            }
          }}
          columns={[
            {
              title: "TT",
              key: "index",
              width: 35,
              align: "center",
              render: (_, __, index: number) => index + 1,
            },
            {
              title: "Mã MH",
              dataIndex: "code",
              align: "center",
            },
            {
              title: "Môn học",
              dataIndex: "name",
            },
            {
              title: "Số SV nợ",
              dataIndex: "count",
              align: "center",
            },
          ]}
        />
      </Col>
      <Col span={16}>
        <HSSVChuaDat subjectVersionId={subjectVersionId} viewOnly />
      </Col>
    </Row>
  )
}

ThongKeNoHocLai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
