import { ExamType } from "@workspace/db/client"
import { examTypeOptions } from "@workspace/libs/constants"

export type ExamTypeOption = {
  value: ExamType
  label: string
}

export enum ExamTypeExportPCGD {
  ORAL = "VĐ",
  OfflineWritten = "TV",
  Practice = "TH",
  OnlineWritten = "TT",
}

export const useExamTypeOptions = () => {
  const exportPCGDMap: Partial<Record<ExamType, ExamTypeExportPCGD>> = {
    [ExamType.Oral]: ExamTypeExportPCGD.ORAL,
    [ExamType.OfflineWritten]: ExamTypeExportPCGD.OfflineWritten,
    [ExamType.Practice]: ExamTypeExportPCGD.Practice,
    [ExamType.OnlineWritten]: ExamTypeExportPCGD.OnlineWritten,
  }

  const getExamTypeLabel = (
    value: ExamType | null | undefined,
    options?: { exportPCGD?: boolean }
  ): string => {
    if (options?.exportPCGD && value && exportPCGDMap[value]) return exportPCGDMap[value]!

    return examTypeOptions.find((opt) => opt.value === value)?.label ?? ""
  }

  return {
    options: examTypeOptions,
    getExamTypeLabel,
  }
}
