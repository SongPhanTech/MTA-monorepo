import { useSession } from "@workspace/auth/react"
import { getUrl } from "@workspace/libs/api/custom-instance"
import { getExportSubjectClassScoreUrl } from "@workspace/libs/api/training"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Button, message } from "antd"
import { Download } from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"

type XemTaiLieuInput = {
  uri: string
  name?: string
  mimeType?: string
  mode?: "view" | "edit"
  convertTo?: string
}

/** Cùng mẫu phiếu danh sách thi của cổng đào tạo: template PHIEU-DIEM-DANH-SACH-THI. */
export const useMoDanhSachThi = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { onOpen } = useDisclosure<XemTaiLieuInput>({ tag: "XemTaiLieu" })

  return (subjectClassId?: string | null, examId?: string | null) => {
    if (!subjectClassId) {
      message.warning("Chưa chọn lớp học phần")
      return
    }

    const baseUrl =
      getRuntimeEnv("NEXT_PUBLIC_API_LMS_BASE_URL") || "https://api.daotao.mta.swantech.vn"
    const exportPath = getExportSubjectClassScoreUrl({
      id: subjectClassId,
      examId: examId || undefined,
      type: "DANH-SACH-THI",
      userId: profileId || undefined,
    })

    onOpen({
      uri: getUrl(baseUrl, `${exportPath}&t=${Date.now()}`),
      name: "Danh sách thi",
      mimeType: "xlsx",
      convertTo: "pdf",
    })
  }
}

export const XuatDanhSachThiButton = ({
  subjectClassId,
  disabled,
}: {
  subjectClassId?: string | null
  disabled?: boolean
}) => {
  const moDanhSachThi = useMoDanhSachThi()
  const khongTheXuat = disabled || !subjectClassId

  return (
    <Button
      icon={<Download size={14} />}
      disabled={khongTheXuat}
      onClick={() => moDanhSachThi(subjectClassId)}
    >
      Xuất DS thi
    </Button>
  )
}
