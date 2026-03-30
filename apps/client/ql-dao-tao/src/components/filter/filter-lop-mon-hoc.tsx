import { FilterOutlined } from "@ant-design/icons"
import TreeSelectDepartment from "@components/commons/department-select/TreeSelectDepartment"
import TreeSelectLecture from "@components/commons/lecture-select-multi/TreeSelectLecture"
import Select from "@components/commons/select"
import { useExamTypeOptions } from "@hooks/examType"
import { Button, Col, DatePicker, Divider, Flex, Form, Popover, Row, Space, Typography } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

dayjs.extend(customParseFormat)

const { Text } = Typography

export type FilterProps = {
  KhoaId: string | null //Khoa
  BoMonId: string | null //Bộ môn
  examTypeId: string | null //Hình thức thi
  LectureIds: string[]
  searchText: string | null
  subjectClassId: string | null
  fixedClassIds: string[]
  examDateRange?: [string, string] | null // Khoảng thời gian thi
  checkedList?: string[]
}

interface Props {
  onFilterChange: any

  filters: FilterProps
  onApply: (filters: FilterProps) => void
}

const FilterSubjectClass = (props: Props) => {
  const { onFilterChange, filters, onApply } = props
  const [form] = Form.useForm<FilterProps>()
  const [open, setOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const { options: ExamType } = useExamTypeOptions()

  const handleReset = () => {
    form.setFieldsValue({
      KhoaId: null,
      BoMonId: null,
      examTypeId: null,
      LectureIds: [],
      fixedClassIds: [],
      examDateRange: undefined,
      checkedList: [],
    })

    onApply(form.getFieldsValue())
    setOpen(false)
    setIsActive(false)
  }

  const handleApply = () => {
    const formValues = form.getFieldsValue()
    onApply(formValues)
    setOpen(false)
    setIsActive(true)
  }

  const handleCancel = () => {
    form.resetFields()
    setOpen(false)
    setIsActive(false)
  }

  useEffect(() => {
    form.setFieldsValue({
      KhoaId: filters.KhoaId || null,
      BoMonId: filters.BoMonId || null,
      examTypeId: filters.examTypeId || null,
      LectureIds: filters.LectureIds || [],
      fixedClassIds: filters.fixedClassIds || [],
    })
  }, [filters, form])

  const ApplyFilterExamDate = (examDateRange: [string, string] | null) => {
    if (examDateRange && examDateRange.length === 2) {
      const [startDate, endDate] = examDateRange
      return {
        examDateRange: [
          dayjs(startDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
          dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
        ],
      }
    }
    return {
      examDateRange: null,
    }
  }

  const filterContent = (
    <div style={{ width: "100%", borderRadius: "10px" }}>
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          backgroundColor: "#E5E7EB",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        }}
      >
        <Text style={{ fontSize: "1rem" }}>Bộ lọc</Text>
        <Button
          type="text"
          icon={<X size={20} />}
          onClick={() => setOpen(false)}
          size="small"
          style={{ marginRight: -8 }}
        />
      </div>

      <div style={{ padding: "0 16px" }}>
        <Form form={form} layout="horizontal" className="mt-4">
          <Row gutter={[10, 0]}>
            <Col span={12}>
              <Col span={24}>
                <Form.Item
                  label="Thời gian thi"
                  name="examDateRange"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 17 }}
                  labelAlign="left"
                >
                  <DatePicker.RangePicker
                    placeholder={["Từ ngày", "Đến ngày"]}
                    style={{ width: "100%" }}
                    allowClear
                    onChange={(dates, dateStrings) => {
                      ApplyFilterExamDate(dates ? [dateStrings[0], dateStrings[1]] : null)
                    }}
                    format={{ format: "DD/MM/YYYY", type: "mask" }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Đơn vị đào tạo"
                  name="BoMonId"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 17 }}
                  labelAlign="left"
                >
                  <TreeSelectDepartment
                    style={{ width: "100%" }}
                    dropdownStyle={{
                      maxHeight: 400,
                      overflow: "auto",
                    }}
                    defaultValue={filters.BoMonId || undefined}
                    onChange={(value) => {
                      form.setFieldsValue({
                        BoMonId: value,
                      })
                      // refetchOrganizationBoMon()
                    }}
                  />
                </Form.Item>
              </Col>
            </Col>
            <Col span={12}>
              <Col span={24}>
                <Form.Item
                  label="Hình thức thi"
                  name="examTypeId"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 17 }}
                  labelAlign="left"
                >
                  <Select
                    placeholder="Chọn hình thức thi"
                    options={ExamType.map((item) => {
                      return {
                        value: item.value,
                        label: item.label,
                      }
                    })}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Giảng viên"
                  name="LectureIds"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 17 }}
                  labelAlign="left"
                >
                  <TreeSelectLecture
                    placeholder="Chọn giảng viên"
                    defaultValue={filters.LectureIds}
                  />
                </Form.Item>
              </Col>
            </Col>
          </Row>
        </Form>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button onClick={handleReset} style={{ background: "#f5f5f5" }}>
          Bỏ lọc
        </Button>
        <Space>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button type="primary" onClick={handleApply}>
            Áp dụng
          </Button>
        </Space>
      </div>
    </div>
  )

  return (
    <Flex>
      <Popover
        content={filterContent}
        trigger="click"
        open={open}
        onOpenChange={handleOpenChange}
        placement="bottomRight"
        arrow={false}
        overlayStyle={{
          width: 900,
        }}
        overlayInnerStyle={{
          padding: 0,
        }}
        destroyTooltipOnHide
        align={{
          offset: [100, 0],
        }}
      >
        <Button
          icon={<FilterOutlined />}
          style={{
            height: "32px",
            width: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isActive ? "#4caf50" : "#ffffff",
          }}
        />
      </Popover>
    </Flex>
  )
}

export default FilterSubjectClass
