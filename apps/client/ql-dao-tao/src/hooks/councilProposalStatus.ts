import { CouncilProposalStatus } from "@workspace/db/client"

export type CouncilProposalStatusOption = {
  value: CouncilProposalStatus
  label: string
}

export const useCouncilProposalStatusOptions = () => {
  const councilProposalStatusOptions: CouncilProposalStatusOption[] = [
    { value: CouncilProposalStatus.PENDING, label: "Chờ phê duyệt" },
    { value: CouncilProposalStatus.APPROVED, label: "Đã phê duyệt" },
    { value: CouncilProposalStatus.REJECTED, label: "Từ chối" },
  ]

  const getCouncilProposalStatusLabel = (
    value: CouncilProposalStatus | null | undefined
  ): string => {
    return councilProposalStatusOptions.find((opt) => opt.value === value)?.label || ""
  }

  return {
    councilProposalStatusOptions,
    getCouncilProposalStatusLabel,
  }
}
