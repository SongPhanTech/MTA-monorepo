import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ExpertProfile } from "@workspace/db/client"
import {
  useCreateExpertProfile,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyLecturer,
  useFindUniqueExpertProfile,
  useFindUniqueLecturer,
  useUpdateExpertProfile,
  useUpsertExpertProfile,
} from "@workspace/db/hooks"
import { Checkbox, Col, Form, Input, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
export interface PutExpertProfileProps {
  id?: string
  thesisExpert?: boolean
}
export type PutExpertProfile = ExpertProfile
dayjs.locale("vi")

const PutExpertProfile = () => {
  const [form] = Form.useForm<PutExpertProfile>()
  const { isOpen, onClose, input } = useDisclosure<PutExpertProfileProps>({
    tag: "PutExpertProfile",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [isInternal, setIsInternal] = useState(true)

  const [search, setSearch] = useState("")
  const [selectedLecturerId, setSelectedLecturerId] = useState<string | undefined>()
  const { data: expert } = useFindUniqueExpertProfile(
    { where: { id: input?.id } },
    { enabled: !!input?.id }
  )

  const { data: lecturer = [] } = useFindManyLecturer({
    where: {
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              {
                userProfile: {
                  fullname: { contains: search, mode: "insensitive" },
                },
              },
              {
                organization: {
                  sTen: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      userProfile: true,
      organization: true,
    },
    take: 200,
  })

  const { data: selectedLecturer } = useFindUniqueLecturer(
    {
      where: { id: selectedLecturerId },
      include: { userProfile: true },
    },
    { enabled: !!selectedLecturerId }
  )
  const { data: academicRankType } = useFindManyDM_HocHam()
  const { data: academicDegreeType } = useFindManyDM_HocVi()

  useEffect(() => {
    if (expert) {
      form.setFieldsValue({
        ...expert,
      })
      setIsInternal(!!expert.lecturerId)
      if (expert.lecturerId) {
        setSelectedLecturerId(expert.lecturerId)
      }
    }
  }, [expert, form])

  useEffect(() => {
    if (!expert) {
      form.setFieldsValue({
        eligiblePresident: isInternal,
        eligibleSecretary: isInternal,
      })
    }
  }, [isInternal, form, expert])

  const { mutateAsync: createExpertProfile } = useCreateExpertProfile()
  const { mutateAsync: updateExpertProfile } = useUpdateExpertProfile()
  const { mutateAsync: upsertExpertProfile } = useUpsertExpertProfile()
  async function onOk(output?: PutExpertProfile) {
    if (!output) return

    try {
      showSpinner()
      if (input?.id) {
        const payload = selectedLecturer
          ? {
              name: selectedLecturer.userProfile.fullname || null,
              phone: selectedLecturer.userProfile.phoneNumber || null,
              email: selectedLecturer.userProfile.email || null,
              lecturerId: selectedLecturer.id,
              eligibleSecretary: output.eligibleSecretary,
              eligiblePresident: output.eligiblePresident,
              bankAccountNumber: output.bankAccountNumber,
              bankName: output.bankName,
            }
          : {
              academicRankTypeId: output.academicRankTypeId,
              academicDegreeTypeId: output.academicDegreeTypeId,
              position: output.position,
              specialization: output.specialization,
              workplace: output.workplace,
              phone: output.phone,
              email: output.email,
              name: output?.name?.trim(),
              eligibleSecretary: output.eligibleSecretary,
              eligiblePresident: output.eligiblePresident,
              bankAccountNumber: output.bankAccountNumber,
              bankName: output.bankName,
            }
        await updateExpertProfile({
          where: { id: input?.id },
          data: payload,
        })
        message.success("Cập nhật thành công")
      } else {
        if (isInternal && selectedLecturer) {
          await upsertExpertProfile({
            where: { lecturerId: selectedLecturer.id },
            update: {
              ...(input?.thesisExpert ? { thesisExpert: true } : { projectExpert: true }),
              bankAccountNumber: output.bankAccountNumber,
              bankName: output.bankName,
            },
            create: {
              name: selectedLecturer.userProfile.fullname || null,
              phone: selectedLecturer.userProfile.phoneNumber || null,
              email: selectedLecturer.userProfile.email || null,
              lecturerId: selectedLecturer.id,
              eligibleSecretary: output.eligibleSecretary,
              eligiblePresident: output.eligiblePresident,
              bankAccountNumber: output.bankAccountNumber,
              bankName: output.bankName,
              ...(input?.thesisExpert ? { thesisExpert: true } : { projectExpert: true }),
            },
          })
        } else {
          await createExpertProfile({
            data: {
              academicRankTypeId: output.academicRankTypeId,
              academicDegreeTypeId: output.academicDegreeTypeId,
              position: output.position,
              specialization: output.specialization,
              workplace: output.workplace,
              phone: output.phone,
              email: output.email,
              name: output?.name?.trim(),
              eligibleSecretary: output.eligibleSecretary,
              eligiblePresident: output.eligiblePresident,
              bankAccountNumber: output.bankAccountNumber,
              bankName: output.bankName,
              ...(input?.thesisExpert ? { thesisExpert: true } : { projectExpert: true }),
            },
          })
        }
        message.success("Thêm mới chuyên gia thành công")
      }

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa chuyên gia" : "Thêm mới chuyên gia"}
      className="w-[50vw]"
    >
      {input?.thesisExpert && (
        <Col span={24} className="mb-4">
          <Radio.Group
            onChange={(e) => {
              setIsInternal(e.target.value === "internal")
              if (!input?.id) {
                form.resetFields()
              }
            }}
            disabled={!!input?.id}
            value={isInternal ? "internal" : "external"}
          >
            <Radio value="internal">Chuyên gia trong trường</Radio>
            <Radio value="external">Chuyên gia ngoài trường</Radio>
          </Radio.Group>
        </Col>
      )}

      {isInternal && (
        <Col span={24}>
          <FormItem form={form} name="lecturerId" label="Chuyên gia hướng dẫn" required>
            <Select
              placeholder="Chọn giảng viên"
              showSearch
              filterOption={false}
              searchValue={search}
              onSearch={(value) => {
                setSearch(value)
              }}
              options={lecturer.map((item) => {
                const label = [
                  item.code,
                  item?.userProfile.fullname,
                  item?.organization?.sTen,
                ].join(" - ")
                return {
                  label,
                  value: item.id,
                }
              })}
              allowClear
              onChange={(value) => {
                setSelectedLecturerId(value)
              }}
            />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="name" label="Họ và tên" required>
            <Input placeholder="Nhập họ và tên" />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="position" label="Chức vụ">
            <Input placeholder="Nhập chức vụ" />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="academicRankTypeId" label="Học hàm">
            <Select
              options={
                academicRankType?.map((item) => ({
                  label: `${item.sMa} - ${item.sTen}`,
                  value: item.Id,
                })) ?? []
              }
              placeholder="Chọn học hàm"
              allowClear
              showSearch
              filterOption={false}
            />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="academicDegreeTypeId" label="Học vị">
            <Select
              options={
                academicDegreeType?.map((item) => ({
                  label: `${item.sMa} - ${item.sTen}`,
                  value: item.Id,
                })) ?? []
              }
              placeholder="Chọn học vị"
              allowClear
              showSearch
              filterOption={false}
            />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="specialization" label="Chuyên ngành">
            <Input placeholder="Nhập chuyên ngành" />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="workplace" label="Đơn vị công tác">
            <Input placeholder="Nhập đơn vị công tác" />
          </FormItem>
        </Col>
      )}
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </FormItem>
        </Col>
      )}

      <Col span={12}>
        <FormItem form={form} name="bankAccountNumber" label="Số tài khoản">
          <Input placeholder="Nhập số tài khoản" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="bankName" label="Ngân hàng">
          <Input placeholder="Nhập tên ngân hàng" />
        </FormItem>
      </Col>
      {!isInternal && (
        <Col span={12}>
          <FormItem form={form} name="email" label="Email">
            <Input placeholder="Nhập email" />
          </FormItem>
        </Col>
      )}

      <Col span={24} className="flex flex-row">
        <Col span={12}>
          <FormItem form={form} name="eligiblePresident" valuePropName="checked">
            <Checkbox>Có thể là Chủ tịch hội đồng</Checkbox>
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="eligibleSecretary" valuePropName="checked">
            <Checkbox>Có thể là Thư ký hội đồng</Checkbox>
          </FormItem>
        </Col>
      </Col>
    </PutFormModal>
  )
}

export default PutExpertProfile
