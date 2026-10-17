type Master = {
  entityName: string
  fields: string[]
}
export type ErrorExtra = {
  code: string
  data: string[] | { Master: Master[] } | null
  message: string | null
  resultType: 0
  index: null
}

function isMasterData(data: ErrorExtra["data"]): data is { Master: Master[] } {
  return Boolean(data && typeof data === "object" && !Array.isArray(data) && "Master" in data)
}

const LSB_FIELD_LABELS: Record<string, string> = {
  sDM_DonViId: "Đơn vị",
  sTen: "Tên",
  sHoVaDem: "Họ và đệm",
  sTenDayDu: "Họ và tên",
  sMa: "Mã",
  sCCCD: "CCCD",
  sDM_GioiTinhId: "Giới tính",
  dNgaySinh: "Ngày sinh",
  sEmail: "Email",
  sSDTDiDong: "Số điện thoại",
}

function formatLsbField(field: string, entityName?: string) {
  const label = LSB_FIELD_LABELS[field] || field
  return entityName ? `${label} (${entityName})` : label
}

export function formatLsbError(extra?: ErrorExtra, fallback?: string): string {
  if (extra?.message) return extra.message

  const code = extra?.code?.toLowerCase()

  if (extra?.data) {
    if (Array.isArray(extra.data)) {
      const fields = extra.data
        .filter(Boolean)
        .map((field) => formatLsbField(field))
        .join(", ")
      if (code === "require" || code === "required") {
        return `Thiếu trường bắt buộc: ${fields || "không xác định"}`
      }
      if (code === "duplicate") {
        return `Đã tồn tại trên hệ thống hồ sơ nhân sự (LSB): ${fields || "không xác định"}`
      }
      return extra.code ? `${extra.code}: ${fields}` : fields
    }

    if (isMasterData(extra.data)) {
      const fields = extra.data.Master.flatMap((item) =>
        (item.fields ?? []).map((field) => formatLsbField(field, item.entityName))
      )
      if (code === "require" || code === "required") {
        return `Thiếu trường bắt buộc: ${fields.join(", ") || "không xác định"}`
      }
      if (code === "duplicate") {
        return `Đã tồn tại trên hệ thống hồ sơ nhân sự (LSB): ${fields.join(", ") || "không xác định"}`
      }
      return extra.code
        ? `${extra.code}: ${JSON.stringify(extra.data)}`
        : JSON.stringify(extra.data)
    }

    return extra.code ? `${extra.code}: ${JSON.stringify(extra.data)}` : JSON.stringify(extra.data)
  }

  if (extra?.code) return extra.code
  return fallback || "Lỗi không xác định từ hệ thống nhân sự"
}
