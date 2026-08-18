import { FolderOpenOutlined, UserOutlined } from "@ant-design/icons"
import Select from "@components/commons/select"
import SurveylecturerReport from "@components/sub-pages/khao-sat/survey-lecturer-report"
import SurveyOrganizationReport from "@components/sub-pages/khao-sat/survey-oragation-report"
import DefaultLayout from "@layouts/default-layout"
import {
  useFindManyClusterSurvey,
  useFindManyDM_DonVi,
  useFindManyLecturer,
  useFindManySurvey,
  useFindUniqueSemester,
  useFindUniqueTrainingObjectType,
} from "@workspace/db/hooks"

import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Flex, Row, Skeleton, Tree } from "antd"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState, type Key } from "react"

import OrganizationSurveyReport from "@/components/sub-pages/khao-sat/bao-cao-don-vi"
import { getRuntimeEnv } from "@workspace/libs"
import { $Enums } from "@workspace/db/client"
import dayjs from "dayjs"

/**
 * Nhãn hệ đào tạo cho mẫu báo cáo — chỉ theo `TrainingObjectType.type` (không đoán qua tên/regex).
 * Quốc tế: không đưa chữ "Quốc tế" vào mẫu → trả về rỗng.
 */
function trainingSystemNameFromDbType(type: $Enums.TrainingObjectTypes | undefined): string {
  if (type == null) {
    return ""
  }
  if (type === $Enums.TrainingObjectTypes.MILITARY) {
    return "Quân sự"
  }
  if (type === $Enums.TrainingObjectTypes.CIVILIAN) {
    return "Dân sự"
  }
  if (type === $Enums.TrainingObjectTypes.INTERNATIONAL_MILITARY) {
    return ""
  }
  return ""
}

function buildOrgAndLectureTree(
  list: Array<any>,
  lecturers: Array<any>,
  lecturerStatusById?: Map<string, { completed: number; total: number }>
): Array<any> {
  const map = new Map<string, any>()
  const roots: Array<any> = []
  const attachedLecturerIds = new Set<string>()

  const lecturerTitle = (lecturer: any) => {
    const name = lecturer.userProfile?.fullName || "Giảng viên không tên"
    const status = lecturerStatusById?.get(lecturer.id)
    const hasResponse = (status?.completed || 0) > 0
    return (
      <span style={{ color: hasResponse ? "#111827" : "#ff4d4f" }}>{name}</span>
    )
  }

  for (const item of list) {
    const orgLecturers = lecturers.filter((lecturer) => lecturer.organizationId === item.id)
    orgLecturers.forEach((lecturer) => attachedLecturerIds.add(lecturer.id))
    map.set(item.id, {
      ...item,
      parent: list.find((p) => p.id === item.parentId),
      title: item.name || "Đơn vị không tên",
      key: item.id,
      icon: <FolderOpenOutlined />,
      selectable: true,
      children: orgLecturers.map((lecturer) => ({
        ...lecturer,
        title: lecturerTitle(lecturer),
        key: `${lecturer.id}`,
        icon: <UserOutlined />,
        parent: item,
      })),
    })
  }

  for (const item of list) {
    const node = map.get(item.id)
    if (!node) continue
    const parentId = item.parentId
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const lecturer of lecturers) {
    if (attachedLecturerIds.has(lecturer.id)) continue
    roots.push({
      ...lecturer,
      title: lecturerTitle(lecturer),
      key: `${lecturer.id}`,
      icon: <UserOutlined />,
    })
  }

  return roots
}

