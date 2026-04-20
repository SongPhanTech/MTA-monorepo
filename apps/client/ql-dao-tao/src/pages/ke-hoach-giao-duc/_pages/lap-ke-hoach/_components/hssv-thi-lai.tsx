import Table from "@components/commons/table"
import { useOpenSubjectClassReExamStudents } from "@workspace/libs/api/training"
import { useTrainingCourseStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Col, Form, Input, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { type Key, useCallback, useMemo, useState } from "react"

interface FilterProps {
  searchText?: string | null
  trainingCourseId?: string
  fixedClassId?: string
}

interface RegisterClassProps {
  subjectVersionId?: string
  viewOnly?: boolean
}

export default function HSSVThiLai({ subjectVersionId, viewOnly }: RegisterClassProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(50)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const [filters, setFilters] = useState<FilterProps>({
    searchText: undefined,
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()

  const { data: res, refetch } = useOpenSubjectClassReExamStudents(
    {
      search: filters.searchText || undefined,
      trainingObjectTypeId: trainingObjectTypeId || "",
      trainingCourseId: trainingCourseId,
      subjectVersionId: subjectVersionId || "",
      page: currentPage,
      pageSize: numberOfPages,
    },
    { query: { enabled: !!trainingObjectTypeId && !!subjectVersionId } }
  )

  console.log("res: ", res)

  // queryKey /api/subject-class/open-subject-class-retake

  const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])
  const countData = useMemo(() => (res?.status === 200 ? res?.data.count : 0), [res])

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const handleRowSelection = (keys: Key[]) => {
    setSelectedRowKeys(Array.isArray(keys) ? keys : [keys])
  }

  return (
    <Row gutter={[4, 0]}>
      <Col span={8}>
        <Form.Item className="mb-1" name="searchText">
          <Input
            id="search"
            placeholder="Tìm kiếm HV/SV..."
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            style={{ height: 32 }}
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
          />
        </Form.Item>
      </Col>
      {!viewOnly && (
        <Col span={2}>
          <Button type="primary">Lưu</Button>
        </Col>
      )}
      <Col span={24}>
        <Table
          rowKey="id"
          className="mt-0"
          data={data}
          onRow={(record) => ({
            onClick: () => {
              const isSelected = selectedRowKeys.includes(record.id)
              if (isSelected) {
                setSelectedRowKeys(selectedRowKeys.filter((key) => key !== record.id))
              } else {
                setSelectedRowKeys([...selectedRowKeys, record.id])
              }
            },
            style: { cursor: "pointer" },
            columnWidth: 35,
          })}
          rowSelection={
            !viewOnly
              ? {
                  selectedRowKeys: selectedRowKeys,
                  onChange: (selectedRowKeys) => {
                    handleRowSelection(selectedRowKeys)
                  },
                  type: "checkbox",
                  columnWidth: 35,
                }
              : undefined
          }
          columns={[
            {
              title: "TT",
              width: 35,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã",
              dataIndex: "code",
              align: "center",
              width: 100,
            },
            {
              title: "Tên",
              dataIndex: ["userProfile", "fullname"],
              align: "center",
              width: 170,
              render: (text) => <p className="text-left">{text}</p>,
            },
            {
              title: "Lớp",
              align: "center",
              width: 80,
              dataIndex: ["fixedClass", "code"],
            },
            {
              title: "Khoá",
              align: "center",
              width: 80,
              dataIndex: ["fixedClass", "trainingCourse", "name"],
            },
            {
              title: "Điểm TX",
              align: "center",
              width: 80,
              dataIndex: "thuong_xuyen",
            },
            {
              title: "Điểm ĐK",
              align: "center",
              width: 80,
              dataIndex: "dinh_ky",
            },
            {
              title: "Điểm thi",
              align: "center",
              dataIndex: "diem_cuoi",
              width: 80,
            },
            {
              title: "Cấm thi",
              align: "center",
              dataIndex: "cam_thi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Hoãn thi",
              align: "center",
              dataIndex: "hoan_thi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Đình chỉ thi",
              align: "center",
              dataIndex: "dinh_chi",
              width: 80,
              render: (value) => <Checkbox checked={value} />,
            },
            {
              title: "Lý do",
              align: "center",
              width: 150,
              render: (_, record) =>
                record?.reason ??
                record?.ly_do_cam_thi ??
                record?.ly_do_dinh_chi ??
                record?.ly_do_hoan_thi,
            },
          ]}
          pagination={{
            current: currentPage,
            pageSize: numberOfPages,
            total: countData,
            onChange: (page, pageSize) => {
              if (numberOfPages === pageSize) {
                setCurrentPage(page)
              } else {
                setCurrentPage(1)
                setNumberOfPages(pageSize)
              }
            },
          }}
        />
      </Col>
    </Row>
  )
}
