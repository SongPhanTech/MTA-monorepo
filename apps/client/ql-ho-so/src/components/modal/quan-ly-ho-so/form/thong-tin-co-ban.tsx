import { CaretRightOutlined } from "@ant-design/icons"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import type { DomProps } from "@constants/type"
import { buildOrgTree } from "@lib/utils"
import type { SubmitForm } from "@pages/quan-ly-ho-so/tao-moi"
import { useSession } from "@workspace/auth/react"
import {
  useFindFirstStudent,
  useFindManyDM_ChucDanh,
  useFindManyDM_DanToc,
  useFindManyDM_DonVi,
  useFindManyDM_GioiTinh,
  useFindManyDM_QuanHuyen,
  useFindManyDM_QuocGia,
  useFindManyDM_Tinh,
  useFindManyDM_Tinh_New,
  useFindManyDM_TinhTrangHonNhan,
  useFindManyDM_TonGiao,
  useFindManyDM_XaPhuong,
  useFindManyDM_XaPhuong_New,
  useFindManyLecturerType,
} from "@workspace/db/hooks"
import { Checkbox, Col, Collapse, Flex, Form, Input, InputNumber, Row, Typography } from "antd"
import dayjs from "dayjs"
import { useRouter } from "next/router"

dayjs.locale("vi")
const { Title, Text } = Typography
const { TextArea } = Input

