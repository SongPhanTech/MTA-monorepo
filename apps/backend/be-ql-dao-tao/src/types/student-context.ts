import type { CriteriaField, CriteriaOperator } from "@workspace/db"

export type StudentDataContext = {
  [K in CriteriaField]: K extends `IS_${string}` | `HAS_${string}` ? boolean : number
}

export type StudentCondition = {
  field: CriteriaField
  operator: CriteriaOperator
  value: number
  invert?: boolean | null
  tuple?: string[]
}
