import { CaretRightOutlined } from "@ant-design/icons"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import type { DomProps } from "@constants/type"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import {
  useFindManyDM_HinhThucKhenThuongDang,
  useFindManyDM_XepLoaiDanhGiaChatLuongDangVien,
} from "@workspace/db/hooks"
import { Col, Collapse, Form, Input, Row, Typography } from "antd"
import dayjs from "dayjs"

dayjs.locale("vi")
const { Title, Text } = Typography
export default function DoanDang({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const { data: xepLoaiDanhGiaChatLuongDangVien = [] } =
    useFindManyDM_XepLoaiDanhGiaChatLuongDangVien()

  const { data: hinhThucKhenThuongDang = [] } = useFindManyDM_HinhThucKhenThuongDang()

  const renderContent = () => {
    return (
      <div className="px-6 form-label-wrap">
        <Row className="mb-6" gutter={[16, 16]}>
          <Col span={12}>
            <FormItem form={form} name="unionDate" label="Ngày vào đoàn" className="mb-0">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full h-9"
                disabledDate={(date) => date && date > dayjs().endOf("day")}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="unionPlace" label="Nơi vào đoàn" className="mb-0">
              <Input placeholder="Nhập nơi vào đoàn" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="CPVJoinDate" label="Ngày vào Đảng" className="mb-0">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full h-9"
                disabledDate={(date) => date && date > dayjs().endOf("day")}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="officialCPVDate"
              label="Ngày chính thức vào đảng"
              className="mb-0"
            >
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full h-9"
                disabledDate={(date) => date && date > dayjs().endOf("day")}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="CPVJoinPlace" label="Nơi vào Đảng" className="mb-0">
              <Input placeholder="Nhập nơi vào Đảng" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="tenureDate" label="Ngày vào niên chế" className="mb-0">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full h-9"
                disabledDate={(date) => date && date > dayjs().endOf("day")}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="dM_XepLoaiDanhGiaChatLuongDangVienId"
              label="Xếp loại đánh giá chất lượng đảng viên"
              className="mb-0"
            >
              <Select
                placeholder="Chọn xếp loại đánh giá chất lượng đảng viên"
                options={xepLoaiDanhGiaChatLuongDangVien.map((i) => {
                  return {
                    label: i.name,
                    value: i.id,
                  }
                })}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="dM_HinhThucKhenThuongDangId"
              label="Hình thức khen thưởng Đảng"
              className="mb-0"
            >
              <Select
                placeholder="Chọn hình thức khen thưởng Đảng"
                options={hinhThucKhenThuongDang.map((i) => {
                  return {
                    label: i.name,
                    value: i.id,
                  }
                })}
              />
            </FormItem>
          </Col>
        </Row>
      </div>
    )
  }
  return (
    <div className="">
      <style>{`
                .form-label-wrap .ant-form-item .ant-form-item-label {
                    flex: 0 0 180px !important;
                    max-width: 180px !important;
                }
                .form-label-wrap .ant-form-item .ant-form-item-label > label {
                    white-space: normal !important;
                    height: auto !important;
                    line-height: 1.5 !important;
                }
                .form-label-wrap .ant-form-item .ant-form-item-label > label::after {
                    content: '' !important;
                }
                .form-label-wrap .ant-form-item .ant-form-item-control {
                    flex: 1 !important;
                }
            `}</style>
      <Collapse
        items={[
          {
            key: "DoanDang",
            label: (
              <Title level={4} className="mb-0">
                Đoàn - Đảng
              </Title>
            ),
            children: renderContent(),
          },
        ]}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined style={{ fontSize: 16 }} rotate={isActive ? 90 : 0} />
        )}
        bordered={false}
        expandIconPosition="end"
        activeKey={expland}
        onChange={(value) => {
          setExpland([...value])
        }}
        className="bg-transparent"
      />
    </div>
  )
}
