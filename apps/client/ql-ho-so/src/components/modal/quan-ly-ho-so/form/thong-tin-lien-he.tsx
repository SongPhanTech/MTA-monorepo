import { CaretRightOutlined } from "@ant-design/icons"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import type { DomProps } from "@constants/type"
import { buildOrgTree } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import {
  useFindManyDM_ChucDanhCMNVGiangVien,
  useFindManyDM_ChucDanhCMNVKySu,
  useFindManyDM_ChucDanhCMNVNghienCuuVien,
  useFindManyDM_DonVi,
  useFindManyDM_NhomMau,
  useFindManyDM_TrangThaiLamViec,
  useFindManyDM_TrinhDoHocVan,
  useFindManyDM_XepLoaiDanhGiaCanBo,
} from "@workspace/db/hooks"

import { Col, Collapse, Form, Input, Row, Typography } from "antd"
import dayjs from "dayjs"

const { Title, Text } = Typography
dayjs.locale("vi")
export default function ThongTinLienHe({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const { data: chucDanhGiangVienData = [] } = useFindManyDM_ChucDanhCMNVGiangVien()
  const { data: chucDanhNghienCuuVienData = [] } = useFindManyDM_ChucDanhCMNVNghienCuuVien()
  const { data: chucDanhKySuData = [] } = useFindManyDM_ChucDanhCMNVKySu()
  const { data: xepLoaiDanhGiaCanBoData = [] } = useFindManyDM_XepLoaiDanhGiaCanBo()
  const { data: trangThaiLamViec = [] } = useFindManyDM_TrangThaiLamViec()
  const { data: bloodType = [] } = useFindManyDM_NhomMau()
  const { data: trinhDoHocVan = [] } = useFindManyDM_TrinhDoHocVan()
  const { data: organizations = [] } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const treeData = buildOrgTree(organizations)

  const renderContent = () => {
    return (
      <div className="px-6 form-label-wrap">
        <Row className="mb-6" gutter={[16, 16]}>
          <Col span={12}>
            <FormItem form={form} name="hoTenThuongDung" label="Họ tên khác" className="mb-0">
              <Input placeholder="Nhập họ tên khác" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="bankAccountNumber"
              label="Số thẻ ngân hàng"
              className="mb-0"
            >
              <Input placeholder="Nhập số thẻ ngân hàng" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="bankName" label="Ngân hàng" className="mb-0">
              <Input placeholder="Nhập ngân hàng" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="healthInsuranceNumber"
              label="Thẻ bảo hiểm y tế"
              className="mb-0"
            >
              <Input placeholder="Nhập thẻ bảo hiểm y tế" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="soTruong" label="Sở trường" className="mb-0">
              <Input placeholder="Nhập sở trường" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="nhomMauId" label="Nhóm máu" className="mb-0">
              <Select
                allowClear
                placeholder="Chọn nhóm máu"
                className="h-9"
                options={bloodType.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="trinhDoHocVanId" label="Trình độ học vấn" className="mb-0">
              <Select
                allowClear
                placeholder="Chọn trình độ học vấn"
                className="h-9"
                options={trinhDoHocVan.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="dM_ChucDanhCMNVGiangVienId"
              label="Chức danh CMNV ngạch Giảng viên"
              className="mb-0"
            >
              <Select
                allowClear
                placeholder="Chọn chức danh CMNV ngạch Giảng viên"
                className="h-9"
                options={chucDanhGiangVienData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="dM_ChucDanhCMNVKySuId"
              label="Chức danh CMNV kỹ sư"
              className="mb-0"
            >
              <Select
                allowClear
                placeholder="Chọn chức danh CMNV kỹ sư"
                className="h-9"
                options={chucDanhKySuData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="dM_ChucDanhCMNVNghienCuuVienId"
              label="Chức danh CMNV ngạch Nghiên cứu viên"
              className="mb-0"
            >
              <Select
                allowClear
                placeholder="Chọn chức danh CMNV ngạch Nghiên cứu viên"
                className="h-9"
                options={chucDanhNghienCuuVienData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="sDM_DonViId" label="Đơn vị quản lý" className="mb-2">
              <TreeSelect
                allowClear
                showSearch
                placeholder="Chọn đơn vị quản lý"
                treeDefaultExpandAll
                treeData={treeData}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="dM_XepLoaiDanhGiaCanBoId"
              label="Xếp loại cán bộ"
              className="mb-2"
            >
              <Select
                allowClear
                placeholder="Chọn xếp loại cán bộ"
                className="h-9"
                options={xepLoaiDanhGiaCanBoData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="trangThaiLamViecId"
              label="Trạng thái làm việc"
              className="mb-2"
            >
              <Select
                allowClear
                placeholder="Chọn trạng thái làm việc"
                className="h-9"
                options={trangThaiLamViec.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
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
            key: "thongTinLienHe",
            label: (
              <Title level={4} className="mb-0">
                Thông tin liên hệ
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
