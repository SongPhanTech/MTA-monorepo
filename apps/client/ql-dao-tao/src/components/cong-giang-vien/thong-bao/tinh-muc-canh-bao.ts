import {
  DANH_SACH_LOAI_THONG_BAO_GV,
  type LoaiThongBaoGv,
  type MucCanhBao,
  SO_NGAY_SAP_HET_HAN,
} from "@components/cong-giang-vien/thong-bao/types"
import dayjs from "dayjs"

const tinhMucCanhBao = (loai: LoaiThongBaoGv, expiresAt?: Date | string | null): MucCanhBao => {
  // Phân công giảng dạy không có hạn xử lý → luôn là thông báo mới.
  if (loai === "TEACHING_ASSIGNMENTS") return "moi"

  if (!expiresAt) return "moi"

  const now = dayjs()
  const han = dayjs(expiresAt)

  if (now.isAfter(han)) return "qua_han"
  if (han.diff(now, "day") <= SO_NGAY_SAP_HET_HAN) return "sap_het_han"
  return "moi"
}

export { tinhMucCanhBao, DANH_SACH_LOAI_THONG_BAO_GV }
