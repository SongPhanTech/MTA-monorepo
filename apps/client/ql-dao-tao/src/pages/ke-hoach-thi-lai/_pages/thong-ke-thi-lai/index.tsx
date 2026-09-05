import Table from "@components/commons/table"
import DefaultLayout from "@layouts/default-layout"
import HSSVThiLai from "@pages/ke-hoach-giao-duc/_pages/lap-ke-hoach/_components/hssv-thi-lai"
import { debtStatistics, useOpenSubjectClassReExam } from "@workspace/libs/api/training"
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
import { useEffect, useMemo, useState } from "react"

interface SubjectBySemesterForm {
  searchText?: string
  trainingCourseId?: string
  trainingMajorId?: string
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ThongKeNoThiLai() {
  const [form] = Form.useForm<SubjectBySemesterForm>()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()
  const { id: trainingMajorId } = useTrainingMajorStore()

  const searchText = Form.useWatch("searchText", form)
  const [subjectVersionId, setSubjectVersionId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => {
    setPage(1)
    setSubjectVersionId(undefined)
  }, [searchText, trainingCourseId, trainingMajorId, semesterId, trainingObjectTypeId])

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

  const { data: res, isLoading, isFetching } = useOpenSubjectClassReExam(
    {
      search: searchText || undefined,
      trainingCourseId: trainingCourseId as string,
      trainingMajorId: trainingMajorId || undefined,
      semesterId: semesterId as string,
      trainingObjectTypeId: trainingObjectTypeId as string,
      viewAll: 1,
      page,
      limit: pageSize,
    },
    { query: { enabled: !!trainingObjectTypeId && !!semesterId && !!trainingCourseId } }
  )

  const rawData = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])
  const total = res?.status === 200 ? (res.data.count ?? 0) : 0

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
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
          }}
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
              render: (_, __, index: number) => (page - 1) * pageSize + index + 1,
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
        <HSSVThiLai subjectVersionId={subjectVersionId} viewOnly />
      </Col>
    </Row>
  )
}

ThongKeNoThiLai.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
