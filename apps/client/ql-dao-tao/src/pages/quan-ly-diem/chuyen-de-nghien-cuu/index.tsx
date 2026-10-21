import { formatDateInSlash, formatThangIn } from "@workspace/libs/timezone"
import { FileOutlined, SearchOutlined } from "@ant-design/icons"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TreeSelect from "@components/commons/tree-select"
import type { FilterProps } from "@constants/type"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import DefaultLayout from "@layouts/default-layout"
import { getSupervisorName } from "@pages/quan-ly-luan-van/dm-luan-van"
import { buildOrgFlat, buildOrgTree } from "@lib/utils"
import { SubjectVersionType } from "@workspace/db"
import { $Enums, type Prisma } from "@workspace/db/client"
import {
  useCountStudentResearchTopic,
  useCreateManyStudentResearchTopic,
  useFindManyDM_DonVi,
  useFindManyStudentResearchTopic,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { renderXlsxTemplate } from "@workspace/libs/api/training"
import { whereOrganization } from "@workspace/libs/constants"
import { previewExcelTemplate } from "../../../utils/excel-template"
import { versionInAcademy, versionToPersonLike } from "@/utils/expert-select"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Col, Flex, Form, Input, Modal, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import ExcelJS from "exceljs"
import { SquarePen } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface ChuyenDeNghienCuuForm {
  trainingCourseId: string
  organizationId: string | string[]
  subjectClassId: string
  reportDate: string
}

export default function ChuyenDeNghienCuu({ role = "P7" }: { role: "P7" | "KHOA_BO_MON" }) {
  const [form] = Form.useForm<ChuyenDeNghienCuuForm>()
  const organizationId = Form.useWatch("organizationId", form)
  const trainingCourseId = Form.useWatch("trainingCourseId", form)
  const subjectClassId = Form.useWatch("subjectClassId", form)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(20)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
  })

  const { onOpen: openPutResearchTopicModal } = useDisclosure<{
    studentResearchTopicId: string
    role: "P7" | "KHOA_BO_MON"
  }>({
    tag: "PutResearchTopicModal",
  })

  const { onOpen: openXemTaiLieu } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: {
      trainingObjectTypeId: trainingObjectTypeId,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: organizationData = [] } = useFindManyDM_DonVi({
    where: {
      ...whereOrganization,
    },
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const contextOrgId = window.contextData?.organizationId
  const { organizationId: lecturerOrgId } = useLecturerHienTai()
  const orgIds = useMemo(() => {
    const orgList = organizationData.map((e) => ({
      Id: e.Id,
      sTen: null as string | null,
      sParentId: e.sParentId,
      sMa: null as string | null,
    }))
    const roots = [
      ...new Set(
        [contextOrgId, lecturerOrgId]
          .map((id) => id?.trim())
          .filter((id): id is string => Boolean(id))
      ),
    ]
    return [
      ...new Set(
        roots.flatMap((rootId) => [
          ...buildOrgFlat(orgList, rootId).map((org) => org.value),
          rootId,
        ])
      ),
    ]
  }, [organizationData, contextOrgId, lecturerOrgId])

  const { data: subjectClassData = [] } = useFindManySubjectClass({
    where: {
      subject: {
        type: SubjectVersionType.Research,
        studentSubjectScore: {
          some: {
            student: {
              fixedClass: {
                trainingCourseId,
              },
            },
          },
        },
      },
      semesterId,
      trainingObjectTypeId,
    },
    orderBy: [{ semester: { startDate: "asc" } }, { startDate: "asc" }, { code: "asc" }],
  })
  const where = useMemo(() => {
    const subjectFilter: Prisma.SubjectVersionWhereInput = {
      type: SubjectVersionType.Research,
    }
    if (role === "KHOA_BO_MON") {
      subjectFilter.managementOrganizationId = { in: orgIds }
    } else if (organizationId) {
      subjectFilter.managementOrganizationId = Array.isArray(organizationId)
        ? { in: organizationId }
        : organizationId
    }

    const filter: Prisma.StudentResearchTopicWhereInput = {
      studentSubjectScore: {
        subjectClass: {
          subject: subjectFilter,
          trainingObjectTypeId,
          semesterId,
          cancelled: false,
          active: true,
          ...(subjectClassId ? { id: subjectClassId } : {}),
        },
        student: {
          fixedClass: {
            trainingCourseId: trainingCourseId || undefined,
          },
          active: true,
          deletedAt: null,
          ...(filters.name
            ? {
                userProfile: {
                  fullname: {
                    contains: filters.name,
                    mode: "insensitive" as const,
                  },
                },
              }
            : {}),
        },
      },
      deletedAt: null,
    }

    return {
      ...filter,
      deletedAt: null,
    }
  }, [
    organizationId,
    trainingCourseId,
    subjectClassId,
    trainingObjectTypeId,
    semesterId,
    orgIds,
    role,
    filters,
  ])

  useEffect(() => {
    if (role !== "KHOA_BO_MON") return
    form.setFieldValue("organizationId", orgIds.length === 1 ? orgIds[0] : orgIds)
  }, [role, orgIds, form])

  const { data: studentResearchTopicData = [], refetch: refetchStudentResearchTopic } =
    useFindManyStudentResearchTopic({
      where,
      include: {
        supervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
            expert: {
              include: {
                lecturer: {
                  select: {
                    userProfile: {
                      select: {
                        fullname: true,
                        academicRankType: true,
                        academicDegreeType: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        coSupervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
            expert: {
              include: {
                lecturer: {
                  select: {
                    userProfile: {
                      select: {
                        fullname: true,
                        academicRankType: true,
                        academicDegreeType: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        studentSubjectScore: {
          include: {
            subjectClass: {
              include: {
                trainingObjectType: true,
                semester: true,
              },
            },
            student: {
              include: {
                userProfile: true,
                fixedClass: {
                  include: {
                    trainingCourse: true,
                  },
                },
                curriculumVersion: {
                  select: {
                    curriculum: {
                      select: {
                        trainingMajor: {
                          select: {
                            name: true,
                            code: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            subjectVersion: {
              include: {
                managementOrganization: true,
                subject: {
                  include: {
                    managementOrganization: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          studentSubjectScore: {
            subjectClass: {
              semester: {
                startDate: "asc",
              },
            },
          },
        },
        {
          studentSubjectScore: {
            subjectClass: {
              startDate: "asc",
            },
          },
        },
        {
          studentSubjectScore: {
            student: {
              userProfile: {
                firstName: "asc",
              },
            },
          },
        },
        {
          studentSubjectScore: {
            student: {
              userProfile: {
                lastName: "asc",
              },
            },
          },
        },
        {
          studentSubjectScore: {
            student: {
              userProfile: {
                code: "asc",
              },
            },
          },
        },
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    })

  const { data: count, refetch: refetchCount } = useCountStudentResearchTopic({
    where,
  })

  const { mutateAsync: createManyStudentResearchTopic } = useCreateManyStudentResearchTopic()

  const handleAssignDate = async () => {
    const reportDate = form.getFieldValue("reportDate")
    if (!reportDate) {
      return message.warning("Vui lòng chọn hạn nhập chuyên đề trước khi gán!")
    }

    const res = await sqlTransaction([
      {
        model: "StudentResearchTopic",
        operation: "updateMany",
        data: {
          where,
          data: {
            deadline: reportDate,
          },
        },
      },
    ])
    if (res.status !== 200) {
      return message.error("Có lỗi xảy ra khi gán ngày.")
    }
    message.success("Gán ngày thành công!")
    refetchStudentResearchTopic()
    refetchCount()
  }

  const treeOrgData = buildOrgTree(organizationData ?? [], "0")
  const getData = async () => {
    if (!subjectClassId) {
      return message.warning("Vui lòng chọn lớp môn học trước khi lấy dữ liệu")
    }
    try {
      const subjectStudent = await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "findMany",
          data: {
            where: {
              subjectClassId,
              student: {
                active: true,
                deletedAt: null,
                ...(trainingCourseId ? { fixedClass: { trainingCourseId } } : {}),
              },
            },
          },
        },
      ])
      if (subjectStudent.status !== 200) {
        return message.error("Không thể lấy danh sách sinh viên")
      }
      const studentSubjectScoreData = subjectStudent
        .data[0] as Prisma.StudentSubjectScoreGetPayload<{}>[]
      if (studentSubjectScoreData.length === 0) {
        return message.error("Lớp môn học này không có sinh viên thuộc khóa đã chọn.")
      }
      const scoreIds = studentSubjectScoreData.map((record) => record.id)
      await createManyStudentResearchTopic({
        data: scoreIds.map((studentSubjectScoreId) => ({
          studentSubjectScoreId,
        })),
        skipDuplicates: true,
      })
      // Khôi phục bản ghi đã soft-delete (skipDuplicates không tạo lại)
      await sqlTransaction([
        {
          model: "StudentResearchTopic",
          operation: "updateMany",
          data: {
            where: {
              studentSubjectScoreId: { in: scoreIds },
              deletedAt: { not: null },
            },
            data: {
              deletedAt: null,
              active: true,
            },
          },
        },
      ])
      message.success("Lấy dữ liệu thành công!")
    } catch (error) {
      console.error("getData Error:", error)
      message.error("Có lỗi xảy ra khi xử lý dữ liệu.")
    } finally {
      refetchStudentResearchTopic()
      refetchCount()
    }
  }

  const getCellValue = (cell: ExcelJS.Cell) => {
    const val = cell.value

    if (val === null || val === undefined) return null

    if (typeof val === "object" && "result" in val) {
      const result = val.result
      if (result === null || result === undefined || result === "") return null
      return result.toString().trim()
    }

    const strVal = val.toString().trim()
    return strVal !== "" ? strVal : null
  }
  const importExcel = async (file: File) => {
    const loading = message.loading("Đang xử lý file Excel...", 0)
    try {
      const workbook = new ExcelJS.Workbook()
      const buffer = await file.arrayBuffer()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.getWorksheet("Danh sách chuyên đề")
      if (!worksheet) {
        return message.error('Không tìm thấy Sheet "Danh sách chuyên đề" trong file!')
      }

      const dataToUpdate: any[] = []

      let startRow = 1
      worksheet.eachRow((row, rowNumber) => {
        if (row.getCell(1).value === "ID_RECORD") {
          startRow = rowNumber + 1
        }
      })

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return

        const studentSubjectScoreId = getCellValue(row.getCell(1))
        if (!studentSubjectScoreId) return

        const supervisorId = getCellValue(row.getCell(14))
        const coSupervisorId = getCellValue(row.getCell(15))

        const name = getCellValue(row.getCell(10))
        const mainContent = getCellValue(row.getCell(11))

        const deadlineVal = row.getCell(2).value
        const reportDateVal = row.getCell(16).value

        const deadline = deadlineVal instanceof Date ? deadlineVal.toISOString() : null
        const reportDate = reportDateVal instanceof Date ? reportDateVal.toISOString() : null

        dataToUpdate.push({
          model: "StudentResearchTopic",
          operation: "upsert",
          data: {
            where: { studentSubjectScoreId: studentSubjectScoreId },
            update: {
              name,
              mainContent,
              supervisorId,
              coSupervisorId,
              deadline,
              reportDate,
            },
            create: {
              studentSubjectScoreId,
              name,
              mainContent,
              supervisorId,
              coSupervisorId,
              deadline,
              reportDate,
            },
          },
        })
      })

      if (dataToUpdate.length === 0) {
        return message.warning("Không tìm thấy dữ liệu hợp lệ trong file.")
      }
      const fixValue = (val: any) => (val === "[object Object]" ? null : val)
      const expertIds = [
        ...new Set(
          dataToUpdate
            .flatMap((item) => [
              fixValue(item.data.update.supervisorId),
              fixValue(item.data.update.coSupervisorId),
            ])
            .filter((id): id is string => !!id)
        ),
      ]

      const versionByExpertId = new Map<string, string>()
      if (expertIds.length) {
        const expertsRes = await sqlTransaction([
          {
            model: "Expert",
            operation: "findMany",
            data: {
              where: { id: { in: expertIds }, deletedAt: null },
              select: { id: true, currentVersionId: true },
            },
          },
        ])
        const expertRows = Array.isArray(expertsRes.data) ? expertsRes.data[0] : []
        const experts = (Array.isArray(expertRows) ? expertRows : []) as Array<{
          id: string
          currentVersionId: string | null
        }>
        for (const e of experts) {
          if (e.currentVersionId) versionByExpertId.set(e.id, e.currentVersionId)
        }
      }

      const toVersionId = (expertId: any) => {
        const id = fixValue(expertId)
        if (!id) return null
        return versionByExpertId.get(id) ?? null
      }

      const finalData = dataToUpdate.map((item) => {
        const supervisorVersionId = toVersionId(item.data.update.supervisorId)
        const coSupervisorVersionId = toVersionId(item.data.update.coSupervisorId)
        const { supervisorId: _s, coSupervisorId: _c, ...updateRest } = item.data.update
        const { supervisorId: _s2, coSupervisorId: _c2, ...createRest } = item.data.create

        return {
          ...item,
          data: {
            ...item.data,
            update: {
              ...updateRest,
              supervisorVersionId,
              coSupervisorVersionId,
            },
            create: {
              ...createRest,
              supervisorVersionId,
              coSupervisorVersionId,
            },
          },
        }
      })

      const res = await sqlTransaction(finalData)

      message.success(`Cập nhật thành công ${finalData.length} bản ghi!`)
      refetchStudentResearchTopic()
    } catch (error) {
      console.error("Import Excel Error:", error)
      message.error("Lỗi khi đọc file hoặc cập nhật dữ liệu. Vui lòng kiểm tra lại định dạng file!")
    } finally {
      loading()
    }
  }
  const confirmImport = (file: File) => {
    Modal.confirm({
      title: "Xác nhận Import dữ liệu",
      icon: <FileOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn import thông tin từ file sau không?</p>
          <p>
            <strong>Tên file:</strong> <span className="text-blue-600">{file.name}</span>
          </p>
          <p className="text-red-500 text-xs">
            * Lưu ý: Dữ liệu trong hệ thống sẽ được cập nhật hoặc tạo mới dựa trên nội dung file
            Excel.
          </p>
        </div>
      ),
      okText: "Xác nhận Import",
      cancelText: "Hủy bỏ",
      okButtonProps: {
        type: "primary",
        className: "bg-[#02884f] hover:bg-[#19945d] border-none",
      },
      onOk: () => {
        importExcel(file)
      },
    })
  }

  return (
    <Row gutter={[8, 8]}>
      <Col span={24}>
        <Form form={form}>
          <Flex vertical gap={8}>
            <Flex gap={6} wrap="wrap" align="center">
              <Form.Item name="trainingCourseId" label="Khoá học" className="mb-0">
                <Select
                  className="w-36"
                  options={
                    trainingCourseData?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) || []
                  }
                  popupMatchSelectWidth={false}
                  placeholder="Chọn khoá học"
                />
              </Form.Item>
              <Form.Item name="organizationId" label="Khoa quản lí" className="mb-0">
                <TreeSelect
                  className="w-80"
                  placeholder="Chọn khoa quản lý"
                  allowClear={role !== "KHOA_BO_MON"}
                  disabled={role === "KHOA_BO_MON"}
                  multiple={role === "KHOA_BO_MON"}
                  maxTagCount="responsive"
                  showSearch
                  treeDefaultExpandAll
                  treeData={treeOrgData}
                />
              </Form.Item>

              <Form.Item name="subjectClassId" label="Lớp môn học" className="mb-0">
                <Select
                  className="w-46"
                  options={subjectClassData?.map((item) => ({
                    label: `${item.code} - ${item.name}`,
                    value: item.id,
                  }))}
                  popupMatchSelectWidth={false}
                  placeholder="Chọn lớp môn học"
                />
              </Form.Item>
              <Form.Item className="mb-0">
                <Button type="primary" onClick={async () => await getData()}>
                  Lấy dữ liệu
                </Button>
              </Form.Item>
            </Flex>
            {role === "P7" && (
              <Flex gap={6} wrap="wrap" align="center">
                <Form.Item name="reportDate" label="Hạn nhập chuyên đề" className="mb-0">
                  <DatePicker className="w-44" placeholder="Chọn hạn nhập chuyên đề" />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Button type="primary" onClick={handleAssignDate}>
                    Gán ngày
                  </Button>
                </Form.Item>
                <Form.Item className="mb-0">
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      icon={<FileOutlined />}
                      onClick={async () => {
                        if (!trainingCourseId) {
                          return message.warning("Vui lòng chọn khoá học trước khi xuất phụ lục!")
                        }

                        if (!semesterId) {
                          return message.warning("Vui lòng chọn kỳ học trước khi xuất phụ lục!")
                        }
                        const khoaVaKy = await sqlTransaction([
                          {
                            model: "TrainingCourse",
                            operation: "findUnique",
                            data: {
                              where: { id: trainingCourseId },
                              select: {
                                name: true,
                              },
                            },
                          },
                          {
                            model: "Semester",
                            operation: "findUnique",
                            data: {
                              where: { id: semesterId },
                              select: {
                                name: true,
                              },
                            },
                          },
                        ])
                        const khoaVaKyData = khoaVaKy.data as [{ name: string }, { name: string }]

                        const res = await previewExcelTemplate({
                          previewKey: `cdnc-qd-giao-${trainingCourseId}-${semesterId}`,
                          fileName: "QD_GiaoChuyenDe.xlsx",
                          path: "QD_GiaoChuyenDe.xlsx",
                          showGridLines: true,
                          wrapText: true,
                          prefix: "mta/luan-van",
                          payload: [
                            {
                              data: {
                                khoa: khoaVaKyData?.[0]?.name?.firstCase?.(),
                                hoc_ky: khoaVaKyData?.[1]?.name?.toLowerCase?.(),
                                so_hv: studentResearchTopicData.length,
                                so_hv_chu: studentResearchTopicData.length.toVndWord("", false),
                              },
                            },
                          ],
                        })
                        openXemTaiLieu({
                          uri: res.data.path,
                          name: "QD_GiaoChuyenDe.xlsx",
                          mimeType: "xlsx",
                        })
                      }}
                    >
                      QĐ giao chuyên đề nghiên cứu
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileOutlined />}
                      onClick={async () => {
                        if (!trainingCourseId) {
                          return message.warning("Vui lòng chọn khoá học trước khi xuất phụ lục!")
                        }

                        if (!semesterId) {
                          return message.warning("Vui lòng chọn kỳ học trước khi xuất phụ lục!")
                        }

                        let globalIndex = 0

                        const khoaVaKy = await sqlTransaction([
                          {
                            model: "TrainingCourse",
                            operation: "findUnique",
                            data: {
                              where: { id: trainingCourseId },
                              select: {
                                name: true,
                              },
                            },
                          },
                          {
                            model: "Semester",
                            operation: "findUnique",
                            data: {
                              where: { id: semesterId },
                              select: {
                                name: true,
                              },
                            },
                          },
                        ])
                        const khoaVaKyData = khoaVaKy.data as [{ name: string }, { name: string }]

                        // Count research topics per student
                        const researchTopicCountByStudent = studentResearchTopicData.reduce(
                          (acc, e) => {
                            const studentCode = e.studentSubjectScore.student?.userProfile?.code
                            if (studentCode) {
                              acc[studentCode] = (acc[studentCode] || 0) + 1
                            }
                            return acc
                          },
                          {} as Record<string, number>
                        )

                        const payload = Object.values(
                          studentResearchTopicData.reduce(
                            (acc, e) => {
                              const ma_cn =
                                e.studentSubjectScore.student?.curriculumVersion?.curriculum
                                  ?.trainingMajor?.code
                              if (!ma_cn) return acc

                              if (!acc[ma_cn]) {
                                acc[ma_cn] = {
                                  ma_cn,
                                  chuyen_nganh:
                                    e.studentSubjectScore.student?.curriculumVersion?.curriculum
                                      ?.trainingMajor?.name,
                                  students: [],
                                }
                              }

                              globalIndex++
                              const studentCode = e.studentSubjectScore.student?.userProfile?.code
                              const supervisorName =
                                (getSupervisorName(
                                  versionToPersonLike(e.supervisor),
                                  false,
                                  true
                                ) as string) || ""
                              const coSupervisorName =
                                (getSupervisorName(
                                  versionToPersonLike(e.coSupervisor),
                                  false,
                                  true
                                ) as string) || ""
                              acc[ma_cn].students.push({
                                tt: globalIndex,
                                ten: `${e.studentSubjectScore.student?.userProfile?.fullname}\n${
                                  e.studentSubjectScore.student?.userProfile?.dateOfBirth
                                    ? formatDateInSlash(
                                        e.studentSubjectScore.student?.userProfile?.dateOfBirth
                                      )
                                    : ""
                                }`.trim(),
                                cbhd:
                                  supervisorName && coSupervisorName
                                    ? [`1.${supervisorName}`, `2.${coSupervisorName}`].join("\n")
                                    : supervisorName || coSupervisorName || "",
                                ten_cd: e.name,
                                macd: e.studentSubjectScore.subjectVersion?.code,
                                stc: e.studentSubjectScore.subjectVersion?.credit,
                                ndcd: e.mainContent,
                                so_cd: studentCode ? researchTopicCountByStudent[studentCode] : 0,
                              })

                              return acc
                            },
                            {} as Record<
                              string,
                              {
                                ma_cn: string
                                chuyen_nganh?: string
                                students: {
                                  tt: number
                                  ten?: string | null
                                  cbhd: string
                                  ten_cd?: string | null
                                  macd?: string | null
                                  stc: number | null
                                  ndcd?: string | null
                                  so_cd: number
                                }[]
                              }
                            >
                          )
                        )
                        const res = await previewExcelTemplate({
                          previewKey: `cdnc-phu-luc-${trainingCourseId}-${semesterId}`,
                          fileName: "Phu-luc-QD-Chuyen-De-Nghien-Cuu.xlsx",
                          head: {
                            data: {
                              khoa: khoaVaKyData?.[0]?.name?.toUpperCase(),
                              hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase(),
                            },
                          },
                          tail: {
                            data: {
                              so_hv: payload.flatMap((item) => item.students).length,
                              so_cd: payload.flatMap((item) => item.students).length,
                            },
                          },
                          path: "PL_ChuyenDeNghienCuu.xlsx",
                          showGridLines: true,
                          wrapText: true,
                          prefix: "mta/luan-van",
                          payload: payload.map((item, idx) => ({
                            data: {
                              chuyen_nganh: `       ${(idx + 1).toRoman()}. ${item.chuyen_nganh}: ${item.students.length} học viên.`,
                              data: item.students.map((student) => ({
                                tt: student.tt,
                                ten: student.ten,
                                cbhd: student.cbhd,
                                ten_cd: student.ten_cd,
                                macd: student.macd,
                                stc: student.stc,
                                ndcd: student.ndcd,
                              })),
                            },
                            mergeCells: item.students.map((s, idx, arr) => {
                              const startRow =
                                2 +
                                arr.slice(0, idx).reduce((sum, student) => sum + student.so_cd, 0)
                              const endRow = startRow + s.so_cd - 1
                              return `B${startRow}:B${endRow}`
                            }),
                          })),
                        })
                        openXemTaiLieu({
                          uri: res.data.path,
                          name: "Phu-luc-QD-Chuyen-De-Nghien-Cuu.xlsx",
                          mimeType: "xlsx",
                        })
                      }}
                    >
                      Phụ lục QĐ chuyên đề nghiên cứu
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileOutlined />}
                      onClick={async () => {
                        if (!trainingCourseId) {
                          return message.warning("Vui lòng chọn khoá học trước khi xuất phụ lục!")
                        }

                        if (!semesterId) {
                          return message.warning("Vui lòng chọn kỳ học trước khi xuất phụ lục!")
                        }

                        const khoaVaKy = await sqlTransaction([
                          {
                            model: "TrainingCourse",
                            operation: "findUnique",
                            data: {
                              where: { id: trainingCourseId },
                              select: {
                                name: true,
                              },
                            },
                          },
                          {
                            model: "Semester",
                            operation: "findUnique",
                            data: {
                              where: { id: semesterId },
                              select: {
                                name: true,
                              },
                            },
                          },
                        ])
                        const khoaVaKyData = khoaVaKy.data as [{ name: string }, { name: string }]

                        const topicScoreFilter = {
                          subjectClass: {
                            semesterId,
                            trainingObjectTypeId,
                          },
                          student: {
                            fixedClass: {
                              trainingCourseId,
                            },
                          },
                        }

                        const expertProfiles = await sqlTransaction([
                          {
                            model: "Expert",
                            operation: "findMany",
                            data: {
                              where: {
                                deletedAt: null,
                                OR: [
                                  {
                                    versions: {
                                      some: {
                                        supervisorResearchTopic: {
                                          some: { studentSubjectScore: topicScoreFilter },
                                        },
                                      },
                                    },
                                  },
                                  {
                                    versions: {
                                      some: {
                                        coSupervisorResearchTopic: {
                                          some: { studentSubjectScore: topicScoreFilter },
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                              include: {
                                currentVersion: {
                                  include: {
                                    academicDegreeType: true,
                                    academicRankType: true,
                                  },
                                },
                                lecturer: {
                                  select: {
                                    userProfile: {
                                      select: {
                                        fullname: true,
                                        academicRankType: { select: { sMa: true } },
                                        academicDegreeType: { select: { sMa: true } },
                                      },
                                    },
                                  },
                                },
                                versions: {
                                  include: {
                                    supervisorResearchTopic: {
                                      where: { studentSubjectScore: topicScoreFilter },
                                      select: {
                                        id: true,
                                        coSupervisorVersionId: true,
                                        studentSubjectScore: {
                                          select: {
                                            subjectVersion: { select: { credit: true } },
                                          },
                                        },
                                      },
                                    },
                                    coSupervisorResearchTopic: {
                                      where: { studentSubjectScore: topicScoreFilter },
                                      select: {
                                        id: true,
                                        supervisorVersionId: true,
                                        studentSubjectScore: {
                                          select: {
                                            subjectVersion: { select: { credit: true } },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        ])

                        if (expertProfiles.status !== 200) {
                          return message.error("Không thể lấy danh sách chuyên gia")
                        }

                        type ExpertStatRow = {
                          id: string
                          lecturerId: string | null
                          currentVersion: {
                            inAcademy?: boolean | null
                            name?: string | null
                            academicDegreeType?: { sMa?: string | null } | null
                            academicRankType?: { sMa?: string | null } | null
                          } | null
                          lecturer?: {
                            userProfile?: {
                              fullname?: string | null
                              academicRankType?: { sMa?: string | null } | null
                              academicDegreeType?: { sMa?: string | null } | null
                            } | null
                          } | null
                          versions: Array<{
                            supervisorResearchTopic: Array<{
                              id: string
                              coSupervisorVersionId: string | null
                              studentSubjectScore: { subjectVersion: { credit: number } }
                            }>
                            coSupervisorResearchTopic: Array<{
                              id: string
                              supervisorVersionId: string | null
                              studentSubjectScore: { subjectVersion: { credit: number } }
                            }>
                          }>
                        }

                        const expertProfilesData = (expertProfiles.data[0] || []) as ExpertStatRow[]

                        const flattenTopics = (profile: ExpertStatRow) => ({
                          supervisorResearchTopic: profile.versions.flatMap(
                            (v) => v.supervisorResearchTopic
                          ),
                          coSupervisorResearchTopic: profile.versions.flatMap(
                            (v) => v.coSupervisorResearchTopic
                          ),
                        })

                        const inAcademyExperts = expertProfilesData.filter(
                          (profile) =>
                            profile.currentVersion?.inAcademy ?? profile.lecturerId != null
                        )
                        const outAcademyExperts = expertProfilesData.filter(
                          (profile) =>
                            !(profile.currentVersion?.inAcademy ?? profile.lecturerId != null)
                        )

                        const mapExpertRows = (profiles: ExpertStatRow[]) =>
                          profiles.map((profile, idx) => {
                            const topics = flattenTopics(profile)
                            const person = {
                              ...profile.currentVersion,
                              lecturer: profile.lecturer,
                              lecturerId: profile.lecturerId,
                              inAcademy:
                                profile.currentVersion?.inAcademy ?? profile.lecturerId != null,
                            }
                            return {
                              tt: idx + 1,
                              ho_ten: (getSupervisorName(person, false, true) as string) || "",
                              cd_dl:
                                topics.supervisorResearchTopic.filter(
                                  (t) => !t.coSupervisorVersionId
                                ).length +
                                topics.coSupervisorResearchTopic.filter(
                                  (t) => !t.supervisorVersionId
                                ).length,
                              tc_dl:
                                topics.supervisorResearchTopic
                                  .filter((t) => !t.coSupervisorVersionId)
                                  .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                  .reduce((a, b) => a + b, 0) +
                                topics.coSupervisorResearchTopic
                                  .filter((t) => !t.supervisorVersionId)
                                  .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                  .reduce((a, b) => a + b, 0),
                              cd_dhd:
                                topics.coSupervisorResearchTopic.filter(
                                  (t) => !!t.supervisorVersionId
                                ).length +
                                topics.supervisorResearchTopic.filter(
                                  (t) => !!t.coSupervisorVersionId
                                ).length,
                              tc_dhd:
                                topics.coSupervisorResearchTopic
                                  .filter((t) => !!t.supervisorVersionId)
                                  .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                  .reduce((a, b) => a + b, 0) +
                                topics.supervisorResearchTopic
                                  .filter((t) => !!t.coSupervisorVersionId)
                                  .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                  .reduce((a, b) => a + b, 0),
                              cd_tong: `=E${9 + idx}+C${9 + idx}`,
                              tai_tong: `=D${9 + idx}*H${9 + idx}+(F${9 + idx}*H${9 + idx}/2)`,
                              dinh_muc: 3.75,
                              ghi_chu: "",
                            }
                          })

                        const sheetHeaderData = {
                          khoa: khoaVaKyData?.[0]?.name?.toUpperCase?.(),
                          hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase?.(),
                        }

                        const res = await previewExcelTemplate({
                          previewKey: `cdnc-tk-tai-giang-${trainingCourseId}-${semesterId}`,
                          fileName: "TK_TaiGiangDayCuaGiangVien.xlsx",
                          path: "TK_TaiGiangDayCuaGiangVien.xlsx",
                          showGridLines: true,
                          wrapText: true,
                          prefix: "mta/luan-van",
                          sheets: [
                            {
                              sheetName: "Chuyên gia trong HV",
                              payload: [
                                {
                                  data: {
                                    ...sheetHeaderData,
                                    data: mapExpertRows(inAcademyExperts),
                                  },
                                },
                              ],
                            },
                            {
                              sheetName: "Chuyên gia ngoài HV",
                              payload: [
                                {
                                  data: {
                                    ...sheetHeaderData,
                                    data: mapExpertRows(outAcademyExperts),
                                  },
                                },
                              ],
                            },
                          ],
                        })
                        openXemTaiLieu({
                          uri: res.data.path,
                          name: "TK_TaiGiangDayCuaGiangVien.xlsx",
                          mimeType: "xlsx",
                        })
                      }}
                    >
                      TK tải giảng GV
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileOutlined />}
                      onClick={async () => {
                        if (!trainingCourseId) {
                          return message.warning("Vui lòng chọn khoá học trước khi xuất phụ lục!")
                        }

                        if (!semesterId) {
                          return message.warning("Vui lòng chọn kỳ học trước khi xuất phụ lục!")
                        }

                        const khoaVaKy = await sqlTransaction([
                          {
                            model: "TrainingCourse",
                            operation: "findUnique",
                            data: {
                              where: { id: trainingCourseId },
                              select: {
                                name: true,
                              },
                            },
                          },
                          {
                            model: "Semester",
                            operation: "findUnique",
                            data: {
                              where: { id: semesterId },
                              select: {
                                name: true,
                              },
                            },
                          },
                        ])
                        const khoaVaKyData = khoaVaKy.data as [{ name: string }, { name: string }]

                        const students = await sqlTransaction([
                          {
                            model: "Student",
                            operation: "findMany",
                            data: {
                              where: {
                                subjectClassStudent: {
                                  some: {
                                    subjectClass: {
                                      semesterId,
                                      trainingObjectTypeId,
                                      fixedClasses: {
                                        some: {
                                          trainingCourseId,
                                        },
                                      },
                                      subject: {
                                        type: $Enums.SubjectVersionType.Research,
                                      },
                                    },
                                  },
                                },
                              },
                              include: {
                                subjectClassStudent: {
                                  select: {
                                    subjectClass: {
                                      select: {
                                        subject: {
                                          select: {
                                            credit: true,
                                          },
                                        },
                                      },
                                    },
                                  },
                                  where: {
                                    subjectClass: {
                                      semesterId,
                                      trainingObjectTypeId,
                                      fixedClasses: {
                                        some: {
                                          trainingCourseId,
                                        },
                                      },
                                      subject: {
                                        type: $Enums.SubjectVersionType.Research,
                                      },
                                    },
                                  },
                                },
                                curriculumVersion: {
                                  select: {
                                    curriculum: {
                                      select: {
                                        trainingMajor: {
                                          select: {
                                            name: true,
                                            trainingField: {
                                              select: {
                                                name: true,
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                userProfile: {
                                  select: {
                                    dateOfBirth: true,
                                    fullname: true,
                                  },
                                },
                              },
                            },
                          },
                        ])

                        if (students.status !== 200) {
                          return message.error("Không thể lấy danh sách sinh viên")
                        }

                        const studentsData = students.data[0] as Prisma.StudentGetPayload<{
                          include: {
                            subjectClassStudent: {
                              select: {
                                subjectClass: {
                                  select: {
                                    subject: {
                                      select: {
                                        credit: true
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            curriculumVersion: {
                              select: {
                                curriculum: {
                                  select: {
                                    trainingMajor: {
                                      select: {
                                        name: true
                                        trainingField: {
                                          select: {
                                            name: true
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            userProfile: {
                              select: {
                                dateOfBirth: true
                                fullname: true
                              }
                            }
                          }
                        }>[]

                        const res = await previewExcelTemplate({
                          previewKey: `cdnc-tk-so-luong-${trainingCourseId}-${semesterId}`,
                          fileName: "TK_SoLuongChuyenDeHocVien.xlsx",
                          path: "TK_SoLuongChuyenDeHocVien.xlsx",
                          showGridLines: true,
                          wrapText: true,
                          prefix: "mta/luan-van",
                          payload: [
                            {
                              data: {
                                khoa: khoaVaKyData?.[0]?.name?.toUpperCase?.(),
                                hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase?.(),
                                data: studentsData.map((profile, idx) => {
                                  return {
                                    tt: idx + 1,
                                    ten: profile?.userProfile?.fullname,
                                    ngay_sinh: profile?.userProfile?.dateOfBirth
                                      ? formatDateInSlash(profile?.userProfile?.dateOfBirth)
                                      : "",
                                    nganh_chuyen_nganh: `${
                                      profile?.curriculumVersion?.curriculum.trainingMajor
                                        ?.trainingField?.name
                                    } (${
                                      profile?.curriculumVersion?.curriculum.trainingMajor?.name
                                    })`,
                                    so_cd: profile.subjectClassStudent.length,
                                    tong_tc: profile?.subjectClassStudent?.reduce(
                                      (a, b) => a + (b?.subjectClass?.subject?.credit || 0),
                                      0
                                    ),
                                  }
                                }),
                              },
                            },
                          ],
                        })
                        openXemTaiLieu({
                          uri: res.data.path,
                          name: "TK_SoLuongChuyenDeHocVien.xlsx",
                          mimeType: "xlsx",
                        })
                      }}
                    >
                      TK Số lượng CĐ HV
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileOutlined />}
                      onClick={async () => {
                        if (!trainingCourseId) {
                          return message.warning(
                            "Vui lòng chọn khoá học trước khi xuất thanh toán!"
                          )
                        }

                        if (!semesterId) {
                          return message.warning("Vui lòng chọn kỳ học trước khi xuất thanh toán!")
                        }

                        interface SupervisorPayAmountRecord {
                          role: string
                          inAcademy: boolean
                          amount?: number | string | null
                        }

                        interface ResearchTopicRecord {
                          code?: string | null
                          reportDate?: Date | string | null
                          decisionNumber?: string | null
                          decisionDate?: Date | string | null
                        }

                        const khoaVaKy = await sqlTransaction([
                          {
                            model: "TrainingCourse",
                            operation: "findUnique",
                            data: {
                              where: { id: trainingCourseId },
                              select: { name: true },
                            },
                          },
                          {
                            model: "Semester",
                            operation: "findUnique",
                            data: {
                              where: { id: semesterId },
                              select: { name: true },
                            },
                          },
                          {
                            model: "DefaultSupervisorPayAmount",
                            operation: "findMany",
                            data: {},
                          },
                          {
                            model: "ThesisSession",
                            operation: "findFirst",
                            data: {
                              where: {
                                trainingCourses: {
                                  some: { id: trainingCourseId },
                                },
                                deletedAt: null,
                              },
                              select: { chief: true },
                              orderBy: { createdAt: "desc" },
                            },
                          },
                        ])
                        const khoaVaKyData = khoaVaKy.data as [
                          { name: string },
                          { name: string },
                          SupervisorPayAmountRecord[],
                          { chief?: string } | null,
                        ]
                        const khoaName = khoaVaKyData?.[0]?.name || ""
                        const kyName = khoaVaKyData?.[1]?.name || ""
                        const payAmounts = khoaVaKyData?.[2] || []
                        const chiefName = khoaVaKyData?.[3]?.chief || "Lê Quốc Long"

                        const getPayAmount = (role: string, inAcademy: boolean) => {
                          const found = payAmounts.find(
                            (item: SupervisorPayAmountRecord) =>
                              item.role === role && item.inAcademy === inAcademy
                          )
                          if (found && found.amount) return Number(found.amount)
                          if (role === "SINGLE" || role === "PRIMARY_SUPERVISOR") return 250000
                          return 225000
                        }

                        let totalAmount = 0
                        const tableRows = studentResearchTopicData.map((e, idx) => {
                          const studentName =
                            e.studentSubjectScore.student?.userProfile?.fullname || ""
                          const studentCourse =
                            e.studentSubjectScore.student?.fixedClass?.trainingCourse?.name ||
                            khoaName

                          const supName =
                            (getSupervisorName(
                              versionToPersonLike(e.supervisor),
                              false,
                              true
                            ) as string) || ""
                          const coSupName =
                            (getSupervisorName(
                              versionToPersonLike(e.coSupervisor),
                              false,
                              true
                            ) as string) || ""

                          const isDual = !!(supName && coSupName)
                          const supInAcademy = versionInAcademy(e.supervisor)
                          const coSupInAcademy = versionInAcademy(e.coSupervisor)

                          let cbhdText = ""
                          let moneyText = ""

                          if (isDual) {
                            cbhdText = `1. ${supName}\n2. ${coSupName}`
                            const supAmt = getPayAmount("PRIMARY_SUPERVISOR", supInAcademy)
                            const coSupAmt = getPayAmount("CO_SUPERVISOR", coSupInAcademy)
                            totalAmount += supAmt + coSupAmt
                            moneyText = `${supAmt.toLocaleString("en-US")}\n${coSupAmt.toLocaleString("en-US")}`
                          } else if (supName) {
                            cbhdText = `1. ${supName}`
                            const supAmt = getPayAmount("SINGLE", supInAcademy)
                            totalAmount += supAmt
                            moneyText = `${supAmt.toLocaleString("en-US")}`
                          } else if (coSupName) {
                            cbhdText = `1. ${coSupName}`
                            const coSupAmt = getPayAmount("SINGLE", coSupInAcademy)
                            totalAmount += coSupAmt
                            moneyText = `${coSupAmt.toLocaleString("en-US")}`
                          }

                          const item = e as unknown as ResearchTopicRecord
                          const decisionNum = item.decisionNumber || item.code || ""
                          const decisionDate = item.decisionDate
                            ? formatDateInSlash(item.decisionDate)
                            : item.reportDate
                              ? formatDateInSlash(item.reportDate)
                              : ""
                          const quyetDinhText = decisionNum
                            ? `${decisionNum}${decisionDate ? ` ngày ${decisionDate}` : ""}`
                            : ""

                          return {
                            stt: idx + 1,
                            quyet_dinh: quyetDinhText,
                            cbhd: cbhdText,
                            hoc_vien: studentName,
                            khoa: studentCourse,
                            so_tien: moneyText,
                            ky_nhan: "",
                          }
                        })

                        const res = await previewExcelTemplate({
                          previewKey: `cdnc-thanh-toan-kinh-phi-${trainingCourseId}-${semesterId}`,
                          fileName: "ThanhToanKinhPhiHuongDanChuyenDe.xlsx",
                          path: "ThanhToanKinhPhiHuongDanChuyenDe.xlsx",
                          showGridLines: true,
                          wrapText: true,
                          prefix: "mta/luan-van",
                          payload: [
                            {
                              data: {
                                ngay: dayjs().format("DD"),
                                thang: formatThangIn(dayjs().month() + 1),
                                nam: dayjs().format("YYYY"),
                                tieu_de: "KINH PHÍ HƯỚNG DẪN CHUYÊN ĐỀ NGHỊÊN CỨU",
                                dot_bao_ve: `Khoá: ${khoaName} - ${kyName}`,
                                don_vi: `Chưa có đơn vị (${tableRows.length} học viên)`,
                                tong_tien: totalAmount.toLocaleString("en-US").replace(/,/g, " "),
                                tong_tien_chu: totalAmount.toVndWord("", false),
                                nguoi_ky: chiefName,
                                data: tableRows,
                              },
                            },
                          ],
                        })

                        openXemTaiLieu({
                          uri: res.data.path,
                          name: "ThanhToanKinhPhiHuongDanChuyenDe.xlsx",
                          mimeType: "xlsx",
                        })
                      }}
                    >
                      Thanh toán kinh phí HD
                    </Button>
                  </div>
                </Form.Item>
                <Form.Item className="mb-0">
                  <Input
                    className="w-56"
                    allowClear
                    placeholder="Tìm theo tên học viên"
                    prefix={<SearchOutlined className="text-gray-400" />}
                    value={filters.name}
                    onChange={(e) => {
                      setFilters({ ...filters, name: e.target.value })
                      setCurrentPage(1)
                    }}
                  />
                </Form.Item>
              </Flex>
            )}
          </Flex>
        </Form>
        <Table
          scrollable
          maxHeight={"calc(100vh - 330px)"}
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          columns={[
            {
              title: "",
              width: 40,
              fixed: "left",
              align: "center",
              render: (_, record) => {
                return (
                  <div className="flex justify-center items-center">
                    {((record?.deadline && dayjs().isBefore(dayjs(record.deadline))) ||
                      role === "P7") && (
                      <SquarePen
                        className="text-sm cursor-pointer m-1"
                        onClick={() =>
                          openPutResearchTopicModal({
                            studentResearchTopicId: record.id,
                            role,
                          })
                        }
                      />
                    )}
                  </div>
                )
              },
            },
            {
              title: "Hạn nhập",
              width: 80,
              align: "center",
              render: (_, record) => {
                return (
                  <p
                    className={cn(
                      record?.deadline && dayjs().isAfter(dayjs(record.deadline))
                        ? "text-red-600"
                        : ""
                    )}
                  >
                    {record?.deadline ? dayjs(record.deadline).format("DD/MM/YYYY") : ""}
                  </p>
                )
              },
            },
            {
              title: "Mã định danh",
              width: 100,
              align: "center",
              render: (_, record) => {
                return record?.studentSubjectScore?.student?.userProfile?.code || ""
              },
            },
            {
              title: "Họ và tên",
              width: 150,
              align: "left",
              fixed: "left",
              dataIndex: "name",
              type: "input",
              render: (_, record) => {
                return record?.studentSubjectScore?.student?.userProfile?.fullname
              },
            },
            {
              title: "Mã lớp môn học",
              width: 150,
              align: "center",
              render: (_, record) => {
                return (
                  <Tooltip title={record?.studentSubjectScore?.subjectClass?.name}>
                    {record?.studentSubjectScore?.subjectClass?.code || ""}
                  </Tooltip>
                )
              },
            },
            {
              title: "Ngày sinh",
              width: 80,
              align: "center",
              render: (_, record) => {
                return record?.studentSubjectScore?.student?.userProfile?.dateOfBirth
                  ? dayjs(record?.studentSubjectScore?.student?.userProfile?.dateOfBirth).format(
                      "DD/MM/YYYY"
                    )
                  : ""
              },
            },
            {
              title: "Đơn vị quản lý",
              width: 180,
              align: "left",
              render: (_, record) => {
                const org =
                  record?.studentSubjectScore?.subjectVersion?.managementOrganization ||
                  record?.studentSubjectScore?.subjectVersion?.subject?.managementOrganization
                if (!org) return ""
                return (
                  <Tooltip title={org.sTen}>
                    {org.sMa ? `${org.sMa} - ${org.sTen}` : org.sTen}
                  </Tooltip>
                )
              },
            },
            {
              title: "Tên chuyên đề",
              width: 250,
              align: "left",
              render: (_, record) => {
                return record?.name || ""
              },
            },
            {
              title: "Nội dung chính đạt được",
              width: 250,
              align: "left",
              render: (_, record) => {
                return record?.mainContent || ""
              },
            },
            {
              title: <Tooltip title="Giảng viên hướng dẫn 1">GVHD1</Tooltip>,
              width: 150,
              align: "left",
              render: (_, record) => {
                return getSupervisorName(versionToPersonLike(record?.supervisor), true, true)
              },
            },
            {
              title: <Tooltip title="Giảng viên hướng dẫn 2">GVHD2</Tooltip>,
              width: 150,
              align: "left",
              render: (_, record) => {
                return getSupervisorName(versionToPersonLike(record?.coSupervisor), true, true)
              },
            },
            {
              title: "Thời gian báo cáo",
              width: 120,
              align: "center",
              render: (_, record) => {
                return record?.reportDate ? dayjs(record?.reportDate).format("DD/MM/YYYY") : ""
              },
            },
            {
              title: "Điểm",
              width: 80,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                return record?.studentSubjectScore?.finalScore
                  ? Number(record?.studentSubjectScore?.finalScore).toFixedSmart(2)
                  : ""
              },
            },
          ]}
          data={studentResearchTopicData}
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
  )
}
ChuyenDeNghienCuu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
