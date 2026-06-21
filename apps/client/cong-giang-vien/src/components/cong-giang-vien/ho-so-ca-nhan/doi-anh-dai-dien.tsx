import { queryClient } from "@api/index"
import { useUpdateUserProfile } from "@workspace/db/hooks"
import { getMinioUrl, getRuntimeEnv } from "@workspace/libs/utils"
import { Avatar, Button, message, Upload } from "antd"
import axios from "axios"
import { Camera, UserRound } from "lucide-react"
import { useState } from "react"

interface DoiAnhDaiDienProps {
  profileId?: string
  anhDaiDien?: string
}

const KICH_THUOC_TOI_DA_MB = 5

// Ảnh đại diện kèm nút "Đổi ảnh" đặt dưới avatar - upload qua API chung (đồng bộ với hồ sơ).
const DoiAnhDaiDien = ({ profileId, anhDaiDien }: DoiAnhDaiDienProps) => {
  const [dangTai, setDangTai] = useState(false)
  const { mutateAsync: updateUserProfile } = useUpdateUserProfile()

  const handleUpload = async (file: File) => {
    if (!profileId) return
    try {
      setDangTai(true)
      const tenantCode = window.tenantCode || "dev"
      const appCode = getRuntimeEnv("NEXT_PUBLIC_APP_CODE") || "lms"
      const formData = new FormData()
      formData.append("file", file)

      const resUpload = await axios.post(
        `${getRuntimeEnv("NEXT_PUBLIC_API_UPLOAD_URL")}/Files/single/6?tenantCode=${tenantCode}&appCode=${appCode}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "K-TenantCode": tenantCode,
            "K-AppCode": appCode,
          },
        }
      )

      const fileName = resUpload?.data?.fileName
      if (resUpload?.status !== 200 || !fileName) {
        throw new Error("Upload thất bại")
      }

      await updateUserProfile({
        where: { id: profileId },
        data: { avatar: fileName },
      })
      message.success("Cập nhật ảnh đại diện thành công")
      queryClient.invalidateQueries({ queryKey: ["UserProfile"] })
    } catch (error) {
      console.error(error)
      message.error("Không thể cập nhật ảnh đại diện, vui lòng thử lại")
    } finally {
      setDangTai(false)
    }
  }

  return (
    <div className="flex w-fit flex-col items-center gap-2">
      <Avatar
        shape="square"
        size={140}
        src={getMinioUrl(anhDaiDien)}
        icon={<UserRound />}
        className="rounded-lg"
      />
      <Upload
        accept="image/*"
        maxCount={1}
        showUploadList={false}
        disabled={!profileId || dangTai}
        className="block w-[140px] [&_.ant-upload]:block"
        beforeUpload={(file: File) => {
          const hopLe = file.size / 1024 / 1024 < KICH_THUOC_TOI_DA_MB
          if (!hopLe) {
            message.error(`Ảnh vượt quá ${KICH_THUOC_TOI_DA_MB}MB.`)
            return Upload.LIST_IGNORE
          }
          handleUpload(file)
          return false
        }}
      >
        <Button
          block
          type="default"
          icon={<Camera size={16} />}
          loading={dangTai}
          disabled={!profileId || dangTai}
        >
          Đổi ảnh
        </Button>
      </Upload>
    </div>
  )
}

export default DoiAnhDaiDien
