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
