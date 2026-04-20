import { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas";

type GetRegisterStateParams = {
  record: GetClassesInfo200ItemSubjectClassItem;
  maxCredit?: number;
  totalRegisteredCredit: number;
  classToSubjectCodeMap: Map<string, string>;
  registeredSubjectCodes: Set<string>;
  isPending: boolean;
};

const getRegisterState = (args: GetRegisterStateParams) => {
  const {
    record,
    maxCredit,
    totalRegisteredCredit,
    classToSubjectCodeMap,
    registeredSubjectCodes,
    isPending,
  } = args;
  const isMaxed =
    (record?.maxStudent || 0) <= (record?._count?.subjectClassStudent || 0);

  const isRegistered = record?.classRegisterLogs?.length > 0;

  const isOverMaxCredit =
    maxCredit != null &&
    totalRegisteredCredit + (record?.credit ?? 0) > maxCredit;

  const parentSubjectCode = classToSubjectCodeMap.get(record?.id);

  const siblingAlreadyRegistered =
    !isRegistered &&
    !!parentSubjectCode &&
    registeredSubjectCodes.has(parentSubjectCode);

  const isDisabled =
    isMaxed ||
    isRegistered ||
    isPending ||
    isOverMaxCredit ||
    siblingAlreadyRegistered;

  return {
    isDisabled,
    isMaxed,
    isRegistered,
    isOverMaxCredit,
    siblingAlreadyRegistered,
  };
};
const registeredCoursesListHelper = {getRegisterState}

export default registeredCoursesListHelper