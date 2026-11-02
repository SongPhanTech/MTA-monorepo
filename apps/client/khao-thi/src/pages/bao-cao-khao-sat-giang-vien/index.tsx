import Select from "@components/commons/select"
import SurveylecturerReport from "@components/sub-pages/khao-sat/survey-lecturer-report"
import SurveyOrganizationReport from "@components/sub-pages/khao-sat/survey-oragation-report"
import DefaultLayout from "@layouts/default-layout"
import { $Enums } from "@workspace/db/client"
import {
  useFindManyClusterSurvey,
  useFindManyDM_DonVi,
  useFindManyLecturer,
  useFindManyTrainingCourse,
  useFindUniqueSemester,
  useFindUniqueTrainingObjectType,
} from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Flex, Row, Skeleton, Tree } from "antd"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState, type Key } from "react"

import OrganizationSurveyReport from "@/components/sub-pages/khao-sat/bao-cao-don-vi"
import {
  buildOrgLecturerTree,
  CLUSTER_LECTURER_INCLUDE,
  CLUSTER_LECTURER_SURVEY_INCLUDE,
  getLecturerSurveyStats,
  isLecturerNode,
  isOrgNode,
  lecturerTitle,
  mergeOrgs,
  ORG_SELECT,
  type ReportTreeNode,
} from "@/utils/buildOrgLecturerTree"
import {
  buildFacultySummarySectionTitle,
  clusterTrainingCourseWhere,
} from "@/utils/export-faculty-survey-summary-docx"
import { whereActiveOrganization } from "@workspace/libs/org-tree"

function trainingSystemNameFromDbType(type: $Enums.TrainingObjectTypes | undefined): string {
  if (type === $Enums.TrainingObjectTypes.MILITARY) return "Quân sự"
  if (type === $Enums.TrainingObjectTypes.CIVILIAN) return "Dân sự"
  return ""
}

