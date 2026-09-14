import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { CouncilMember } from "@workspace/db/client"
import {
  useCreateCouncilMember,
  useFindManyExpert,
  useFindUniqueCouncilMember,
  useUpdateCouncilMember,
} from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import Select from "@components/commons/select"
import { useCouncilRoleOptions } from "@hooks/councilRole"
export type PutCouncilMember = CouncilMember
dayjs.locale("vi")

type CouncilInput = {
  councilId: string
  councilMemberId: string
}

const PutCouncilMember = () => {
  const [form] = Form.useForm<PutCouncilMember>()
  const [searchExpert, setSearchExpert] = useState("")
  const { councilRoleOptions } = useCouncilRoleOptions()
  const { isOpen, onClose, input } = useDisclosure<CouncilInput>({
    tag: "PutCouncilMember",
    onClose: form.resetFields,
  })
  const { data: council } = useFindUniqueCouncilMember(
    {
      where: { id: input?.councilMemberId },
    },
    { enabled: !!input?.councilMemberId }
  )

  const { data: expert = [] } = useFindManyExpert({
    where: {
      deletedAt: null,
      currentVersion: { thesisExpert: true },
      ...(searchExpert
        ? {
            OR: [
              {
                currentVersion: {
                  name: { contains: searchExpert, mode: "insensitive" },
                },
              },
              {
                lecturer: {
                  userProfile: {
                    fullname: { contains: searchExpert, mode: "insensitive" },
                  },
                },
              },
              { code: { contains: searchExpert, mode: "insensitive" } },
            ],
          }
        : {}),
      AND: [
        {
          OR: [
            {
              councilMemberships: {
                none: {
                  councilId: input?.councilId,
                },
              },
            },
            ...(council?.expertId
              ? [
                  {
                    id: council.expertId,
                  },
                ]
              : []),
          ],
        },
      ],
    },
    include: {
      currentVersion: true,
      lecturer: {
        include: {
          userProfile: true,
        },
      },
    },
  })

  const handleSearchExpert = (value: string) => {
    setSearchExpert(value)
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createCouncilMember } = useCreateCouncilMember()
  const { mutateAsync: updateCouncilMember } = useUpdateCouncilMember()
  async function onOk(output?: PutCouncilMember) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.councilId) {
        message.error("Không tìm thấy mẫ hội đồng")
        hideSpinner()
        return
      }
      const selectedExpert = expert.find((item) => item.id === output.expertId)
      const expertProfileVersionId =
        selectedExpert?.currentVersionId ?? selectedExpert?.currentVersion?.id
      if (!expertProfileVersionId) {
        message.error("Chuyên gia chưa có phiên bản hồ sơ hiện tại.")
        hideSpinner()
        return
      }
      const payload = {
        councilId: input.councilId,
        role: output.role,
        expertId: output.expertId,
        expertProfileVersionId,
      }
      if (input?.councilMemberId) {
        await updateCouncilMember({
          data: {
            ...payload,
          },
          where: {
            id: input?.councilMemberId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCouncilMember({
          data: {
            ...payload,
            councilId: input.councilId,
          },
        })
        message.success("Thêm mới thành công")
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

  useEffect(() => {
    if (council) {
      form.setFieldsValue({
        ...council,
      })
    }
  }, [council, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.councilMemberId ? "Sửa thành viên hội đồng" : "Thêm thành viên hội đồng"}
    >
      <Col span={12}>
        <FormItem form={form} name="expertId" label="Chuyên gia" required>
          <Select
            placeholder="Chọn chuyên gia"
            options={expert.map((item) => ({
              label: `${item.code ? `${item.code} -` : ""} ${item.currentVersion?.name || item.lecturer?.userProfile?.fullname || ""}`,
              value: item.id,
            }))}
            showSearch
            onSearch={handleSearchExpert}
            filterOption={false}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="role" label="Vai trò" required>
          <Select
            placeholder="Chọn trạng thái"
            options={councilRoleOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCouncilMember
