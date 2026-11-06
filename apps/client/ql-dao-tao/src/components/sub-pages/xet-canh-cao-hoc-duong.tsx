import DeleteIcon from "@components/icons/delete"
import { Button, Col, Flex, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { getWarningLevelColor } from "@hooks/getWarningLevelColor"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import type { DisciplinaryWarning, DisciplinaryWarningReason } from "@workspace/db/client"
import {
  useCountDisciplinaryWarning,
  useFindManyDisciplinaryWarning,
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useUpdateDisciplinaryWarning,
  useUpdateStudent,
  useFindManySemester,
} from "@workspace/db/hooks"
import { whereActiveOrganization } from "@workspace/libs/org-tree"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { BookPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { Download } from "lucide-react"
import { saveAs } from "file-saver"
import { docxTemplate } from "../../../src/utils/docx-template"
dayjs.locale("vi")

interface XetCanhCaoHocDuongProps {
  semesterId: string
}

const XetCanhCaoHocDuong = ({ semesterId }: XetCanhCaoHocDuongProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    fixedClassId: "",
    trainingCourseId: "",
    managementOrganizationId: "",
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const where = useMemo(
    () => ({
      semesterId,
      student: {
        userProfile: {
          ...(filters.code && filters.code !== ""
            ? {
                code: {
                  contains: filters.code,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(filters.name && filters.name !== ""
            ? {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
        ...(filters.fixedClassId
          ? {
              fixedClassId: {
                in: Array.isArray(filters.fixedClassId)
                  ? filters.fixedClassId
                  : [filters.fixedClassId],
              },
            }
          : {}),
        fixedClass: {
          ...(filters.trainingCourseId
            ? {
                trainingCourseId: {
                  in: Array.isArray(filters.trainingCourseId)
                    ? filters.trainingCourseId
                    : [filters.trainingCourseId],
                },
              }
            : {}),
          ...(filters.managementOrganizationId
            ? {
                managementOrganizationId: {
                  in: Array.isArray(filters.managementOrganizationId)
                    ? filters.managementOrganizationId
                    : [filters.managementOrganizationId],
                },
              }
            : {}),
          ...(trainingObjectTypeId ? { trainingCourse: { trainingObjectTypeId } } : {}),
        },
      },
    }),
    [
      semesterId,
      trainingObjectTypeId,
      filters.code,
      filters.name,
      filters.fixedClassId,
      filters.trainingCourseId,
      filters.managementOrganizationId,
    ]
  )
  const { data: allSemesters = [] } = useFindManySemester({
    orderBy: { startDate: "asc" },
  })
  const currentSemester = allSemesters.find((s: any) => s.id === semesterId)
  const { data } = useFindManyDisciplinaryWarning(
    {
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            fixedClass: {
              include: {
                trainingCourse: true,
                managementOrganization: true,
              },
            },
            userProfile: true,
          },
        },
        reasonDetails: true,
      },
      orderBy: { createdAt: "desc" },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!semesterId }
  )
  const { data: allData = [] } = useFindManyDisciplinaryWarning(
    {
      where: {
        deletedAt: null,
        ...(trainingObjectTypeId
          ? {
              student: {
                curriculumVersion: {
                  trainingObjectTypeId,
                },
              },
            }
          : {}),
      },
      include: {
        semester: true,
        student: {
          include: {
            fixedClass: true,
            userProfile: true,
          },
        },
        reasonDetails: true,
      },
      orderBy: [{ semester: { startDate: "asc" } }, { createdAt: "asc" }],
    },
    { enabled: !!semesterId }
  )
  const { data: count } = useCountDisciplinaryWarning(
    {
      where: {
        ...where,
        deletedAt: null,
      },
    },
    { enabled: !!semesterId }
  )

  const { onOpen: onOpenPutDisciplinaryWarning } = useDisclosure<{
    id: string
    semesterId: string
  }>({
    tag: "PutDisciplinaryWarning",
  })

  const { mutateAsync: updateDisciplinaryWarning } = useUpdateDisciplinaryWarning()
  const { mutateAsync: updateStudent } = useUpdateStudent()
  async function handleDeleteDisciplinaryWarning({
    id,
    studentId,
    increasedFrom,
    level,
  }: DisciplinaryWarning) {
    try {
      showSpinner()
      await updateDisciplinaryWarning({
        where: { id },
        data: { deletedAt: new Date() },
      })
      await updateStudent({
        where: { id: studentId },
        data: {
          disciplinaryWarningLevel: {
            decrement: level - (increasedFrom || 0),
          },
        },
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    where: {
      trainingObjectTypeId,
      active: true,
      deletedAt: null,
    },
  })

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    orderBy: {
      name: "asc",
    },
  })

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(manageOrgData)
  const handleExportPhuLucII = async () => {
    if (!allData || allData.length === 0) {
      message.warning("Không có dữ liệu để xuất")
      return
    }

    try {
      showSpinner()

      const grouped = allData.reduce(
        (acc, item) => {
          const key = item.semesterId ?? "unknown"
          if (!acc[key]) {
            acc[key] = {
              semesterName: item.semester?.name || key,
              students: [],
            }
          }
          acc[key].students.push(item)
          return acc
        },
        {} as Record<string, { semesterName: string; students: typeof allData }>
      )

      let globalIndex = 0

      const semesters = Object.values(grouped).map((group) => ({
        semesterName: group.semesterName,
        students: group.students.map((item) => ({
          index: ++globalIndex,
          fullname: item.student?.userProfile?.fullname || "",
          birthday: item.student?.userProfile?.dateOfBirth
            ? dayjs(item.student.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "",
          donVi: item.student?.fixedClass?.managementOrganizationId || "",
          className: item.student?.fixedClass?.name || "",
          level: item.level,
        })),
      }))

      const mappedData = {
        semesterInfo: currentSemester?.name,
        reportDate: dayjs().format("DD/MM/YYYY"),
        semesters,
      }

      const exportRes = await docxTemplate({
        fileName: "Phu_luc_II_CCHĐ.docx",
        path: "Phu_luc_II_CCHĐ.docx",
        prefix: "/mta/template",
        data: mappedData as Record<string, unknown>,
      })

      if (exportRes && exportRes.status >= 200 && exportRes.status < 300) {
        saveAs(exportRes.data, "Phu_luc_II_CCHĐ.docx")
      } else {
        message.error(`Xuất file thất bại: Status ${exportRes?.status}`)
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      message.error(`Lỗi xuất file: ${msg}`)
    } finally {
      hideSpinner()
    }
  }
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end" gap={8}>
                <Button type="primary" onClick={handleExportPhuLucII}>
                  <Download />
                  Tải Phụ lục II
                </Button>
                <Button
                  type="primary"
                  onClick={() => onOpenPutDisciplinaryWarning({ id: "", semesterId })}
                >
                  <BookPlus />
                  Thêm học viên
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            data={data}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 120,
                align: "center",
                fixed: "left",
                type: "input",
                render: (__, record) => record?.student?.userProfile?.code,
              },
              {
                title: "Tên sinh viên",
                dataIndex: "name",
                width: 200,
                fixed: "left",
                type: "input",
                render: (__, record) => record?.student?.userProfile?.fullname,
              },
              {
                title: "Ngày sinh",
                width: 120,
                align: "center",
                render: (__, record) => {
                  const date = record?.student?.userProfile?.dateOfBirth
                  return date ? dayjs(date).format("DD/MM/YYYY") : ""
                },
              },
              {
                title: "Lớp niên chế",
                dataIndex: "fixedClassId",
                width: 150,
                align: "center",
                type: "select",
                options: fixedClassData.map((i) => ({
                  value: i.id,
                  label: i.name,
                })),
                render: (__, record) => record?.student?.fixedClass?.name,
              },
              {
                title: "Khoá",
                dataIndex: "trainingCourseId",
                width: 150,
                align: "center",
                type: "select",
                options: trainingCourseData.map((i) => ({
                  value: i.id,
                  label: i.name,
                })),
                render: (__, record) => record?.student?.fixedClass?.trainingCourse?.name,
              },
              {
                title: "Đơn vị quản lý",
                dataIndex: "managementOrganizationId",
                width: 150,
                align: "center",
                type: "tree_select",
                options: treeData,
                render: (__, record) => record?.student?.fixedClass?.managementOrganization?.sTen,
              },
              {
                title: "Mức CCHĐ",
                dataIndex: "level",
                width: 150,
                align: "center",
                fixed: "right",
                render: (value: number) => <Tag color={getWarningLevelColor(value)}>{value}</Tag>,
              },
              {
                title: "Mức CCHĐ trước đó",
                width: 120,
                align: "center",
                fixed: "right",
                render: (record) => (
                  <Tag color={getWarningLevelColor(record?.increasedFrom)}>
                    {record?.increasedFrom || "-"}
                  </Tag>
                ),
              },
              {
                title: "Nguyên do",
                width: 120,
                align: "center",
                fixed: "right",
                render: (record) =>
                  record?.reasonDetails
                    ?.map(
                      ({ name, severityLevel }: DisciplinaryWarningReason) =>
                        `${name} (${severityLevel})`
                    )
                    .join(", "),
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  const { id: studentId } = record
                  return studentId ? (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        onClick={() =>
                          onOpenPutDisciplinaryWarning({
                            id: studentId,
                            semesterId,
                          })
                        }
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () =>
                            handleDeleteDisciplinaryWarning(record as DisciplinaryWarning),
                        }}
                      />
                    </Row>
                  ) : null
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

export default XetCanhCaoHocDuong
