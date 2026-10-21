import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas"

type GetRegisterStateParams = {
  record: GetClassesInfo200ItemSubjectClassItem
  maxCredit?: number
  totalRegisteredCredit: number
  classToSubjectCodeMap: Map<string, string>
  registeredSubjectCodes: Set<string>
  /** Chỉ khóa đúng dòng đang chờ job — không khóa cả bảng */
  isRowPending?: boolean
}

const getRegisterState = (args: GetRegisterStateParams) => {
  const {
    record,
    maxCredit,
    totalRegisteredCredit,
    classToSubjectCodeMap,
    registeredSubjectCodes,
    isRowPending = false,
  } = args
  const isMaxed =
    Boolean(record?.maxStudent && record.maxStudent > 0) &&
    record.maxStudent <= (record?._count?.subjectClassStudent || 0)

  const isRegistered = record?.classRegisterLogs?.length > 0

  const isOverMaxCredit =
    maxCredit != null && totalRegisteredCredit + (record?.credit ?? 0) > maxCredit

  const parentSubjectCode = classToSubjectCodeMap.get(record?.id)

  const siblingAlreadyRegistered =
    !isRegistered && !!parentSubjectCode && registeredSubjectCodes.has(parentSubjectCode)

  const isDisabled =
    isMaxed || isRegistered || isRowPending || isOverMaxCredit || siblingAlreadyRegistered

  return {
    isDisabled,
    isMaxed,
    isRegistered,
    isOverMaxCredit,
    siblingAlreadyRegistered,
    isRowPending,
  }
}
const registeredCoursesListHelper = { getRegisterState }

export default registeredCoursesListHelper
