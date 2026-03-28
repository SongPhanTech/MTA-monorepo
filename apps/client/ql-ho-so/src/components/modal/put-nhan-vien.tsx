import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useCreateStaff, useFindUniqueStaff, useUpdateStaff } from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

import ThongTinCaNhanTab from "./quan-ly-ho-so/tabs/tab-thong-tin-ca-nhan"
import type { PutStaffProfile } from "./quan-ly-ho-so/type"

// import TabQuanLyHoSo from './quan-ly-ho-so/tabs'uan-ly-ho-so/type'

dayjs.locale("vi")
export interface PutUserProfileLectureProps {
  id: string | null
}

const PutUserProfileStaffModal = () => {
  const [form] = Form.useForm<PutStaffProfile>()

  const { isOpen, onClose, input } = useDisclosure<PutUserProfileLectureProps>({
    tag: "PutUserProfileStaffModal",
    onClose: form.resetFields,
  })

  const { id } = input ?? { id: null }
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: staffData } = useFindUniqueStaff(
    {
      where: {
        id: id ?? undefined,
      },
      include: {
        userProfile: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
            rank: true,
            nationality: true,
            religion: true,
            ethnicity: true,
            level: true,
          },
        },
        organization: true,
        staffType: true,
        staffPosition: true,
        fixedClass: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  const { mutateAsync: updateStaff } = useUpdateStaff()
  const { mutateAsync: createStaff } = useCreateStaff()

  // const { data = [] } = useFindManyUserProfile({
  //     where: {
  //         staffs: {
  //             deletedAt: null, // Staff chưa bị xóa
  //         },
  //     },
  //     select: {
  //         idCardNumber: true,
  //     },
  // })

  async function onOk(output?: PutStaffProfile) {
    if (!output) return

    try {
      showSpinner()

      if (id) {
        await updateStaff({
          data: {
            userProfileId: output?.userProfileId,
            staffPositionId: output.staffPositionId,
            code: output.code,
            staffTypeId: output.staffTypeId,
          },
          where: {
            id,
          },
        })

        message.success("Cập nhật cán bộ, nhân viên thành công")
      } else {
        await createStaff({
          data: {
            userProfileId: output?.userProfileId,
            staffPositionId: output.staffPositionId,
            staffTypeId: output.staffTypeId,
            code: output.code,
            organizationId: output.organizationId,
          },
        })
        message.success("Thêm mới cán bộ, nhân viên thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Staff"],
      })
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

  // SỬA: Cập nhật useEffect để fill đầy đủ các trường
  useEffect(() => {
    if (staffData?.userProfile && id) {
      const userProfile = staffData.userProfile
      const staff = staffData
      const formData = {
        code: staff.code ?? undefined,
        organizationId: staff.organizationId,
        staffTypeId: staff.staffTypeId,
        staffPositionId: staff.staffPositionId,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        idCardNumber: userProfile.idCardNumber,
      }
      form.setFieldsValue(formData)
    }
  }, [staffData, form, id])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa cán bộ" : "Thêm mới cán bộ"}
      className="w-[1000px]"
      layout="vertical"
      // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
      // wrapperCol={{ span: 16 }} // input chiếm 18 cột
    >
      <Col span={24}>
        <ThongTinCaNhanTab id={id} type={"STAFF"} />
      </Col>
    </PutFormModal>
  )
}

export default PutUserProfileStaffModal
