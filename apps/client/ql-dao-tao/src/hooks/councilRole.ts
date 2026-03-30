import { CouncilRole } from "@workspace/db/client"

export type CouncilRoleOption = {
  value: CouncilRole
  label: string
}

export const useCouncilRoleOptions = () => {
  const councilRoleOptions: CouncilRoleOption[] = [
    { value: CouncilRole.CHAIRMAN, label: "Chủ tịch" },
    { value: CouncilRole.SECRETARY, label: "Thư ký" },
    { value: CouncilRole.REVIEWER_1, label: "Phản biện 1" },
    { value: CouncilRole.REVIEWER_2, label: "Phản biện 2" },
    { value: CouncilRole.MEMBER, label: "Ủy viên" },
  ]

  const getCouncilRoleLabel = (value: CouncilRole | null | undefined): string => {
    return councilRoleOptions.find((opt) => opt.value === value)?.label || "Giảng viên hướng dẫn"
  }

  return {
    councilRoleOptions,
    getCouncilRoleLabel,
  }
}