export default function ThongTinCoBan({ expland, setExpland }: DomProps) {
  const form = Form.useFormInstance<SubmitForm>()

  const { data: nationalityData = [] } = useFindManyDM_QuocGia()
  const { data: religionData = [] } = useFindManyDM_TonGiao()
  const { data: ethnicityData = [] } = useFindManyDM_DanToc()
  const { data: genderData = [] } = useFindManyDM_GioiTinh()
  const { data: tinhTrangHonNhan = [] } = useFindManyDM_TinhTrangHonNhan()
  const { data: provinceData = [] } = useFindManyDM_Tinh_New()
  const { data: provinceOldData = [] } = useFindManyDM_Tinh()
  const { data: levelData = [] } = useFindManyDM_ChucDanh()

  // Địa chỉ mới (DM_Tinh_New, DM_XaPhuong_New)
  const watchedNewProvinceOfBirthId = Form.useWatch("newProvinceOfBirthId", form)
  const watchedNewProvinceHometownId = Form.useWatch("newProvinceHometownId", form)
  const watchedNewProvinceCurrentAddressId = Form.useWatch("newProvinceCurrentAddressId", form)
  const watchedNewProvincePermanentAddressId = Form.useWatch("newProvincePermanentAddressId", form)

  // Địa chỉ cũ (DM_Tinh, DM_QuanHuyen, DM_XaPhuong)
  const watchedProvinceOfBirthId = Form.useWatch("provinceOfBirthId", form)
  const watchedDistrictOfBirthId = Form.useWatch("districtOfBirthId", form)
  const watchedProvinceHometownId = Form.useWatch("provinceHometownId", form)
  const watchedDistrictHometownId = Form.useWatch("districtHometownId", form)
  const watchedProvinceCurrentAddressId = Form.useWatch("provinceCurrentAddressId", form)
  const watchedDistrictCurrentAddressId = Form.useWatch("districtCurrentAddressId", form)
  const watchedProvincePermanentAddressId = Form.useWatch("provincePermanentAddressId", form)
  const watchedDistrictPermanentAddressId = Form.useWatch("districtPermanentAddressId", form)

  // Hooks cho địa chỉ mới (DM_XaPhuong_New)
  const { data: newCommuneOfBirthData = [] } = useFindManyDM_XaPhuong_New({
    where: watchedNewProvinceOfBirthId
      ? { sDM_TinhId_New: watchedNewProvinceOfBirthId }
      : undefined,
  })

  const { data: newCommuneCurrentAddressData = [] } = useFindManyDM_XaPhuong_New({
    where: watchedNewProvinceCurrentAddressId
      ? { sDM_TinhId_New: watchedNewProvinceCurrentAddressId }
      : undefined,
  })

  const { data: newCommunePermanentAddressData = [] } = useFindManyDM_XaPhuong_New({
    where: watchedNewProvincePermanentAddressId
      ? { sDM_TinhId_New: watchedNewProvincePermanentAddressId }
      : undefined,
  })

  const { data: newCommuneHometownData = [] } = useFindManyDM_XaPhuong_New({
    where: watchedNewProvinceHometownId
      ? { sDM_TinhId_New: watchedNewProvinceHometownId }
      : undefined,
  })

  // Hooks cho địa chỉ cũ (DM_QuanHuyen, DM_XaPhuong)
  // Quận/huyện
  const { data: districtCurrentAddressData = [] } = useFindManyDM_QuanHuyen({
    where: watchedProvinceCurrentAddressId
      ? { sDM_TinhId: watchedProvinceCurrentAddressId }
      : undefined,
  })

  const { data: districtPermanentAddressData = [] } = useFindManyDM_QuanHuyen({
    where: watchedProvincePermanentAddressId
      ? { sDM_TinhId: watchedProvincePermanentAddressId }
      : undefined,
  })

  const { data: districtOfBirthData = [] } = useFindManyDM_QuanHuyen({
    where: watchedProvinceOfBirthId ? { sDM_TinhId: watchedProvinceOfBirthId } : undefined,
  })

  const { data: districtHometownData = [] } = useFindManyDM_QuanHuyen({
    where: watchedProvinceHometownId ? { sDM_TinhId: watchedProvinceHometownId } : undefined,
  })

  // Xã/phường cũ
  const { data: communeCurrentAddressData = [] } = useFindManyDM_XaPhuong({
    where: watchedDistrictCurrentAddressId
      ? { sDM_QuanHuyenId: watchedDistrictCurrentAddressId }
      : undefined,
  })

  const { data: communePermanentAddressData = [] } = useFindManyDM_XaPhuong({
    where: watchedDistrictPermanentAddressId
      ? { sDM_QuanHuyenId: watchedDistrictPermanentAddressId }
      : undefined,
  })

  const { data: communeOfBirthData = [] } = useFindManyDM_XaPhuong({
    where: watchedDistrictOfBirthId ? { sDM_QuanHuyenId: watchedDistrictOfBirthId } : undefined,
  })

  const { data: communeHometownData = [] } = useFindManyDM_XaPhuong({
    where: watchedDistrictHometownId ? { sDM_QuanHuyenId: watchedDistrictHometownId } : undefined,
  })

  const router = useRouter()
  const { data: session } = useSession()
  const routerProfileId = typeof router.query.id === "string" ? router.query.id : ""
  const isMePage = router.pathname === "/quan-ly-ho-so/me"
  const profileId = routerProfileId || (isMePage ? session?.sDM_NhanVienId || "" : "")
  const bLaHocVien = Form.useWatch("bLaHocVien", form) || false
  const bLaGiangVien = Form.useWatch("bLaGiangVien", form) || false
  // const bLaCanBoNhanVien = Form.useWatch('bLaCanBoNhanVien', form)
  const { data: lecturerTypeData = [] } = useFindManyLecturerType({}, { enabled: bLaGiangVien })
  const { data: student } = useFindFirstStudent(
    {
      where: { userProfileId: profileId },
      include: {
        fixedClass: {
          select: {
            id: true,
            name: true,
            managementOrganizationId: true,
            managementOrganization: { select: { Id: true, sTen: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!bLaHocVien && !!profileId }
  )
  const studentOrgId =
    student?.fixedClass?.managementOrganizationId ||
    student?.fixedClass?.managementOrganization?.Id ||
    undefined
  // const { data: staffTypeData = [] } = useFindManyStaffType({}, { enabled: !!bLaCanBoNhanVien })
  // const { data: staffPositionData = [] } = useFindManyStaffPosition(
  //     {},
  //     { enabled: !!bLaCanBoNhanVien }
  // )
  const { data: organizations = [] } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(organizations)
  const renderContent = () => {
    return (
      <div className="px-6 form-label-wrap">
        <div className="mb-6 font-semibold text-base">1. Thông tin chung</div>
        <Row className="mb-6" gutter={[16, 16]}>
          <Col span={12}>
            <FormItem
              form={form}
              name="lastName"
              label="Họ và tên đệm"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập họ và tên đệm!",
                },
              ]}
              className="mb-0"
            >
              <Input placeholder="Nhập họ và tên đệm" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="firstName"
              label="Tên"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên!",
                },
              ]}
              className="mb-0"
            >
              <Input placeholder="Nhập tên" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="code"
              label="Mã"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mã!",
                },
              ]}
              className="mb-0"
            >
              <Input placeholder="Nhập mã" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="dateOfBirth" label="Ngày sinh" className="mb-0" required>
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
            <FormItem form={form} name="genderId" label="Giới tính" className="mb-0" required>
              <Select
                allowClear
                placeholder="Chọn giới tính"
                className="h-9"
                options={genderData.map((i) => {
                  return {
                    value: i.Id,
                    label: i.sTen,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              required
              form={form}
              name="phoneNumber"
              label="Số điện thoại"
              className="mb-0"
            >
              <Input placeholder="Nhập số điện thoại" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="officePhone" label="Điện thoại cơ quan" className="mb-0">
              <Input placeholder="Nhập điện thoại cơ quan" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              required
              form={form}
              name="email"
              label="Thư điện tử (email)"
              className="mb-0"
            >
              <Input placeholder="Nhập thư điện tử" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="officerNumber" label="Số hiệu sĩ quan" className="mb-0">
              <Input placeholder="Nhập số hiệu sĩ quan" className="h-9" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="nationalityId"
              label="Quốc tịch"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                placeholder="Chọn quốc tịch"
                className="h-9"
                options={nationalityData.map((i) => {
                  return {
                    value: i.Id,
                    label: i.sTen,
                  }
                })}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="religionId"
              label="Tôn giáo"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                placeholder="Chọn tôn giáo"
                className="h-9"
                options={religionData.map((i) => {
                  return {
                    value: i.Id,
                    label: i.sTen,
                  }
                })}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="ethnicityId"
              label="Dân tộc"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                placeholder="Chọn dân tộc"
                className="h-9"
                options={ethnicityData.map((i) => {
                  return {
                    value: i.Id,
                    label: i.sTen,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="tinhTrangHonNhanId"
              label="Tình trạng hôn nhân"
              className="mb-0"
            >
              <Select
                allowClear
                placeholder="Chọn tình trạng hôn nhân"
                className="h-9"
                options={tinhTrangHonNhan.map((i) => {
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
              name="levelId"
              label="Chức danh"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                placeholder="Chọn chức danh"
                className="h-9"
                options={levelData.map((i) => {
                  return {
                    value: i.Id,
                    label: i.sTen,
                  }
                })}
              />
            </FormItem>
          </Col>

          <Col span={24}>
            <Flex>
              <FormItem
                form={form}
                name="bLaHocVien"
                label=""
                valuePropName="checked"
                className="mb-0 mr-4"
              >
                <Checkbox>Bạn là học viên</Checkbox>
              </FormItem>
              <FormItem
                form={form}
                name="bLaGiangVien"
                label=""
                valuePropName="checked"
                className="mb-0 mr-4"
              >
                <Checkbox>Bạn là giảng viên</Checkbox>
              </FormItem>
              <FormItem
                form={form}
                name="bLaCanBoNhanVien"
                label=""
                valuePropName="checked"
                className="mb-0"
              >
                <Checkbox>Bạn là cán bộ, nhân viên</Checkbox>
              </FormItem>
            </Flex>
          </Col>
          {bLaHocVien && (
            <Col span={24}>
              <Form.Item label="Đơn vị quản lý" className="mb-0">
                <TreeSelect
                  disabled
                  allowClear={false}
                  className="w-full"
                  placeholder="Chưa có đơn vị từ lớp quản lý"
                  treeDefaultExpandAll
                  treeData={treeData}
                  value={studentOrgId}
                  popupMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 560, maxHeight: 400 }}
                />
              </Form.Item>
              <Typography.Text type="danger" className="block mt-1">
                Lấy theo lớp quản lý của sinh viên, không tự thay đổi được
              </Typography.Text>
            </Col>
          )}
          {bLaGiangVien && (
            <>
              <Col span={12}>
                <FormItem
                  form={form}
                  name="lecturerTypeId"
                  label="Loại giảng viên"
                  className="mb-0"
                  required={bLaGiangVien}
                >
                  <Select
                    placeholder="Chọn loại giảng viên"
                    options={lecturerTypeData.map((i) => ({
                      value: i.id,
                      label: i.name,
                    }))}
                  />
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem
                  required
                  form={form}
                  name="lectureCode"
                  label="Mã định danh"
                  className="mb-0"
                >
                  <Input placeholder="Nhập Mã định danh" className="h-9" />
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem
                  form={form}
                  required
                  name="sDM_DonViId"
                  label="Chọn đơn vị"
                  className="mb-2"
                >
                  <TreeSelect
                    allowClear
                    showSearch
                    placeholder="Chọn đơn vị quản lý"
                    treeDefaultExpandAll
                    treeData={treeData}
                  />
                </FormItem>
              </Col>
            </>
          )}
          {/* {bLaCanBoNhanVien && (
                        <>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="staffTypeId"
                                    label="Loại cán bộ"
                                    className="mb-0"
                                    required={bLaCanBoNhanVien}
                                >
                                    <Select
                                        placeholder="Chọn loại cán bộ"
                                        options={staffTypeData.map((i) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="staffPositionId"
                                    label="Chức vụ cán bộ"
                                    className="mb-0"
                                    required={bLaCanBoNhanVien}
                                >
                                    <Select
                                        placeholder="Chọn loại cán bộ"
                                        options={staffPositionData.map((i) => ({
                                            value: i.id,
                                            label: i.name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                        </>
                    )} */}
        </Row>

        <div className="mb-6 font-semibold text-base">2. CCCD/CMND</div>
        <Row className="mb-6" gutter={[16, 16]}>
          <Col span={12}>
            <FormItem
              form={form}
              name="idCardNumber"
              label="CCCD/CMND"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập CCCD/CMND!",
                },
              ]}
              className="mb-0"
            >
              <Input placeholder="Nhập CCCD/CMND" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="idCardDate" label="Ngày cấp CCCD" className="mb-0">
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
            <FormItem form={form} name="placeOfIdCardNumber" label="Nơi cấp CCCD" className="mb-0">
              <Input placeholder="Nhập nơi cấp" className="h-9" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="idCardExpirationDate"
              label="Ngày hết hạn CCCD"
              className="mb-0"
            >
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full h-9"
              />
            </FormItem>
          </Col>
        </Row>

        {/* Nơi sinh */}
        <div className="mb-6 font-semibold text-base">3. Nơi sinh</div>
        <Row className="mb-6" gutter={[16, 16]}>
          {/* Địa chỉ mới (DM_Tinh_New, DM_XaPhuong_New) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="newProvinceOfBirthId"
              label="Tỉnh/Thành phố"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("newCommuneOfBirthId", null)
                }}
                options={provinceData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="newCommuneOfBirthId"
              label="Xã/Phường/Thị trấn"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={newCommuneOfBirthData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          {/* Địa chỉ cũ (DM_Tinh, DM_QuanHuyen, DM_XaPhuong) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="provinceOfBirthId"
              label={
                <span>
                  Tỉnh/Thành phố <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("districtOfBirthId", null)
                  form.setFieldValue("communeOfBirthId", null)
                }}
                options={provinceOldData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="districtOfBirthId"
              label={
                <span>
                  Quận/Huyện <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn quận/huyện"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("communeOfBirthId", null)
                }}
                options={districtOfBirthData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="communeOfBirthId"
              label={
                <span>
                  Xã/Phường/Thị trấn <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={communeOfBirthData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="placeOfBirth" label="Nơi sinh" className="mb-0">
              <Input placeholder="Nhập nơi sinh" className="h-9" />
            </FormItem>
          </Col>
        </Row>

        {/* 3. Quê quán */}
        <div className="mb-6 font-semibold text-base">4. Quê quán</div>
        <Row className="mb-6" gutter={[16, 16]}>
          {/* Địa chỉ mới (DM_Tinh_New, DM_XaPhuong_New) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="newProvinceHometownId"
              label="Tỉnh/Thành phố"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("newCommuneHometownId", null)
                }}
                options={provinceData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="newCommuneHometownId"
              label="Xã/Phường/Thị trấn"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={newCommuneHometownData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          {/* Địa chỉ cũ (DM_Tinh, DM_QuanHuyen, DM_XaPhuong) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="provinceHometownId"
              label={
                <span>
                  Tỉnh/Thành phố <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("districtHometownId", null)
                  form.setFieldValue("communeHometownId", null)
                }}
                options={provinceOldData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="districtHometownId"
              label={
                <span>
                  Quận/Huyện <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn quận/huyện"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("communeHometownId", null)
                }}
                options={districtHometownData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="communeHometownId"
              label={
                <span>
                  Xã/Phường/Thị trấn <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={communeHometownData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="homeTown" label="Quê quán" className="mb-0">
              <Input placeholder="Nhập quê quán" className="h-9" />
            </FormItem>
          </Col>
        </Row>

        {/* 4. Nơi cư trú hiện tại */}
        <div className="mb-6 font-semibold text-base">5. Nơi cư trú hiện tại</div>
        <Row className="mb-6" gutter={[16, 16]}>
          {/* Địa chỉ mới (DM_Tinh_New, DM_XaPhuong_New) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="newProvinceCurrentAddressId"
              label="Tỉnh/Thành phố"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("newCommuneCurrentAddressId", null)
                }}
                options={provinceData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="newCommuneCurrentAddressId"
              label="Xã/Phường/Thị trấn"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={newCommuneCurrentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          {/* Địa chỉ cũ (DM_Tinh, DM_QuanHuyen, DM_XaPhuong) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="provinceCurrentAddressId"
              label={
                <span>
                  Tỉnh/Thành phố <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("districtCurrentAddressId", null)
                  form.setFieldValue("communeCurrentAddressId", null)
                }}
                options={provinceOldData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="districtCurrentAddressId"
              label={
                <span>
                  Quận/Huyện <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn quận/huyện"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("communeCurrentAddressId", null)
                }}
                options={districtCurrentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="communeCurrentAddressId"
              label={
                <span>
                  Xã/Phường/Thị trấn <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={communeCurrentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="permanentAddress"
              label="Nơi cư trú hiện tại"
              className="mb-0"
            >
              <Input placeholder="Nhập nơi cư trú hiện tại" className="h-9" />
            </FormItem>
          </Col>
        </Row>

        {/* 5. Nơi đăng ký thường trú */}
        <div className="mb-6 font-semibold text-base">6. Nơi đăng ký thường trú</div>
        <Row className="mb-6" gutter={[16, 16]}>
          {/* Địa chỉ mới (DM_Tinh_New, DM_XaPhuong_New) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="newProvincePermanentAddressId"
              label="Tỉnh/Thành phố"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("newCommunePermanentAddressId", null)
                }}
                options={provinceData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="newCommunePermanentAddressId"
              label="Xã/Phường/Thị trấn"
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={newCommunePermanentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          {/* Địa chỉ cũ (DM_Tinh, DM_QuanHuyen, DM_XaPhuong) */}
          <Col span={12}>
            <FormItem
              form={form}
              name="provincePermanentAddressId"
              label={
                <span>
                  Tỉnh/Thành phố <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("districtPermanentAddressId", null)
                  form.setFieldValue("communePermanentAddressId", null)
                }}
                options={provinceOldData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="districtPermanentAddressId"
              label={
                <span>
                  Quận/Huyện <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn quận/huyện"
                className="h-9"
                onChange={() => {
                  form.setFieldValue("communePermanentAddressId", null)
                }}
                options={districtPermanentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="communePermanentAddressId"
              label={
                <span>
                  Xã/Phường/Thị trấn <span className="text-red-600">(cũ)</span>
                </span>
              }
              className="mb-0"
              normalize={(value) => (value === undefined ? null : value)}
            >
              <Select
                allowClear
                showSearch
                placeholder="Chọn xã/phường/thị trấn"
                className="h-9"
                options={communePermanentAddressData.map((i) => ({
                  value: i.Id,
                  label: i.sTen,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem
              form={form}
              name="permanentAddress"
              label="Nơi đăng ký thường trú"
              className="mb-0"
            >
              <Input placeholder="Nhập nơi đăng ký thường trú" className="h-9" />
            </FormItem>
          </Col>
        </Row>

        {/* Thông tin bản thân */}
        <div className="mb-6 font-semibold text-base">7. Thông tin bản thân</div>
        <Row className="mb-8" gutter={[16, 16]}>
          <Col span={12}>
            <FormItem form={form} name="conThuMay" label="Con thứ mấy" className="mb-0">
              <InputNumber
                type="number"
                placeholder="Nhập số thứ tự"
                className="w-full h-9"
                min={1}
                max={20}
              />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="soACE" label="Số anh chị em" className="mb-0">
              <InputNumber
                type="number"
                placeholder="Nhập số anh chị em"
                className="w-full h-9"
                min={0}
                max={20}
              />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem form={form} name="lichSuBanThan" label="Lịch sử bản thân" className="mb-0">
              <TextArea rows={3} placeholder="Nhập lịch sử bản thân" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem
              form={form}
              name="truocKhiNhapNgu"
              label="Trước khi nhập ngũ"
              className="mb-0"
            >
              <TextArea rows={2} placeholder="Nhập thông tin trước khi nhập ngũ" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem form={form} name="benh" label="Bệnh tật" className="mb-0">
              <TextArea rows={2} placeholder="Nhập thông tin về bệnh tật (nếu có)" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem form={form} name="tinhHinhNhaO" label="Tình hình nhà ở" className="mb-0">
              <TextArea rows={2} placeholder="Mô tả tình hình nhà ở" />
            </FormItem>
          </Col>
        </Row>

        {/* Thông tin gia đình */}
        <div className="mb-6 font-semibold text-base">8. Thông tin gia đình</div>
        <Row className="mb-8" gutter={[16, 16]}>
          <Col span={24}>
            <FormItem
              form={form}
              name="thanhPhanGiaDinh"
              label="Thành phần gia đình"
              className="mb-0"
            >
              <TextArea rows={3} placeholder="Mô tả thành phần gia đình" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem form={form} name="kinhTeGiaDinh" label="Kinh tế gia đình" className="mb-0">
              <TextArea rows={2} placeholder="Mô tả tình hình kinh tế gia đình" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem
              form={form}
              name="chinhTriGiaDinh"
              label="Chính trị gia đình"
              className="mb-0"
            >
              <TextArea rows={2} placeholder="Mô tả tình hình chính trị gia đình" />
            </FormItem>
          </Col>
        </Row>

        {/* Thông tin gia đình vợ/chồng */}
        <div className="mb-6 font-semibold text-base">9. Thông tin gia đình vợ/chồng</div>
        <Row className="mb-8" gutter={[16, 16]}>
          <Col span={24}>
            <FormItem form={form} name="fSoACE" label="Số anh chị em (vợ/chồng)" className="mb-0">
              <InputNumber
                type="number"
                placeholder="Nhập số anh chị em"
                className="w-full h-9"
                min={0}
                max={20}
              />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem form={form} name="fBanThan" label="Bản thân (vợ/chồng)" className="mb-0">
              <Input placeholder="Nhập thông tin bản thân vợ/chồng" className="h-9" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem
              form={form}
              name="fKinhTeGiaDinh"
              label="Kinh tế gia đình (vợ/chồng)"
              className="mb-0"
            >
              <TextArea rows={2} placeholder="Mô tả tình hình kinh tế gia đình vợ/chồng" />
            </FormItem>
          </Col>

          <Col span={24}>
            <FormItem
              form={form}
              name="fChinhTriGiaDinh"
              label="Chính trị gia đình (vợ/chồng)"
              className="mb-0"
            >
              <TextArea rows={2} placeholder="Mô tả tình hình chính trị gia đình vợ/chồng" />
            </FormItem>
          </Col>
        </Row>
      </div>
    )
  }
  return (
    <div>
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
            key: "thongTinCoBan",
            label: (
              <Title level={4} className="mb-0">
                Thông tin cơ bản
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
