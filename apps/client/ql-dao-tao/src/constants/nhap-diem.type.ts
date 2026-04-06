import type { FilterProps } from "@constants/type"
import type Decimal from "decimal.js"

export type FilterTable = FilterProps & {
  fullname?: string
  fixedClassCode?: string
  attendanceScore?: "asc" | "desc"
  midtermScore?: "asc" | "desc"
  examScore?: "asc" | "desc"
}

export type RowDisplayData = {
  attendanceScore?: number | null
  midtermScore?: number | null
  examScore?: number | null
  description?: string | null
  examBanned?: boolean | null
  examBannedReason?: string | null
  examPostponed?: boolean | null
  examPostponedReason?: string | null
  scoreToTakeExam?: number | null
  suspended?: boolean | null
  suspendedReason?: string | null
  finalScore?: Decimal | null
  finalScoreBase4?: number | string | null
  letter?: string | null
  isChanged?: boolean
}

export type SubjectClassScoreForm = {
  list: Record<
    string,
    {
      attendanceScore?: number | null
      midtermScore?: number | null
      examScore?: number | null
      description?: string | null
      examBanned?: boolean | null
      examBannedReason?: string | null
      examPostponed?: boolean | null
      examPostponedReason?: string | null
      scoreToTakeExam?: number | null
      suspended?: boolean | null
      suspendedReason?: string | null
      finalScore?: Decimal | null
      finalScoreBase4?: number | string | null
      letter?: string | null
      isChanged?: boolean
    }
  >
}

export type ScoreInputCellProps = {
  recordId: string
  field: keyof RowDisplayData
  fieldType: "cc" | "tx" | "thi"
  isActive: boolean
  displayValue: number | string
  readOnly: boolean
  step?: number
  formFieldName: [string, string, string]
  inputId: string
  validateRule: { validator: (_: unknown, value: unknown) => Promise<void> }
  onActivate: (id: string, field: keyof RowDisplayData) => void
  onBlur: () => void
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    type: "cc" | "tx" | "thi"
  ) => void
  onScoreDetailClick: (id: string) => void
}
