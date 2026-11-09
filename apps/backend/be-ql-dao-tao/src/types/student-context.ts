import type { CriteriaField, CriteriaOperator } from "@workspace/db"

export type StudentDataContext = {
  // null = chưa có dữ liệu (VD: chưa tổng kết năm), tiêu chí sẽ không được coi là thoả
  [K in CriteriaField]: K extends `IS_${string}` | `HAS_${string}` ? boolean : number | null
}

/** Phần so sánh của một tiêu chí (không gồm nguồn giá trị) */
export type ComparableCondition = {
  operator: CriteriaOperator
  value: number
  invert?: boolean | null
  tuple?: string[]
}

export type StudentCondition = ComparableCondition & {
  field: CriteriaField
}
