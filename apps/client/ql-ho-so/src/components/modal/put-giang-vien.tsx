// @ts-nocheck
import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { UserProfile } from "@workspace/db"
import {
  useCreateLecturer,
  useFindUniqueLecturer,
  useUpdateLecturer,
  useUpdateUserProfile,
} from "@workspace/db/hooks"
import type { GetProp, UploadProps } from "antd"
import { Col, Form, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import ThongTinCaNhanTab from "./quan-ly-ho-so/tabs/tab-thong-tin-ca-nhan"

// import TabQuanLyHoSo from './quan-ly-ho-so/tabs'm './quan-ly-ho-so/type'

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0]
dayjs.locale("vi")
// export type PutUserProfile = UserProfile;
export type PutUserProfile = UserProfile & {
  file: FileType
  organizationId?: string
  lecturerTypeId?: string
}
export interface PutUserProfileLectureProps {
  id: string | null
}

const PutUserProfileLectureModal = () => {
  const [form] = Form.useForm<PutLecturerProfile & { userProfileId: string }>()

  const { isOpen, onClose, input } = useDisclosure<PutUserProfileLectureProps>({
    tag: "PutUserProfileLectureModal",
    onClose: form.resetFields,
  })

  const { id } = input ?? { id: null }
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: lecturerData } = useFindUniqueLecturer(
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
        lecturerType: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  const { mutateAsync: updateLecturer } = useUpdateLecturer()
  const { mutateAsync: createLecturer } = useCreateLecturer()
  const { mutateAsync: updateUserProfile } = useUpdateUserProfile()

  // const { data = [] } = useFindManyUserProfile({
  //     where: {
  //         lecturer: {
  //             deletedAt: null, // Lecturer chưa bị xóa
  //         },
  //     },
  //     select: {
  //         idCardNumber: true,
  //     },
  // })

  const buildLecturerCreateData = (
    output: LecturerProfileType,
    userProfileId: string
  ): Prisma.LecturerCreateInput => ({
    userProfile: { connect: { id: userProfileId } },
    lecturerType: { connect: { id: output.lecturerTypeId } },
  })

  async function onOk(output?: PutLecturerProfile) {
    if (!output) return

    try {
      showSpinner()

      if (id) {
        await updateLecturer({
          data: {
            userProfileId: output?.userProfileId,
            lecturerTypeId: output.lecturerTypeId,
            userProfile: {
              update: {
                sDM_DonViId: output.organizationId || null,
                code: output.code || undefined,
              },
            },
          },
          where: {
            id,
          },
        })

        message.success("Cập nhật giảng viên thành công")
      } else {
        await createLecturer({
          data: {
            userProfileId: output?.userProfileId,
            lecturerTypeId: output.lecturerTypeId,
          },
        })
        if (output?.userProfileId) {
          await updateUserProfile({
            where: { id: output.userProfileId },
            data: {
              sDM_DonViId: output.organizationId || null,
              code: output.code || undefined,
            },
          })
        }
        message.success("Thêm mới giảng viên thành công")
      }

      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Lecturer"],
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
    if (lecturerData?.userProfile && id) {
      const userProfile = lecturerData.userProfile
      const lecturer = lecturerData

      const formData = {
        // Thông tin từ Lecturer
        code: userProfile.code,
        organizationId: userProfile.sDM_DonViId,
        lecturerTypeId: lecturer.lecturerTypeId,

        // Thông tin cơ bản từ UserProfile
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        idCardNumber: userProfile.idCardNumber,
        userProfileId: userProfile.id,
      }

      form.setFieldsValue(formData)
    }
  }, [lecturerData, form, id])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa giảng viên" : "Thêm mới giảng viên"}
      className="w-[1000px]"
      layout="vertical"
    >
      <Col span={24}>
        <ThongTinCaNhanTab id={id} type={"LECTURER"} />
      </Col>
    </PutFormModal>
  )
}

export default PutUserProfileLectureModal