export default function BaoCaoGiangVien() {
  const router = useRouter()
  const queryClusterId =
    typeof router.query.clusterId === "string" ? router.query.clusterId : undefined
  const queryClusterName = typeof router.query.name === "string" ? router.query.name : ""

  const [filters, setFilters] = useState<any>({
    name: "",
    surveyName: queryClusterName,
    surveyId: undefined,
    lectureId: undefined,
    organizationId: undefined,
    semesterIds: undefined,
    clusterId: queryClusterId,
  })
  const [searchText, setSearchText] = useState<any>("")
  const [selectedKeys, setSelectedKeys] = useState<any>([])
  const [selectedItem, setSelectedItem] = useState<any>()

  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  useEffect(() => {
    if (!router.isReady || !queryClusterId) return
    setFilters((prev: any) => ({
      ...prev,
      clusterId: queryClusterId,
      surveyName: queryClusterName || prev.surveyName,
    }))
  }, [router.isReady, queryClusterId, queryClusterName])

  const { data: semester } = useFindUniqueSemester(
    {
      where: { id: semesterId },
      select: { name: true },
    },
    { enabled: !!semesterId }
  )
  const semesterName = semester?.name ?? ""

  const { data: trainingObjectType } = useFindUniqueTrainingObjectType(
    {
      where: { id: trainingObjectTypeId },
      select: { name: true, type: true },
    },
    {
      enabled: !!trainingObjectTypeId,
    }
  )
  const trainingObjectTypeName = trainingObjectType?.name ?? ""
  const trainingSystemName = trainingSystemNameFromDbType(trainingObjectType?.type)

  const { data = [], refetch } = useFindManyClusterSurvey({
    where: {
      surveys: {
        some: {
          semesterId,
          trainingObjectTypeId,
        },
      },
    },
    include: {
      surveyObjectType: true,
      surveyTopic: true,
      surveyQuestion: true,
      surveys: {
        include: {
          surveySessions: true,
          subjectClass: {
            include: {
              semester: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const {
    data: organizations = [],
    isLoading: organizationsLoading,
    isFetching,
    error: organizationsError,
  } = useFindManyDM_DonVi(
    {
      where: {
        // ...(searchText && {
        //     OR: [
        //         { sTen: { contains: searchText, mode: 'insensitive' } },
        //         { sMa: { contains: searchText, mode: 'insensitive' } },
        //     ],
        // }),
        OR: [
          {
            sMa: getRuntimeEnv("NEXT_PUBLIC_ROOT_ORG_CODE") || "HD",
          },
          {
            iCapDonVi: 0,
            iLoaiDonVi: 0,
          },
          {
            iCapDonVi: 1,
          },
          {
            iLoaiDonVi: {
              in: [5, 6, 7],
            },
          },
        ],
      },
      select: {
        Id: true,
        sMa: true,
        sTen: true,
        bActive: true,
        iCapDonVi: true,
        iDictionaryKey: true,
        iLoaiDonVi: true,
        iNhomDonVi: true,
        sParentId: true,
      },
      orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
    },

    {
      refetchOnWindowFocus: false,
    }
  )

  const { data: progressSurveys = [] } = useFindManySurvey(
    {
      where: {
        clusterSurveyId: filters.clusterId,
      },
      include: {
        lecture: {
          include: {
            userProfile: true,
            organization: true,
          },
        },
        subjectClass: {
          include: {
            subjectClassStudent: {
              select: {
                studentId: true,
              },
            },
          },
        },
        surveySessions: {
          where: {
            OR: [{ isCompleted: true }, { completedAt: { not: null } }],
          },
          select: {
            studentId: true,
          },
        },
      },
    },
    {
      enabled: !!filters.clusterId,
      refetchOnWindowFocus: false,
    }
  )

  const { data: clusterLecturers = [] } = useFindManyLecturer(
    {
      where: {
        survey: {
          some: {
            clusterSurveyId: filters.clusterId,
          },
        },
      },
      orderBy: {
        userProfile: {
          firstName: "asc",
        },
      },
      include: {
        userProfile: true,
        organization: true,
      },
    },
    {
      enabled: !!filters.clusterId,
      refetchOnWindowFocus: false,
    }
  )

  const organizationsForTree = useMemo(() => {
    const byId = new Map(organizations.map((org) => [org.Id, org]))
    for (const lecturer of clusterLecturers) {
      const org = lecturer.organization
      if (org?.Id && !byId.has(org.Id)) {
        byId.set(org.Id, org)
      }
    }
    return Array.from(byId.values())
  }, [organizations, clusterLecturers])

  const lecturersForTree = clusterLecturers

  const orgKeys = useMemo(
    () => organizationsForTree.map((org) => org.Id),
    [organizationsForTree]
  )
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

  useEffect(() => {
    setExpandedKeys(orgKeys)
  }, [orgKeys])

  const hanleSearchReport = () => {}

  const getLecturerDisplayName = (lecturer: any) => {
    const fullName =
      `${lecturer?.userProfile?.lastName ?? ""} ${lecturer?.userProfile?.firstName ?? ""}`.trim() ||
      lecturer?.userProfile?.fullName ||
      "Giảng viên không tên"

    return fullName
  }

  const progressData = useMemo(() => {
    const orgById = new Map(organizationsForTree.map((org: any) => [org.Id, org]))
    const isFacultyOrg = (org: any) => [5, 6].includes(org?.iLoaiDonVi)

    const getDescendantOrgIds = (orgId: string): string[] => {
      const children = organizationsForTree.filter((item: any) => item.sParentId === orgId)
      return children.flatMap((item: any) => [item.Id, ...getDescendantOrgIds(item.Id)])
    }

    type LecturerAgg = {
      id: string
      organizationId?: string | null
      code?: string | null
      userProfile?: any
      studentIds: Set<string>
      completedIds: Set<string>
    }

    const byLecturer = new Map<string, LecturerAgg>()

    for (const lecturer of clusterLecturers as any[]) {
      if (!lecturer?.id) continue
      byLecturer.set(lecturer.id, {
        id: lecturer.id,
        organizationId: lecturer.organizationId,
        code: lecturer.code,
        userProfile: lecturer.userProfile,
        studentIds: new Set<string>(),
        completedIds: new Set<string>(),
      })
      if (lecturer.organization?.Id && !orgById.has(lecturer.organization.Id)) {
        orgById.set(lecturer.organization.Id, lecturer.organization)
      }
    }

    for (const survey of progressSurveys as any[]) {
      const lecturer = survey.lecture
      const lecturerId = survey.lectureId || lecturer?.id
      if (!lecturerId) continue

      let agg = byLecturer.get(lecturerId)
      if (!agg) {
        agg = {
          id: lecturerId,
          organizationId: lecturer?.organizationId,
          code: lecturer?.code,
          userProfile: lecturer?.userProfile,
          studentIds: new Set<string>(),
          completedIds: new Set<string>(),
        }
        byLecturer.set(lecturerId, agg)
      } else if (!agg.organizationId && lecturer?.organizationId) {
        agg.organizationId = lecturer.organizationId
      }

      if (lecturer?.organization?.Id && !orgById.has(lecturer.organization.Id)) {
        orgById.set(lecturer.organization.Id, lecturer.organization)
      }

      for (const entry of survey.subjectClass?.subjectClassStudent || []) {
        if (entry?.studentId) agg.studentIds.add(entry.studentId)
      }

      for (const session of survey.surveySessions || []) {
        if (session?.studentId && agg.studentIds.has(session.studentId)) {
          agg.completedIds.add(session.studentId)
        }
      }
    }

    const lecturers = Array.from(byLecturer.values())
    const studentStats = Object.fromEntries(
      lecturers.map((item) => [
        item.id,
        { total: item.studentIds.size, completed: item.completedIds.size },
      ])
    )
    const lecturerOrgIds = new Set(
      lecturers.map((item) => item.organizationId).filter((id): id is string => !!id)
    )
    const orgs = Array.from(orgById.values())

    const countStudents = (orgId: string) => {
      const orgIds = [orgId, ...getDescendantOrgIds(orgId)]
      return lecturers
        .filter((item) => item.organizationId && orgIds.includes(item.organizationId))
        .reduce((sum, item) => sum + (studentStats[item.id]?.total || 0), 0)
    }

    const countCompleted = (orgId: string) => {
      const orgIds = [orgId, ...getDescendantOrgIds(orgId)]
      return lecturers
        .filter((item) => item.organizationId && orgIds.includes(item.organizationId))
        .reduce((sum, item) => sum + (studentStats[item.id]?.completed || 0), 0)
    }

    const facultyRows = orgs.filter(isFacultyOrg).map((item: any) => ({
      key: `faculty-${item.Id}`,
      parentKey: undefined,
      type: "faculty" as const,
      name: `${item.sMa || ""} - ${item.sTen || ""}`.trim(),
      completed: countCompleted(item.Id),
      total: countStudents(item.Id),
    }))

    const departmentRows = orgs
      .filter((item: any) => {
        if (isFacultyOrg(item)) return false
        return item.iLoaiDonVi === 7 || lecturerOrgIds.has(item.Id)
      })
      .map((item: any) => {
        const parent = orgById.get(item.sParentId)
        const parentKey = isFacultyOrg(parent)
          ? `faculty-${parent.Id}`
          : parent && !isFacultyOrg(parent)
            ? `department-${parent.Id}`
            : undefined

        return {
          key: `department-${item.Id}`,
          parentKey,
          type: "department" as const,
          name: `${item.sMa || ""} - ${item.sTen || ""}`.trim(),
          completed: countCompleted(item.Id),
          total: countStudents(item.Id),
        }
      })

    const lecturerRows = lecturers
      .filter((item) => item.organizationId)
      .map((item) => {
        const organization = orgById.get(item.organizationId)
        const lecturerName = getLecturerDisplayName(item)
        const lecturerCode = item.code?.trim() || ""
        const name =
          [lecturerCode, lecturerName].filter(Boolean).join(" - ") || "Giảng viên không tên"

        return {
          key: `lecturer-${item.id}`,
          parentKey: isFacultyOrg(organization)
            ? `faculty-${item.organizationId}`
            : `department-${item.organizationId}`,
          type: "lecturer" as const,
          name,
          completed: studentStats[item.id]?.completed || 0,
          total: studentStats[item.id]?.total || 0,
        }
      })

    const totalCompleted = lecturers.reduce(
      (sum, item) => sum + (studentStats[item.id]?.completed || 0),
      0
    )
    const totalStudents = lecturers.reduce(
      (sum, item) => sum + (studentStats[item.id]?.total || 0),
      0
    )

    return [
      ...facultyRows,
      ...departmentRows,
      ...lecturerRows,
      {
        key: "total",
        type: "total" as const,
        name: "Tổng số",
        completed: totalCompleted,
        total: totalStudents,
      },
    ]
  }, [organizationsForTree, progressSurveys, clusterLecturers])

  const lecturerStatusById = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>()
    for (const row of progressData) {
      if (row.type !== "lecturer") continue
      map.set(row.key.replace(/^lecturer-/, ""), {
        completed: row.completed,
        total: row.total,
      })
    }
    return map
  }, [progressData])

  const treeData: any[] = useMemo(() => {
    if (!organizationsForTree.length) return []

    return buildOrgAndLectureTree(
      organizationsForTree.map((org) => ({
        ...org,
        id: org.Id,
        name: `${org.sMa} - ${org.sTen}`,
        parentId: org.sParentId,
      })),
      lecturersForTree.map((lec) => ({
        ...lec,
        id: lec.id,
        userProfile: {
          ...lec.userProfile,
          fullName:
            `${lec.userProfile?.lastName ?? ""} ${lec.userProfile?.firstName ?? ""}`.trim() ||
            "Giảng viên không tên",
        },
        selectable: true,
        organizationId: lec.organizationId,
      })),
      lecturerStatusById
    )
  }, [organizationsForTree, lecturersForTree, lecturerStatusById])

  const items = useMemo(() => {
    if (!filters?.clusterId) {
      return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
    }
    if (filters?.clusterId) {

      if (selectedItem?.id && selectedItem?.iCapDonVi === 0 && selectedItem?.iLoaiDonVi === 0) {
        return (
          <OrganizationSurveyReport
            selectedId={filters?.clusterId}
            surveyName={filters?.surveyName}
            organizationId={selectedItem?.id}
            trainingObjectTypeName={trainingObjectTypeName}
            semesterId={semesterId || ""}
            trainingObjectTypeId={trainingObjectTypeId || ""}
          />
        )
      }

      if (selectedItem?.id && selectedItem?.iCapDonVi && selectedItem?.iLoaiDonVi) {
        return (
          <SurveyOrganizationReport
            selectedId={filters.clusterId}
            organizationId={selectedItem.id}
            surveyName={filters?.surveyName}
            trainingObjectTypeName={trainingObjectTypeName}
            semesterName={semesterName}
            trainingSystemName={trainingSystemName}
            organizationName={
              selectedItem.iCapDonVi === 3 ? selectedItem.parent?.sTen : selectedItem.sTen
            }
            organizationCode={
              selectedItem.iCapDonVi === 3 ? selectedItem.parent?.sMa : selectedItem.sMa
            }
            departmentName={selectedItem.iCapDonVi === 3 ? selectedItem.sTen : ""}
            departmentCode={selectedItem.iCapDonVi === 3 ? selectedItem.sMa : ""}
            selectedItem={selectedItem}
          />
        )
      }

      if (selectedItem?.id && !selectedItem?.iCapDonVi) {
        const org = selectedItem.organization
        const isDepartment = org?.iCapDonVi === 3
        const parentOrg = isDepartment
          ? organizations.find((o: any) => o?.Id === org?.sParentId || o?.id === org?.sParentId)
          : null
        return (
          <SurveylecturerReport
            selectedId={filters?.clusterId}
            lectureId={selectedItem?.id}
            surveyName={filters?.surveyName}
            progressData={progressData}
            trainingObjectTypeName={trainingObjectTypeName}
            semesterName={semesterName}
            trainingSystemName={trainingSystemName}
            organizationName={isDepartment ? parentOrg?.sTen : org?.sTen}
            organizationCode={isDepartment ? parentOrg?.sMa : org?.sMa}
            lecturerName={selectedItem?.userProfile?.fullName}
            lecturerCode={selectedItem?.code}
            departmentName={isDepartment ? org?.sTen : ""}
            departmentCode={isDepartment ? org?.sMa : ""}
          />
        )
      }
      return <>Vui lòng chọn đối tượng</>
      // if (filtersMore.surveyId) {
      //     return <SurveyReport selectedId={filtersMore?.surveyId || ''} />
      // }
      // if (filtersMore.lectureId) {
      //     return (
      //         <LecturerSurveyReport
      //             selectedId={filtersMore?.clusterId}
      //             lectureId={filtersMore?.lectureId || ''}
      //             sublectClass={filters}
      //             setSublectClass={(value: any) => {
      //                 setFilters({ ...filters, surveyId: value })
      //             }}
      //         />
      //     )
      // }
      // if (filtersMore.organizationId) {
      //     return (
      //         <ClusterSurveyReport
      //             selectedId={filtersMore?.clusterId}
      //             surveyName={filtersMore?.name}
      //             surveyId={filters?.surveyId || ''}
      //             setSurvey={(value) => {
      //                 setFilters({ ...filters, surveyId: value })
      //             }}
      //             organizationSelected={filters?.organizationId}
      //         />
      //     )
      // }
      // return (
      //     <OrganizationSurveyReport
      //         selectedId={filtersMore?.clusterId}
      //         surveyName={filtersMore?.name}
      //         organizationSelected={filters?.organizationId}
      //         setOrganizationSelected={(value) => {
      //             setFilters({ ...filters, organizationId: value })
      //         }}
      //     />
      // )
    }
    return
  }, [
    filters,
    selectedItem,
    trainingObjectTypeName,
    trainingSystemName,
    semesterName,
    semesterId,
    trainingObjectTypeId,
    organizations,
    progressData,
  ])
  return (
    <Row gutter={[16, 4]}>
      <Col span={24}>
        <Flex justify="space-between">
          <Flex>
            <Select
              value={filters.clusterId}
              onChange={(value, option: any) => {
                setFilters((prev: any) => ({
                  ...prev,
                  clusterId: value,
                  surveyName: option?.label,
                }))
              }}
              className="mr-4 w-[250px]"
              options={data.map((i) => {
                return {
                  label: i.name,
                  value: i.id,
                }
              })}
              placeholder="Chọn đợt khảo sát"
              dropdownStyle={{
                maxHeight: 400,
                overflow: "auto",
                width: "fit-content",
                maxWidth: 400,
              }}
              dropdownMatchSelectWidth={false}
            />
            {/* <Input
                            placeholder="Tìm kiếm"
                            className="mr-4 w-[250px]"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                            }}
                        /> */}
          </Flex>
          {/* <Button onClick={hanleSearchReport} type="primary">
                        Tìm kiếm
                    </Button> */}
        </Flex>
      </Col>
      <Col span={6}>
        {isFetching ? (
          <Skeleton />
        ) : (
          <>
            <Tree
              showIcon
              showLine
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              treeData={treeData}
              className="w-full mb-1 min-w-[250px]"
              style={{ maxHeight: "calc(100vh - 210px)", overflow: "auto" }}
              onSelect={(key, info) => {
                setSelectedKeys(key)
                setSelectedItem(info.node)
              }}
            />
            <div className="mb-3 text-xs text-gray-500">
              Tên đỏ: chưa có ai làm khảo sát. Tên đen: đã có người làm.
            </div>
          </>
        )}
      </Col>

      <Col span={18} className="w-[calc(100%-250px)]">
        {isFetching ? <Skeleton /> : items}
      </Col>
    </Row>
  )
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