export default function BaoCaoGiangVien() {
  const router = useRouter()
  const queryClusterId =
    typeof router.query.clusterId === "string" ? router.query.clusterId : undefined
  const queryClusterName = typeof router.query.name === "string" ? router.query.name : ""

  const [clusterId, setClusterId] = useState(queryClusterId)
  const [surveyName, setSurveyName] = useState(queryClusterName)
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [selectedNode, setSelectedNode] = useState<ReportTreeNode>()
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  useEffect(() => {
    if (!router.isReady || !queryClusterId) return
    setClusterId(queryClusterId)
    if (queryClusterName) setSurveyName(queryClusterName)
  }, [router.isReady, queryClusterId, queryClusterName])

  const { data: semester } = useFindUniqueSemester(
    {
      where: { id: semesterId },
      select: {
        name: true,
        semesterType: true,
        schoolYear: {
          select: {
            name: true,
          },
        },
      },
    },
    { enabled: !!semesterId }
  )
  const { data: trainingObjectType } = useFindUniqueTrainingObjectType(
    { where: { id: trainingObjectTypeId }, select: { name: true, type: true } },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: clusters = [] } = useFindManyClusterSurvey(
    {
      where: {
        surveys: {
          some: { semesterId, trainingObjectTypeId },
        },
      },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    },
    { enabled: !!semesterId && !!trainingObjectTypeId }
  )

  const { data: clusterCourses = [] } = useFindManyTrainingCourse(
    {
      where: clusterTrainingCourseWhere(clusterId as string),
      select: { id: true, name: true, startYear: true },
      orderBy: [{ startYear: "asc" }, { name: "asc" }],
    },
    { enabled: !!clusterId }
  )

  const sectionTitle = useMemo(
    () => buildFacultySummarySectionTitle(trainingObjectType?.name, clusterCourses),
    [clusterCourses, trainingObjectType?.name]
  )

  const { data: organizations = [], isFetching } = useFindManyDM_DonVi(
    {
      where: {
        ...whereActiveOrganization,
        OR: [
          { sMa: getRuntimeEnv("NEXT_PUBLIC_ROOT_ORG_CODE") || "HD" },
          { iCapDonVi: 0, iLoaiDonVi: 0 },
          { iCapDonVi: 1 },
          { iLoaiDonVi: { in: [5, 6, 7] } },
        ],
      },
      select: ORG_SELECT,
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },
    { refetchOnWindowFocus: false }
  )

  const { data: clusterLecturers = [] } = useFindManyLecturer(
    {
      where: {
        survey: { some: { clusterSurveyId: clusterId } },
      },
      orderBy: { userProfile: { firstName: "asc" } },
      include: {
        ...CLUSTER_LECTURER_INCLUDE,
        survey: {
          where: { clusterSurveyId: clusterId },
          include: CLUSTER_LECTURER_SURVEY_INCLUDE,
        },
      },
    },
    { enabled: !!clusterId, refetchOnWindowFocus: false }
  )

  const orgs = useMemo(
    () => mergeOrgs(organizations, clusterLecturers),
    [organizations, clusterLecturers]
  )
  const treeData = useMemo(
    () => buildOrgLecturerTree(orgs, clusterLecturers),
    [orgs, clusterLecturers]
  )
  const expandedToFacultyKeys = useMemo(() => {
    const byId = new Map(orgs.map((org) => [org.Id, org]))
    const keys = new Set<string>()
    for (const org of orgs) {
      if (org.iLoaiDonVi !== 5 && org.iLoaiDonVi !== 6) continue
      let parentId = org.sParentId
      while (parentId && byId.has(parentId)) {
        keys.add(parentId)
        parentId = byId.get(parentId)?.sParentId ?? null
      }
    }
    return [...keys]
  }, [orgs])

  useEffect(() => {
    setExpandedKeys(expandedToFacultyKeys)
  }, [expandedToFacultyKeys])

  const findTreeNode = (nodes: ReportTreeNode[], key: Key): ReportTreeNode | undefined => {
    for (const node of nodes) {
      if (node.key === key) return node
      if (isOrgNode(node)) {
        const found = findTreeNode(node.children, key)
        if (found) return found
      }
    }
    return undefined
  }

  const report = useMemo(() => {
    if (!clusterId) {
      return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
    }
    if (!selectedNode) {
      return <>Vui lòng chọn đối tượng</>
    }

    const semesterName = semester?.name ?? ""
    const schoolYearName = semester?.schoolYear?.name ?? ""
    const trainingObjectTypeName = trainingObjectType?.name ?? ""
    const trainingSystemName = trainingSystemNameFromDbType(trainingObjectType?.type)

    if (isOrgNode(selectedNode)) {
      const { org, parentOrg } = selectedNode
      const isAcademy = org.iCapDonVi === 0 && org.iLoaiDonVi === 0
      if (isAcademy) {
        return (
          <OrganizationSurveyReport
            selectedId={clusterId}
            surveyName={surveyName}
            organizationId={org.Id}
            trainingObjectTypeName={trainingObjectTypeName}
            semesterId={semesterId || ""}
            trainingObjectTypeId={trainingObjectTypeId || ""}
          />
        )
      }

      const isDepartment = org.iCapDonVi === 3
      return (
        <SurveyOrganizationReport
          selectedId={clusterId}
          organizationId={org.Id}
          surveyName={surveyName}
          trainingObjectTypeName={trainingObjectTypeName}
          semesterName={semesterName}
          trainingSystemName={trainingSystemName}
          organizationName={isDepartment ? (parentOrg?.sTen ?? "") : (org.sTen ?? "")}
          organizationCode={isDepartment ? (parentOrg?.sMa ?? "") : (org.sMa ?? "")}
          departmentName={isDepartment ? (org.sTen ?? "") : ""}
          departmentCode={isDepartment ? (org.sMa ?? "") : ""}
          schoolYearName={schoolYearName}
          selectedItem={org}
          selectedOrgNode={selectedNode}
          sectionTitle={sectionTitle}
        />
      )
    }

    if (isLecturerNode(selectedNode)) {
      const { lecturer } = selectedNode
      const org = lecturer.userProfile?.donVi
      const isDepartment = org?.iCapDonVi === 3
      const parentOrg = isDepartment
        ? organizations.find((item) => item.Id === org?.sParentId)
        : null
      const stats = getLecturerSurveyStats(lecturer)

      return (
        <SurveylecturerReport
          selectedId={clusterId}
          lectureId={lecturer.id}
          surveyName={surveyName}
          trainingObjectTypeName={trainingObjectTypeName}
          completed={stats.completed}
          total={stats.total}
          semesterName={semesterName}
          trainingSystemName={trainingSystemName}
          organizationName={(isDepartment ? parentOrg?.sTen : org?.sTen) ?? undefined}
          organizationCode={(isDepartment ? parentOrg?.sMa : org?.sMa) ?? undefined}
          lecturerName={lecturerTitle(lecturer)}
          lecturerCode={lecturer.userProfile?.code ?? undefined}
          departmentName={isDepartment ? (org?.sTen ?? "") : ""}
          departmentCode={isDepartment ? (org?.sMa ?? "") : ""}
          schoolYearName={schoolYearName}
        />
      )
    }

    return <>Vui lòng chọn đối tượng</>
  }, [
    clusterId,
    selectedNode,
    surveyName,
    semester,
    trainingObjectType,
    semesterId,
    trainingObjectTypeId,
    organizations,
    sectionTitle,
  ])

  return (
    <Row gutter={[16, 4]}>
      <Col span={24}>
        <Flex justify="space-between">
          <Select
            value={clusterId}
            onChange={(value, option) => {
              const selected = Array.isArray(option) ? option[0] : option
              setClusterId(typeof value === "string" ? value : undefined)
              if (typeof selected?.label === "string") setSurveyName(selected.label)
            }}
            className="mr-4 w-[250px]"
            options={clusters.map((cluster) => ({
              label: cluster.name,
              value: cluster.id,
            }))}
            placeholder="Chọn đợt khảo sát"
            dropdownStyle={{
              maxHeight: 400,
              overflow: "auto",
              width: "fit-content",
              maxWidth: 400,
            }}
            dropdownMatchSelectWidth={false}
          />
        </Flex>
      </Col>
      <Col span={6}>
        {isFetching ? (
          <Skeleton />
        ) : (
          <>
            <Tree<ReportTreeNode>
              showIcon
              showLine
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              onExpand={setExpandedKeys}
              treeData={treeData}
              className="w-full mb-1 min-w-[250px]"
              style={{ maxHeight: "calc(100vh - 210px)", overflow: "auto" }}
              onSelect={(keys, info) => {
                setSelectedKeys(keys)
                const key = keys[0]
                setSelectedNode(
                  (key != null ? findTreeNode(treeData, key) : undefined) ?? info.node
                )
              }}
            />
            <div className="mb-3 text-xs text-gray-500">
              Tên đỏ: chưa có ai làm khảo sát. Tên đen: đã có người làm.
            </div>
          </>
        )}
      </Col>
      <Col span={18} className="w-[calc(100%-250px)]">
        {isFetching ? <Skeleton /> : report}
      </Col>
    </Row>
  )
}

BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
