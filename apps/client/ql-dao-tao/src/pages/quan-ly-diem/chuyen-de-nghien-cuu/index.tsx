import { FileOutlined } from "@ant-design/icons"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TreeSelect from "@components/commons/tree-select"
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
import { excelTemplate, sqlTransaction } from "@workspace/libs/api/model"
import { whereOrganization } from "@workspace/libs/constants"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Col, Flex, Form, Modal, message, Row, Tooltip } from "antd"
import dayjs from "dayjs"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { SquarePen } from "lucide-react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface ChuyenDeNghienCuuForm {
  trainingCourseId: string
  organizationId: string
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

  const { onOpen: openPutResearchTopicModal } = useDisclosure<{
    studentResearchTopicId: string
    role: "P7" | "KHOA_BO_MON"
  }>({
    tag: "PutResearchTopicModal",
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
  })
  const where = useMemo(() => {
    const filter: Prisma.StudentResearchTopicWhereInput = {
      studentSubjectScore: {
        subjectClass: {
          subject: {
            type: SubjectVersionType.Research,
            managementOrganizationId: role === "KHOA_BO_MON" ? { in: orgIds } : organizationId,
          },
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
          status: "ENROLLED",
          active: true,
          deletedAt: null,
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
  ])
  const { data: studentResearchTopicData = [], refetch: refetchStudentResearchTopic } =
    useFindManyStudentResearchTopic({
      where,
      include: {
        supervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
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
        coSupervisor: {
          include: {
            academicDegreeType: true,
            academicRankType: true,
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
            where: { subjectClassId: subjectClassId },
          },
        },
      ])
      const studentSubjectScoreData = subjectStudent
        .data?.[0] as Prisma.StudentSubjectScoreGetPayload<{}>[]
      if (studentSubjectScoreData.length === 0) {
        return message.error("Lớp môn học này không có sinh viên nào.")
      }
      await createManyStudentResearchTopic({
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
      const finalData = dataToUpdate.map((item) => {
        const fixValue = (val: any) => (val === "[object Object]" ? null : val)

        return {
          ...item,
          data: {
            ...item.data,
            update: {
              ...item.data.update,
              supervisorId: fixValue(item.data.update.supervisorId),
              coSupervisorId: fixValue(item.data.update.coSupervisorId),
            },
            create: {
              ...item.data.create,
              supervisorId: fixValue(item.data.create.supervisorId),
              coSupervisorId: fixValue(item.data.create.coSupervisorId),
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
                <Form.Item name="reportDate" label="Hạn nhập chuyên đề" className="mb-0 ml-2">
                  <DatePicker className="w-44" placeholder="Chọn hạn nhập chuyên đề" />
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
            {role === "P7" && (
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

                      const res = await excelTemplate({
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
                      saveAs(res.data, `QD_GiaoChuyenDe_${dayjs().format("HH-mm-ss")}.xlsx`)
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
                          const studentCode = e.studentSubjectScore.student?.code
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
                            const studentCode = e.studentSubjectScore.student?.code
                            const supervisorName =
                              (getSupervisorName(e.supervisor, false, true) as string) || ""
                            const coSupervisorName =
                              (getSupervisorName(e.coSupervisor, false, true) as string) || ""
                            acc[ma_cn].students.push({
                              tt: globalIndex,
                              ten: `${e.studentSubjectScore.student?.userProfile?.fullname}\n${
                                e.studentSubjectScore.student?.userProfile?.dateOfBirth
                                  ? dayjs(
                                      e.studentSubjectScore.student?.userProfile?.dateOfBirth
                                    ).format("DD/MM/YYYY")
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
                      const res = await excelTemplate({
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
                              2 + arr.slice(0, idx).reduce((sum, student) => sum + student.so_cd, 0)
                            const endRow = startRow + s.so_cd - 1
                            return `B${startRow}:B${endRow}`
                          }),
                        })),
                      })
                      saveAs(res.data, `PL_ChuyenDeNghienCuu_${dayjs().format("HH-mm-ss")}.xlsx`)
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

                      const expertProfiles = await sqlTransaction([
                        {
                          model: "ExpertProfile",
                          operation: "findMany",
                          data: {
                            where: {
                              OR: [
                                {
                                  supervisorResearchTopic: {
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
                                {
                                  coSupervisorResearchTopic: {
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
                              ],
                            },
                            include: {
                              academicDegreeType: true,
                              academicRankType: true,
                              supervisorResearchTopic: {
                                select: {
                                  id: true,
                                  coSupervisorId: true,
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
                              coSupervisorResearchTopic: {
                                select: {
                                  id: true,
                                  supervisorId: true,

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
                              lecturer: {
                                select: {
                                  userProfile: {
                                    select: {
                                      fullname: true,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      ])

                      const expertProfilesData = expertProfiles
                        .data[0] as Prisma.ExpertProfileGetPayload<{
                        include: {
                          supervisorResearchTopic: {
                            select: {
                              id: true
                              coSupervisorId: true
                              studentSubjectScore: {
                                select: {
                                  subjectVersion: {
                                    select: {
                                      credit: true
                                    }
                                  }
                                }
                              }
                            }
                          }
                          coSupervisorResearchTopic: {
                            select: {
                              id: true
                              supervisorId: true
                              studentSubjectScore: {
                                select: {
                                  subjectVersion: {
                                    select: {
                                      credit: true
                                    }
                                  }
                                }
                              }
                            }
                          }
                          lecturer: {
                            select: {
                              userProfile: {
                                select: {
                                  fullname: true
                                }
                              }
                            }
                          }
                        }
                      }>[]

                      const res = await excelTemplate({
                        fileName: "TK_TaiGiangDayCuaGiangVien.xlsx",
                        path: "TK_TaiGiangDayCuaGiangVien.xlsx",
                        showGridLines: true,
                        wrapText: true,
                        prefix: "mta/luan-van",
                        payload: [
                          {
                            data: {
                              khoa: khoaVaKyData?.[0]?.name?.toUpperCase?.(),
                              hoc_ky: khoaVaKyData?.[1]?.name?.toUpperCase?.(),
                              data: expertProfilesData.map((profile, idx) => {
                                return {
                                  tt: idx + 1,
                                  ho_ten: (getSupervisorName(profile, false, true) as string) || "",
                                  cd_dl:
                                    profile.supervisorResearchTopic.filter((t) => !t.coSupervisorId)
                                      .length +
                                    profile.coSupervisorResearchTopic.filter((t) => !t.supervisorId)
                                      .length,
                                  tc_dl:
                                    profile.supervisorResearchTopic
                                      .filter((t) => !t.coSupervisorId)
                                      .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                      .reduce((a, b) => a + b, 0) +
                                    profile.coSupervisorResearchTopic
                                      .filter((t) => !t.supervisorId)
                                      .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                      .reduce((a, b) => a + b, 0),
                                  cd_dhd:
                                    profile.coSupervisorResearchTopic.filter(
                                      (t) => !!t.supervisorId
                                    ).length +
                                    profile.supervisorResearchTopic.filter(
                                      (t) => !!t.coSupervisorId
                                    ).length,
                                  tc_dhd:
                                    profile.coSupervisorResearchTopic
                                      .filter((t) => !!t.supervisorId)
                                      .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                      .reduce((a, b) => a + b, 0) +
                                    profile.supervisorResearchTopic
                                      .filter((t) => !!t.coSupervisorId)
                                      .map((e) => e.studentSubjectScore.subjectVersion.credit)
                                      .reduce((a, b) => a + b, 0),
                                  cd_tong: `=E${9 + idx}+C${9 + idx}`,
                                  tai_tong: `=D${9 + idx}*H${9 + idx}+(F${9 + idx}*H${9 + idx}/2)`,
                                  dinh_muc: 3.75,
                                  ghi_chu: "",
                                }
                              }),
                            },
                          },
                        ],
                      })
                      saveAs(
                        res.data,
                        `TK_TaiGiangDayCuaGiangVien_${dayjs().format("HH-mm-ss")}.xlsx`
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

                      const res = await excelTemplate({
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
                                    ? dayjs(profile?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
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
                      saveAs(
                        res.data,
                        `TK_SoLuongChuyenDeHocVien_${dayjs().format("HH-mm-ss")}.xlsx`
                      )
                    }}
                  >
                    TK Số lượng CĐ HV
                  </Button>
                </div>
              </Form.Item>
            )}
          </Flex>
        </Form>
        <Table
          scrollable
          maxHeight={"calc(100vh - 330px)"}
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
              title: "Mã SV",
              width: 100,
              align: "center",
              render: (_, record) => {
                return record?.studentSubjectScore?.student?.code || ""
              },
            },
            {
              title: "Họ và tên",
              width: 150,
              align: "left",
              fixed: "left",
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
                return getSupervisorName(record?.supervisor, true, true)
              },
            },
            {
              title: <Tooltip title="Giảng viên hướng dẫn 2">GVHD2</Tooltip>,
              width: 150,
              align: "left",
              render: (_, record) => {
                return getSupervisorName(record?.coSupervisor, true, true)
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
