import DefaultLayout from "@layouts/default-layout"
import { buildOrgFlat } from "@lib/utils"
import PhanCongGiangDay from "@pages/ke-hoach-giao-duc/_pages/phan-cong-giang-day"
import { $Enums, type Prisma } from "@workspace/db/client"
import { useCountSubjectClass, useFindManyDM_DonVi } from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Tabs } from "antd"
import type React from "react"
import { useMemo } from "react"

export default function KhaoBoMonPhanCongGiangDay() {
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const orgId = window.contextData?.organizationId
  const where = useMemo(
    () =>
      ({
        semesterId,
        deletedAt: null,
        active: true,
        trainingObjectTypeId,
        lecturerAssignmentDeadline: {
          not: null,
        },
      }) satisfies Prisma.SubjectClassWhereInput,
    [semesterId, trainingObjectTypeId]
  )

  const { data: dmDonViIds = [] } = useFindManyDM_DonVi(
    {
      select: { Id: true },
      where: whereOrganization,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    {
      refetchOnWindowFocus: false,
    }
  )

  const orgIds = useMemo(
    () =>
      [
        ...buildOrgFlat(
          dmDonViIds.map((e) => ({
            Id: e.Id,
            sTen: null,
            sParentId: null,
            sMa: null,
          })),
          orgId || "0"
        ).map((org) => org.value),
        orgId,
      ].filter(Boolean) as string[],
    [dmDonViIds, orgId]
  )

  const countEnabled = !!semesterId && !!trainingObjectTypeId && orgIds.length > 0
  const countByOrg = {
    subject: {
      managementOrganizationId: { in: orgIds },
    },
  }

  const { data: countNormal = 0 } = useCountSubjectClass(
    {
      where: {
        ...where,
        type: $Enums.SubjectClassType.NORMAL,
        ...countByOrg,
      },
    },
    { enabled: countEnabled, refetchOnWindowFocus: false }
  )
  const { data: countRetake = 0 } = useCountSubjectClass(
    {
      where: {
        ...where,
        type: $Enums.SubjectClassType.RETAKE,
        ...countByOrg,
      },
    },
    { enabled: countEnabled, refetchOnWindowFocus: false }
  )
  const { data: countReExam = 0 } = useCountSubjectClass(
    {
      where: {
        ...where,
        type: $Enums.SubjectClassType.REEXAM,
        ...countByOrg,
      },
    },
    { enabled: countEnabled, refetchOnWindowFocus: false }
  )

  return (
    <Tabs destroyInactiveTabPane>
      <Tabs.TabPane key={$Enums.SubjectClassType.NORMAL} tab={`Lớp môn học (${countNormal})`}>
        <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.NORMAL} />
      </Tabs.TabPane>
      <Tabs.TabPane key={$Enums.SubjectClassType.RETAKE} tab={`Lớp học lại (${countRetake})`}>
        <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.RETAKE} />
      </Tabs.TabPane>
      <Tabs.TabPane key={$Enums.SubjectClassType.REEXAM} tab={`Lớp thi lại (${countReExam})`}>
        <PhanCongGiangDay khoaBoMon type={$Enums.SubjectClassType.REEXAM} />
      </Tabs.TabPane>
    </Tabs>
  )
}

KhaoBoMonPhanCongGiangDay.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
