import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import { buildOrgTree } from "@lib/utils"
import type { $Enums } from "@workspace/db"
import {
  useFindManyDM_DonVi,
  useFindManyLecturerType,
  useFindManyStaffPosition,
  useFindManyStaffType,
  useFindManyUserProfile,
  useFindUniqueUserProfile,
} from "@workspace/db/hooks"
import { Col, Collapse, Form, Input, Row } from "antd"
import { useCallback, useEffect, useMemo } from "react"
import TreeSelect from "@/components/commons/tree-select"
import type { PutModalType } from "../type"

const { Panel } = Collapse

export default function ThongTinCaNhanTab({
  id,
  type,
}: {
  id?: string | null
  type: $Enums.UserType
}) {
  const form = Form.useFormInstance<PutModalType>()
  // Hook để lấy danh sách UserProfile để làm options cho AutoComplete
  const { data: userProfileOptions = [] } = useFindManyUserProfile({
    where: {
      OR: [
        {
          bLaNguoiDung: true,
        },
        {
          bLaCanBoNhanVien: true,
        },
      ],
    },
    select: {
      firstName: true,
      lastName: true,
      idCardNumber: true,
    },
  })

  // Tạo options cho AutoComplete
  const idCardOptions = useMemo(() => {
    return userProfileOptions.map((profile) => ({
      value: profile.idCardNumber,
      label: `${profile.idCardNumber} - ${profile.lastName} ${profile.firstName}`,
    }))
  }, [userProfileOptions])

  const { data: staffPositionData = [] } = useFindManyStaffPosition(
    {},
    { enabled: type === "STAFF" }
  )

  const { data: staffTypeData = [] } = useFindManyStaffType({}, { enabled: type === "STAFF" })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi(
    {
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    { enabled: type === "LECTURER" }
  )

  const { data: lecturerTypeData = [] } = useFindManyLecturerType(
    {},
    { enabled: type === "LECTURER" }
  )

  const treeData = buildOrgTree(manageOrgData)
  // Thêm useMemo và watch fields
  const idCardNumber = Form.useWatch("idCardNumber", form)

  const { data: cccdUserProfileData } = useFindUniqueUserProfile(
    {
      where: {
        idCardNumber: idCardNumber,
      },
      include: {
        staffs:
          type === "STAFF"
            ? {
                include: {
                  organization: true,
                  staffType: true,
                  staffPosition: true,
                },
              }
            : false,
        lecturer:
          type === "LECTURER"
            ? {
                include: {
                  organization: true,
                  lecturerType: true,
                },
              }
            : false,
      },
    },
    {
      enabled: !!idCardNumber,
      refetchOnWindowFocus: false,
    }
  )

  // Hàm fill thông tin từ dữ liệu cccdUserProfileData
  const fillUserInfo = useCallback(
    (userData: any) => {
      if (!userData) return
      console.log(userData, "log", type)

      // Fill thông tin cơ bản từ UserProfile
      form.setFieldsValue({
        firstName: userData.firstName,
        lastName: userData.lastName,
        userProfileId: userData.id,
        organizationId: userData.sDM_DonViId,
      })
    },
    [form, type]
  )

  // Effect để fill thông tin khi có dữ liệu từ API
  useEffect(() => {
    if (cccdUserProfileData && !id) {
      fillUserInfo(cccdUserProfileData)
      // setUserSelected?.(cccdUserProfileData)
    }
  }, [cccdUserProfileData, fillUserInfo, id])

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Row gutter={[10, 10]}>
          <FormItem form={form} name="userProfileId" label="" required className="mb-0" />
          <Col sm={12} lg={12}>
            <FormItem form={form} name="idCardNumber" label="Số CCCD" className="mb-0" required>
              <Select
                maxTagCount={"responsive"}
                placeholder="Chọn phiên bản ngân hàng câu hỏi"
                options={idCardOptions}
                disabled={!!id}
              />
            </FormItem>
          </Col>
          {type === "LECTURER" && (
            <Col sm={12} lg={12}>
              <FormItem
                form={form}
                name="code"
                label="Mã giảng viên"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mã giảng viên",
                  },
                ]}
                className="mb-0"
              >
                <Input placeholder="Nhập mã giảng viên" />
              </FormItem>
            </Col>
          )}

          {type === "STAFF" && (
            <Col sm={12} lg={12}>
              <FormItem
                form={form}
                name="code"
                label="Mã cán bộ"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mã cán bộ",
                  },
                ]}
                className="mb-0"
              >
                <Input placeholder="Nhập mã cán bộ" />
              </FormItem>
            </Col>
          )}

          <Col sm={12} lg={12}>
            <FormItem form={form} name="lastName" label="Họ và tên đệm" required className="mb-0">
              <Input disabled placeholder="Nhập họ và tên đệm" />
            </FormItem>
          </Col>
          <Col sm={12} lg={12}>
            <FormItem form={form} name="firstName" label="Tên" required className="mb-0">
              <Input disabled placeholder="Nhập tên" />
            </FormItem>
          </Col>
        </Row>
      </Col>
      {type === "LECTURER" && (
        <>
          <Col span={12}>
            <FormItem form={form} name="organizationId" label="Đơn vị" className="mb-0">
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
            <FormItem form={form} name="lecturerTypeId" label="Loại giảng viên" className="mb-0">
              <Select
                placeholder="Chọn loại giảng viên"
                options={lecturerTypeData.map((i) => ({
                  value: i.id,
                  label: i.name,
                }))}
              />
            </FormItem>
          </Col>
        </>
      )}

      {type === "STAFF" && (
        <>
          <Col span={12}>
            <FormItem form={form} name="staffTypeId" label="Loại cán bộ" className="mb-0">
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
            <FormItem form={form} name="staffPositionId" label="Chức vụ cán bộ" className="mb-0">
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
      )}
    </Row>
  )
}
