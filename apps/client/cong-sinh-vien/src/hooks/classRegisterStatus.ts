import { ClassRegisterStatus } from "@workspace/db/client"

export type ClassRegisterStatusType = {
  value: ClassRegisterStatus
  label: string
  color: string
}

export const useClassRegisterStatus = () => {
  const classRegisterStatusOptions: ClassRegisterStatusType[] = [
    {
      value: ClassRegisterStatus.PENDING,
      label: "Mới nộp",
      color: "processing",
    },
    {
      value: ClassRegisterStatus.CANCELLED,
      label: "Đang được xem xét",
      color: "orange",
    },
    {
      value: ClassRegisterStatus.SUCCESS,
      label: "Được chấp thuận",
      color: "success",
    },
    {
      value: ClassRegisterStatus.FAILED,
      label: "Bị từ chối",
      color: "error",
    },
  ]

  const getClassRegisterStatusLabel = (value: ClassRegisterStatus | null | undefined): string =>
    classRegisterStatusOptions.find((opt) => opt.value === value)?.label || ""

  const getClassRegisterStatusColor = (value: ClassRegisterStatus | null | undefined): string =>
    classRegisterStatusOptions.find((opt) => opt.value === value)?.color || "default"

  return {
    classRegisterStatusOptions,
    getClassRegisterStatusLabel,
    getClassRegisterStatusColor,
  }
}
