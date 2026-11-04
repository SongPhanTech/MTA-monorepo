import type { CriteriaField, CriteriaOperator } from "@workspace/db"

export type StudentDataContext = {
  // null = chưa có dữ liệu (VD: chưa tổng kết năm), tiêu chí sẽ không được coi là thoả
  [K in CriteriaField]: K extends `IS_${string}` | `HAS_${string}` ? boolean : number | null
}

export type StudentCondition = {
  field: CriteriaField
  operator: CriteriaOperator
  value: number
  invert?: boolean | null
  tuple?: string[]
}
