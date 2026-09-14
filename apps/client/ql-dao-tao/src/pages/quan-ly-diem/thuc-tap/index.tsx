import { FileOutlined, TableOutlined, UploadOutlined } from "@ant-design/icons"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TreeSelect from "@components/commons/tree-select"
import ImportInternshipModal from "@components/modal/import-excel-internship"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgFlat, buildOrgTree } from "@lib/utils"
import { getSupervisorName } from "@pages/quan-ly-luan-van/dm-luan-van"
import { versionToPersonLike } from "@/utils/expert-select"
import { SubjectVersionType } from "@workspace/db"
import type { Prisma } from "@workspace/db/client"
import {
  useCountStudentInternship,
  useCreateManyStudentInternship,
  useFindManyDM_DonVi,
  useFindManyStudentInternship,
  useFindManySubjectClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { exportInternshipProfile } from "@workspace/libs/api/training"
import { whereOrganization } from "@workspace/libs/constants"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Col, Flex, Form, Modal, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { SquarePen } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import ExportTemplateInternship from "../../../components/modal/export-template-internship"

interface ThucTapForm {
  trainingCourseId: string
  organizationId: string
  subjectClassId: string
  reportDate: string
}

export default function ThucTap({ role = "P7" }: { role: "P7" | "KHOA_BO_MON" }) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm<ThucTapForm>()
  const organizationId = Form.useWatch("organizationId", form)
  const trainingCourseId = Form.useWatch("trainingCourseId", form)
  const subjectClassId = Form.useWatch("subjectClassId", form)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(10)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterId } = useSemesterStore()
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    subjectName: "",
  })

  const { onOpen: openPutInternshipModal } = useDisclosure<{
    studentInternshipId: string
    role: "P7" | "KHOA_BO_MON"
  }>({
    tag: "PutInternshipModal",
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
  const orgId = window.contextData?.organizationId
  const orgIds = [
    ...buildOrgFlat(
      organizationData.map((e) => ({
        Id: e.Id,
        sTen: null,
        sParentId: e.sParentId,
        sMa: null,
      })),
      orgId || "0"
    ).map((org) => org.value),
    orgId,
  ].filter(Boolean)

  const { data: subjectClassData = [] } = useFindManySubjectClass({
    where: {
      subject: {
        type: SubjectVersionType.Internship,
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
  })
  const where = useMemo(() => {
    const filter: Prisma.StudentInternshipWhereInput = {
      studentSubjectScore: {
        subjectClass: {
          subject: {
            type: SubjectVersionType.Internship,
            ...(role === "KHOA_BO_MON"
              ? { managementOrganizationId: { in: orgIds } }
              : organizationId
                ? { managementOrganizationId: organizationId }
                : {}),
          },
          trainingObjectTypeId,
          semesterId,
          cancelled: false,
          active: true,
          ...(subjectClassId ? { id: subjectClassId } : {}),
          ...(filters.subjectName
            ? {
                code: {
                  contains: filters.subjectName,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
        student: {
          ...(trainingCourseId
            ? {
                fixedClass: {
                  trainingCourseId: trainingCourseId,
                },
              }
            : {}),
          status: "ENROLLED",
          active: true,
          deletedAt: null,
          ...(filters.code
            ? {
                code: {
                  contains: filters.code,
                  mode: "insensitive" as const,
                },
              }
            : {}),
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

  const { data: studentInternshipData = [], refetch: refetchStudentInternship } =
    useFindManyStudentInternship({
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
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    })

  const { data: count, refetch: refetchCount } = useCountStudentInternship({
    where,
  })

  const { mutateAsync: createManyStudentInternship } = useCreateManyStudentInternship()

  const handleAssignDate = async () => {
    const reportDate = form.getFieldValue("reportDate")
    if (!reportDate) {
      return message.warning("Vui lòng chọn hạn nhập thực tập trước khi gán!")
    }

    const res = await sqlTransaction([
      {
        model: "StudentInternship",
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
    refetchStudentInternship()
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
            where: { subjectClassId: subjectClassId },
          },
        },
      ])
      if (subjectStudent.status !== 200) {
        return message.error("Không thể lấy danh sách sinh viên")
      }
      const studentSubjectScoreData = subjectStudent
        .data[0] as Prisma.StudentSubjectScoreGetPayload<{}>[]
      if (studentSubjectScoreData.length === 0) {
        return message.error("Lớp môn học này không có sinh viên nào.")
      }
      await createManyStudentInternship({
        data: studentSubjectScoreData.map((record) => ({
          studentSubjectScoreId: record.id,
        })),
        skipDuplicates: true,
      })
      message.success("Lấy dữ liệu thành công!")
    } catch (error) {
      console.error("getData Error:", error)
      message.error("Có lỗi xảy ra khi xử lý dữ liệu.")
    } finally {
      refetchStudentInternship()
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

      const worksheet = workbook.getWorksheet("Danh sách thực tập")
      if (!worksheet) {
        return message.error('Không tìm thấy Sheet "Danh sách thực tập" trong file!')
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

        const unit = getCellValue(row.getCell(10))
        const internshipContent = getCellValue(row.getCell(11))

        const address = getCellValue(row.getCell(3))

        const startDateVal = row.getCell(12).value
        const endDateVal = row.getCell(13).value

        const deadlineVal = row.getCell(2).value
        const reportDateVal = row.getCell(16).value

        const startDate = startDateVal instanceof Date ? startDateVal.toISOString() : null
        const endDate = endDateVal instanceof Date ? endDateVal.toISOString() : null

        const deadline = deadlineVal instanceof Date ? deadlineVal.toISOString() : null
        const reportDate = reportDateVal instanceof Date ? reportDateVal.toISOString() : null

        dataToUpdate.push({
          model: "StudentInternship",
          operation: "upsert",
          data: {
            where: { studentSubjectScoreId: studentSubjectScoreId },
            update: {
              unit,
              internshipContent,
              supervisorId,
              coSupervisorId,
              address,
              deadline,
              startDate,
              endDate,
              reportDate,
            },
            create: {
              studentSubjectScoreId,
              unit,
              internshipContent,
              supervisorId,
              coSupervisorId,
              address,
              deadline,
              startDate,
              endDate,
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
        const {
          supervisorId: _s2,
          coSupervisorId: _c2,
          ...createRest
        } = item.data.create

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
      refetchStudentInternship()
    } catch (error) {
      console.error("Import Excel Error:", error)
      message.error("Lỗi khi đọc file hoặc cập nhật dữ liệu. Vui lòng kiểm tra lại định dạng file!")
    } finally {
      loading()
    }
  }
  const handleExportInternship = async () => {
    let internshipIds: string[]

    if (selectedRowKeys.length > 0) {
      // Nếu có chọn row, chỉ export những row đã chọn
      internshipIds = selectedRowKeys as string[]
    } else {
      // Nếu không chọn row nào, fetch tất cả IDs thỏa mãn filter (không pagination)
      const loading = message.loading("Đang tải dữ liệu...", 0)
      try {
        const allData = await sqlTransaction([
          {
            model: "StudentInternship",
            operation: "findMany",
            data: {
              where,
              select: { id: true },
            },
          },
        ])
        loading()

        if (allData.status !== 200) {
          return message.error("Không thể lấy dữ liệu thực tập")
        }

        const allInternships = allData.data[0] as Array<{ id: string }>
        internshipIds = allInternships?.map((item) => item.id) || []

        if (internshipIds.length === 0) {
          return message.warning("Không có dữ liệu để xuất")
        }
      } catch (error) {
        loading()
        return message.error("Có lỗi khi tải dữ liệu")
      }
    }

    const { status, data } = await exportInternshipProfile({
      internshipIds,
    })

    if (status === 200) {
      saveAs(data, "danh_sach_thuc_tap.xlsx")
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
          <Flex gap={6} wrap="wrap">
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
                allowClear
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
              <div className="flex gap-2">
                <Button type="primary" onClick={async () => await getData()}>
                  Lấy dữ liệu
                </Button>
                {/* <Button type="primary" onClick={async () => await exportToExcel()}>
                                    Xuất mẫu excel
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => document.getElementById('import-excel')?.click()}
                                >
                                    Import Excel
                                </Button> */}
                {/* <input
                                    id="import-excel"
                                    type="file"
                                    accept=".xlsx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            confirmImport(file)
                                        }
                                        e.target.value = ''
                                    }}
                                /> */}
              </div>
            </Form.Item>
            {role === "P7" && (
              <>
                <Form.Item name="reportDate" label="Hạn nhập thực tập" className="mb-0 ml-2">
                  <DatePicker className="w-44" placeholder="Chọn hạn nhập thực tập" />
                </Form.Item>
                <Form.Item className="mb-0">
                  <div className="flex gap-2">
                    <Button type="primary" onClick={handleAssignDate}>
                      Gán ngày
                    </Button>
                  </div>
                </Form.Item>
              </>
            )}
            {/* {role === 'P7' && (
                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button
                                        type="primary"
                                        icon={<FileOutlined />}
                                        onClick={async () => {
                                            if (!trainingCourseId) {
                                                return message.warning(
                                                    'Vui lòng chọn khoá học trước khi xuất phụ lục!'
                                                )
                                            }

                                            if (!semesterId) {
                                                return message.warning(
                                                    'Vui lòng chọn kỳ học trước khi xuất phụ lục!'
                                                )
                                            }
                                            const khoaVaKy = await sqlTransaction([
                                                {
                                                    model: 'TrainingCourse',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: trainingCourseId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                {
                                                    model: 'Semester',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: semesterId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            ])
                                            const khoaVaKyData = khoaVaKy.data as [
                                                { name: string },
                                                { name: string },
                                            ]

                                            const res = await excelTemplate({
                                                fileName: 'QD_GiaoChuyenDe.xlsx',
                                                path: 'QD_GiaoChuyenDe.xlsx',
                                                showGridLines: true,
                                                wrapText: true,
                                                payload: [
                                                    {
                                                        data: {
                                                            khoa: khoaVaKyData?.[0]?.name?.firstCase?.(),
                                                            hoc_ky: khoaVaKyData?.[1]?.name?.toLowerCase?.(),
                                                            so_hv: studentInternshipData.length,
                                                            so_hv_chu:
                                                                studentInternshipData.length.toVndWord(
                                                                    '',
                                                                    false
                                                                ),
                                                        },
                                                    },
                                                ],
                                            })
                                            saveAs(
                                                res.data,
                                                `QD_GiaoChuyenDe_${dayjs().format('HH-mm-ss')}.xlsx`
                                            )
                                        }}
                                    >
                                        QĐ giao thực tập nghiên cứu
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<FileOutlined />}
                                        onClick={async () => {
                                            if (!trainingCourseId) {
                                                return message.warning(
                                                    'Vui lòng chọn khoá học trước khi xuất phụ lục!'
                                                )
                                            }

                                            if (!semesterId) {
                                                return message.warning(
                                                    'Vui lòng chọn kỳ học trước khi xuất phụ lục!'
                                                )
                                            }

                                            let globalIndex = 0

                                            const khoaVaKy = await sqlTransaction([
                                                {
                                                    model: 'TrainingCourse',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: trainingCourseId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                {
                                                    model: 'Semester',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: semesterId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            ])
                                            const khoaVaKyData = khoaVaKy.data as [
                                                { name: string },
                                                { name: string },
                                            ]

                                            // Count research topics per student
                                            const researchTopicCountByStudent =
                                                studentInternshipData.reduce(
                                                    (acc, e) => {
                                                        const studentCode =
                                                            e.studentSubjectScore.student?.code
                                                        if (studentCode) {
                                                            acc[studentCode] =
                                                                (acc[studentCode] || 0) + 1
                                                        }
                                                        return acc
                                                    },
                                                    {} as Record<string, number>
                                                )

                                            const payload = Object.values(
                                                studentInternshipData.reduce(
                                                    (acc, e) => {
                                                        const ma_cn =
                                                            e.studentSubjectScore.student
                                                                ?.curriculumVersion?.curriculum
                                                                ?.trainingMajor?.code
                                                        if (!ma_cn) return acc

                                                        if (!acc[ma_cn]) {
                                                            acc[ma_cn] = {
                                                                ma_cn,
                                                                chuyen_nganh:
                                                                    e.studentSubjectScore.student
                                                                        ?.curriculumVersion
                                                                        ?.curriculum?.trainingMajor
                                                                        ?.name,
                                                                students: [],
                                                            }
                                                        }

                                                        globalIndex++
                                                        const studentCode =
                                                            e.studentSubjectScore.student?.code
                                                        acc[ma_cn].students.push({
                                                            tt: globalIndex,
                                                            ten: `${
                                                                e.studentSubjectScore.student
                                                                    ?.userProfile?.fullname
                                                            }\n${
                                                                e.studentSubjectScore.student
                                                                    ?.userProfile?.dateOfBirth
                                                                    ? dayjs(
                                                                          e.studentSubjectScore
                                                                              .student?.userProfile
                                                                              ?.dateOfBirth
                                                                      ).format('DD/MM/YYYY')
                                                                    : ''
                                                            }`.trim(),
                                                            cbhd: `1.${getSupervisorName(versionToPersonLike(e.supervisor), false, true) || ''}\n2.${getSupervisorName(versionToPersonLike(e.coSupervisor), false, true) || ''}`.trim(),
                                                            ten_cd: e.name,
                                                            macd: e.studentSubjectScore
                                                                .subjectVersion?.code,
                                                            stc: e.studentSubjectScore
                                                                .subjectVersion?.credit,
                                                            ndcd: e.mainContent,
                                                            so_cd: studentCode
                                                                ? researchTopicCountByStudent[
                                                                      studentCode
                                                                  ]
                                                                : 0,
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
                                            const res = await excelTemplate({
                                                fileName: 'Phu-luc-QD-Chuyen-De-Nghien-Cuu.xlsx',
                                                head: {
                                                    data: {
                                                        khoa: khoaVaKyData?.[0]?.name?.toUpperCase(),
                                                        hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase(),
                                                    },
                                                },
                                                tail: {
                                                    data: {
                                                        so_hv: payload.flatMap(
                                                            (item) => item.students
                                                        ).length,
                                                        so_cd: payload.flatMap(
                                                            (item) => item.students
                                                        ).length,
                                                    },
                                                },
                                                path: 'PL_ThucTap.xlsx',
                                                showGridLines: true,
                                                wrapText: true,
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
                                                            arr
                                                                .slice(0, idx)
                                                                .reduce(
                                                                    (sum, student) =>
                                                                        sum + student.so_cd,
                                                                    0
                                                                )
                                                        const endRow = startRow + s.so_cd - 1
                                                        return `B${startRow}:B${endRow}`
                                                    }),
                                                })),
                                            })
                                            saveAs(
                                                res.data,
                                                `PL_ThucTap_${dayjs().format('HH-mm-ss')}.xlsx`
                                            )
                                        }}
                                    >
                                        Phụ lục QĐ thực tập nghiên cứu
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<FileOutlined />}
                                        onClick={async () => {
                                            if (!trainingCourseId) {
                                                return message.warning(
                                                    'Vui lòng chọn khoá học trước khi xuất phụ lục!'
                                                )
                                            }

                                            if (!semesterId) {
                                                return message.warning(
                                                    'Vui lòng chọn kỳ học trước khi xuất phụ lục!'
                                                )
                                            }

                                            const khoaVaKy = await sqlTransaction([
                                                {
                                                    model: 'TrainingCourse',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: trainingCourseId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                {
                                                    model: 'Semester',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: semesterId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            ])
                                            const khoaVaKyData = khoaVaKy.data as [
                                                { name: string },
                                                { name: string },
                                            ]

                                            const expertProfiles = await sqlTransaction([
                                                {
                                                    model: 'Expert',
                                                    operation: 'findMany',
                                                    data: {
                                                        where: {
                                                            OR: [
                                                                {
                                                                    versions: {
                                                                        some: {
                                                                            supervisorInternship: {
                                                                                some: {
                                                                                    studentSubjectScore: {
                                                                                        subjectClass: {
                                                                                            semesterId,
                                                                                            trainingObjectTypeId,
                                                                                        },
                                                                                        student: {
                                                                                            fixedClass: {
                                                                                                trainingCourseId,
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                {
                                                                    versions: {
                                                                        some: {
                                                                            coSupervisorInternship: {
                                                                                some: {
                                                                                    studentSubjectScore: {
                                                                                        subjectClass: {
                                                                                            semesterId,
                                                                                            trainingObjectTypeId,
                                                                                        },
                                                                                        student: {
                                                                                            fixedClass: {
                                                                                                trainingCourseId,
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
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
                                                                    supervisorInternship: {
                                                                        where: {
                                                                            studentSubjectScore: {
                                                                                subjectClass: {
                                                                                    semesterId,
                                                                                    trainingObjectTypeId,
                                                                                },
                                                                                student: {
                                                                                    fixedClass: {
                                                                                        trainingCourseId,
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                        select: {
                                                                            id: true,
                                                                            coSupervisorVersionId: true,
                                                                            studentSubjectScore: {
                                                                                select: {
                                                                                    subjectVersion: {
                                                                                        select: {
                                                                                            credit: true,
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    coSupervisorInternship: {
                                                                        where: {
                                                                            studentSubjectScore: {
                                                                                subjectClass: {
                                                                                    semesterId,
                                                                                    trainingObjectTypeId,
                                                                                },
                                                                                student: {
                                                                                    fixedClass: {
                                                                                        trainingCourseId,
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                        select: {
                                                                            id: true,
                                                                            supervisorVersionId: true,
                                                                            studentSubjectScore: {
                                                                                select: {
                                                                                    subjectVersion: {
                                                                                        select: {
                                                                                            credit: true,
                                                                                        },
                                                                                    },
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
                                                    supervisorInternship: Array<{
                                                        id: string
                                                        coSupervisorVersionId: string | null
                                                        studentSubjectScore: { subjectVersion: { credit: number } }
                                                    }>
                                                    coSupervisorInternship: Array<{
                                                        id: string
                                                        supervisorVersionId: string | null
                                                        studentSubjectScore: { subjectVersion: { credit: number } }
                                                    }>
                                                }>
                                            }

                                            const expertProfilesData = (expertProfiles
                                                .data[0] || []) as ExpertStatRow[]

                                            const flattenTopics = (profile: ExpertStatRow) => ({
                                                supervisorInternship: profile.versions.flatMap(
                                                    (v) => v.supervisorInternship
                                                ),
                                                coSupervisorInternship: profile.versions.flatMap(
                                                    (v) => v.coSupervisorInternship
                                                ),
                                            })

                                            const res = await excelTemplate({
                                                fileName: 'TK_TaiGiangDayCuaGiangVien.xlsx',
                                                path: 'TK_TaiGiangDayCuaGiangVien.xlsx',
                                                showGridLines: true,
                                                wrapText: true,
                                                payload: [
                                                    {
                                                        data: {
                                                            khoa: khoaVaKyData?.[0]?.name?.toUpperCase?.(),
                                                            hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase?.(),
                                                            data: expertProfilesData.map(
                                                                (profile, idx) => {
                                                                    const topics = flattenTopics(profile)
                                                                    const person = {
                                                                        ...profile.currentVersion,
                                                                        lecturer: profile.lecturer,
                                                                        lecturerId: profile.lecturerId,
                                                                        inAcademy: profile.currentVersion?.inAcademy ?? profile.lecturerId != null,
                                                                    }
                                                                    return {
                                                                        tt: idx + 1,
                                                                        ho_ten: getSupervisorName(person, false, true) || '',
                                                                        cd_dl:
                                                                            topics.supervisorInternship.filter(
                                                                                (t) =>
                                                                                    !t.coSupervisorVersionId
                                                                            ).length +
                                                                            topics.coSupervisorInternship.filter(
                                                                                (t) =>
                                                                                    !t.supervisorVersionId
                                                                            ).length,
                                                                        tc_dl:
                                                                            topics.supervisorInternship
                                                                                .filter(
                                                                                    (t) =>
                                                                                        !t.coSupervisorVersionId
                                                                                )
                                                                                .map(
                                                                                    (e) =>
                                                                                        e
                                                                                            .studentSubjectScore
                                                                                            .subjectVersion
                                                                                            .credit
                                                                                )
                                                                                .reduce(
                                                                                    (a, b) => a + b,
                                                                                    0
                                                                                ) +
                                                                            topics.coSupervisorInternship
                                                                                .filter(
                                                                                    (t) =>
                                                                                        !t.supervisorVersionId
                                                                                )
                                                                                .map(
                                                                                    (e) =>
                                                                                        e
                                                                                            .studentSubjectScore
                                                                                            .subjectVersion
                                                                                            .credit
                                                                                )
                                                                                .reduce(
                                                                                    (a, b) => a + b,
                                                                                    0
                                                                                ),
                                                                        cd_dhd:
                                                                            topics.coSupervisorInternship.filter(
                                                                                (t) =>
                                                                                    !!t.supervisorVersionId
                                                                            ).length +
                                                                            topics.supervisorInternship.filter(
                                                                                (t) =>
                                                                                    !!t.coSupervisorVersionId
                                                                            ).length,
                                                                        tc_dhd:
                                                                            topics.coSupervisorInternship
                                                                                .filter(
                                                                                    (t) =>
                                                                                        !!t.supervisorVersionId
                                                                                )
                                                                                .map(
                                                                                    (e) =>
                                                                                        e
                                                                                            .studentSubjectScore
                                                                                            .subjectVersion
                                                                                            .credit
                                                                                )
                                                                                .reduce(
                                                                                    (a, b) => a + b,
                                                                                    0
                                                                                ) +
                                                                            topics.supervisorInternship
                                                                                .filter(
                                                                                    (t) =>
                                                                                        !!t.coSupervisorVersionId
                                                                                )
                                                                                .map(
                                                                                    (e) =>
                                                                                        e
                                                                                            .studentSubjectScore
                                                                                            .subjectVersion
                                                                                            .credit
                                                                                )
                                                                                .reduce(
                                                                                    (a, b) => a + b,
                                                                                    0
                                                                                ),
                                                                        cd_tong: `=E${9 + idx}+C${9 + idx}`,
                                                                        tai_tong: `=D${9 + idx}*H${9 + idx}+(F${9 + idx}*H${9 + idx}/2)`,
                                                                        dinh_muc: 3.75,
                                                                        ghi_chu: '',
                                                                    }
                                                                }
                                                            ),
                                                        },
                                                    },
                                                ],
                                            })
                                            saveAs(
                                                res.data,
                                                `TK_TaiGiangDayCuaGiangVien_${dayjs().format('HH-mm-ss')}.xlsx`
                                            )
                                        }}
                                    >
                                        TK tải giảng GV
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<FileOutlined />}
                                        onClick={async () => {
                                            if (!trainingCourseId) {
                                                return message.warning(
                                                    'Vui lòng chọn khoá học trước khi xuất phụ lục!'
                                                )
                                            }

                                            if (!semesterId) {
                                                return message.warning(
                                                    'Vui lòng chọn kỳ học trước khi xuất phụ lục!'
                                                )
                                            }

                                            const khoaVaKy = await sqlTransaction([
                                                {
                                                    model: 'TrainingCourse',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: trainingCourseId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                {
                                                    model: 'Semester',
                                                    operation: 'findUnique',
                                                    data: {
                                                        where: { id: semesterId },
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            ])
                                            const khoaVaKyData = khoaVaKy.data as [
                                                { name: string },
                                                { name: string },
                                            ]

                                            const students = await sqlTransaction([
                                                {
                                                    model: 'Student',
                                                    operation: 'findMany',
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
                                                                            type: $Enums
                                                                                .SubjectVersionType
                                                                                .Research,
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
                                                                            type: $Enums
                                                                                .SubjectVersionType
                                                                                .Research,
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

                                            const studentsData = students
                                                .data[0] as Prisma.StudentGetPayload<{
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

                                            const res = await excelTemplate({
                                                fileName: 'TK_SoLuongChuyenDeHocVien.xlsx',
                                                path: 'TK_SoLuongChuyenDeHocVien.xlsx',
                                                showGridLines: true,
                                                wrapText: true,
                                                payload: [
                                                    {
                                                        data: {
                                                            khoa: khoaVaKyData?.[0]?.name?.toUpperCase?.(),
                                                            hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase?.(),
                                                            data: studentsData.map(
                                                                (profile, idx) => {
                                                                    return {
                                                                        tt: idx + 1,
                                                                        ten: profile?.userProfile
                                                                            ?.fullname,
                                                                        ngay_sinh: profile
                                                                            ?.userProfile
                                                                            ?.dateOfBirth
                                                                            ? dayjs(
                                                                                  profile
                                                                                      ?.userProfile
                                                                                      ?.dateOfBirth
                                                                              ).format('DD/MM/YYYY')
                                                                            : '',
                                                                        nganh_chuyen_nganh: `${
                                                                            profile
                                                                                ?.curriculumVersion
                                                                                ?.curriculum
                                                                                .trainingMajor
                                                                                ?.trainingField
                                                                                ?.name
                                                                        } (${
                                                                            profile
                                                                                ?.curriculumVersion
                                                                                ?.curriculum
                                                                                .trainingMajor?.name
                                                                        })`,
                                                                        so_cd: profile
                                                                            .subjectClassStudent
                                                                            .length,
                                                                        tong_tc:
                                                                            profile?.subjectClassStudent?.reduce(
                                                                                (a, b) =>
                                                                                    a +
                                                                                    (b?.subjectClass
                                                                                        ?.subject
                                                                                        ?.credit ||
                                                                                        0),
                                                                                0
                                                                            ),
                                                                    }
                                                                }
                                                            ),
                                                        },
                                                    },
                                                ],
                                            })
                                            saveAs(
                                                res.data,
                                                `TK_SoLuongChuyenDeHocVien_${dayjs().format('HH-mm-ss')}.xlsx`
                                            )
                                        }}
                                    >
                                        TK Số lượng CĐ HV
                                    </Button>
                                </div>
                            </Form.Item>
                        )} */}
          </Flex>
        </Form>
        <Col span={24} className="pt-2 ml-1">
          <Row gutter={[16, 16]} align="middle" justify="start" className="gap-1">
            {selectedRowKeys.length > 0 && <p>(Đang chọn {selectedRowKeys.length} TTS)</p>}
            <Button type="primary" onClick={handleExportInternship} icon={<TableOutlined />}>
              Xuất DS Thực Tập
            </Button>
            <Button
              type="primary"
              onClick={() => setImportModalVisible(true)}
              icon={<UploadOutlined />}
            >
              Nhập dữ liệu Excel
            </Button>
            <ImportInternshipModal
              visible={importModalVisible}
              onSuccess={() => {
                setImportModalVisible(false)
                refetchStudentInternship()
                refetchCount()
              }}
              onCancel={() => setImportModalVisible(false)}
            />
            <ExportTemplateInternship />
            {/* <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button> */}
          </Row>
        </Col>
        <Table
          scrollable={studentInternshipData.length > 0}
          maxHeight={"calc(100vh - 330px)"}
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys) => {
              setSelectedRowKeys(keys)
            },
          }}
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          columns={[
            {
              title: "Hạn nhập",
              width: 80,
              align: "center",
              fixed: "left",
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
              title: "Mã SV",
              width: 100,
              align: "center",
              fixed: "left",
              dataIndex: "code",
              type: "input",
              render: (_, record) => {
                return record?.studentSubjectScore?.student?.code || ""
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
              dataIndex: "subjectName",
              type: "input",
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
            // {
            //     title: 'Lớp môn học',
            //     width: 150,
            //     align: 'left',
            //     render: (_, record) => {
            //         return record?.subjectClass?.name || ''
            //     },
            // },
            // {
            //     title: 'STC',
            //     width: 50,
            //     align: 'center',
            //     render: (_, record) => {
            //         return record?.subjectVersion?.credit || ''
            //     },
            // },
            {
              title: "Cơ quan thực tập",
              width: 170,
              align: "left",
              render: (_, record) => {
                return record?.institution || ""
              },
            },
            {
              title: "Đơn vị thực tập",
              width: 170,
              align: "left",
              render: (_, record) => {
                return record?.unit || ""
              },
            },
            {
              title: "Địa chỉ đơn vị thực tập",
              width: 250,
              align: "left",
              render: (_, record) => {
                return record?.address || ""
              },
            },
            // {
            //     title: 'Tên thực tập',
            //     width: 250,
            //     align: 'left',
            //     render: (_, record) => {
            //         return record?.name || ''
            //     },
            // },
            {
              title: "Nội dung thực tập",
              width: 300,
              align: "left",
              render: (_, record) => {
                return record?.internshipContent || ""
              },
            },
            {
              title: <Tooltip title="Giảng viên hướng dẫn 1">GVHD1</Tooltip>,
              width: 170,
              align: "left",
              render: (_, record) => {
                return getSupervisorName(versionToPersonLike(record?.supervisor), true, true)
              },
            },
            {
              title: <Tooltip title="Giảng viên hướng dẫn 2">GVHD2</Tooltip>,
              width: 170,
              align: "left",
              render: (_, record) => {
                return getSupervisorName(versionToPersonLike(record?.coSupervisor), true, true)
              },
            },
            {
              title: "Thời gian bắt đầu thực tập",
              width: 150,
              align: "center",
              render: (_, record) => {
                return record?.startDate ? dayjs(record?.startDate).format("DD/MM/YYYY") : ""
              },
            },
            {
              title: "Thời gian kết thúc thực tập",
              width: 150,
              align: "center",
              render: (_, record) => {
                return record?.endDate ? dayjs(record?.endDate).format("DD/MM/YYYY") : ""
              },
            },
            {
              title: "Thời gian báo cáo",
              width: 150,
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
            {
              title: "",
              width: 40,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                return (
                  <div className="flex justify-center items-center">
                    {((record?.deadline && dayjs().isBefore(dayjs(record.deadline))) ||
                      role === "P7") && (
                      <SquarePen
                        className="text-sm cursor-pointer m-1"
                        onClick={() =>
                          openPutInternshipModal({
                            studentInternshipId: record.id,
                            role,
                          })
                        }
                      />
                    )}
                  </div>
                )
              },
            },
          ]}
          data={studentInternshipData}
          rowKey="id"
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
ThucTap.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
