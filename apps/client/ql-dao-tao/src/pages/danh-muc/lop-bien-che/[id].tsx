import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import DeleteIcon from "@components/icons/delete"
import ExportStudentInFixedClass from "@components/modal/export-list-student-in-fixedClass"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Semester, StudentSemesterResult } from "@workspace/db"
import type { Student } from "@workspace/db/client"
import {
  useFindManyCurriculumVersion,
  useFindManyDM_GioiTinh,
  useFindManyStudent,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useFindUniqueFixedClass,
  useUpdateManyStudent,
  useUpdateStudent,
} from "@workspace/db/hooks"
import { customTrainingFetch } from "@workspace/libs/api/custom-instance"
import { ROUTER_PATH } from "@workspace/router"
import { Button, Col, Divider, Dropdown, Flex, message, Popconfirm, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { BookCheckIcon } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { cn } from "@workspace/ui/lib/utils"

dayjs.locale("vi")

export default function StudentFixedClassPage() {
  const router = useRouter()
  const fixedClassId = router.query.id as string
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const [filters, setFilters] = useState<FilterProps>({
    gender: undefined,
    name: "",
    code: "",
    curriculumVersion: undefined,
    trainingMajors: undefined,
    trainingField: undefined,
    dateOfBirth: undefined,
    phone: undefined,
    statusStudent: undefined,
    rank: undefined,
    curriculumVersionParallel: undefined,
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor(
    {
      where: {
        curriculum: {
          some: {
            curriculumVersion: {
              some: {
                OR: [
                  {
                    fixedClasses: { some: { id: fixedClassId } },
                  },
                  {
                    students: { some: { fixedClassId } },
                  },
                ],
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { data: trainingFieldData = [] } = useFindManyTrainingField(
    {
      where: {
        trainingMajors: {
          some: {
            curriculum: {
              some: {
                curriculumVersion: {
                  some: {
                    OR: [
                      {
                        fixedClasses: { some: { id: fixedClassId } },
                      },
                      {
                        students: { some: { fixedClassId } },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion(
    {
      where: {
        OR: [
          {
            students: { some: { fixedClassId } },
          },
          {
            fixedClasses: { some: { id: fixedClassId } },
          },
        ],
      },
      orderBy: { name: "asc" },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { data: genderData = [] } = useFindManyDM_GioiTinh()

  const { data: fixedClass } = useFindUniqueFixedClass(
    {
      where: {
        id: fixedClassId,
      },
      include: {
        _count: {
          select: {
            students: {
              where: {
                active: true,
                status: "ENROLLED",
              },
            },
          },
        },
        trainingCourse: {
          include: {
            trainingObjectType: true,
            semesterStart: {
              include: {
                schoolYear: true,
              },
            },
          },
        },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
            trainingBlocks: {
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        managementOrganization: true,
                      },
                    },
                    trainingBlockOnCurriculumVersion: {
                      select: {
                        trainingBlock: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    semester: "asc",
                  },
                },
              },
              orderBy: {
                priority: "asc",
              },
            },
          },
        },
        managementOrganization: true,
      },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const canBoRoles = [
    { id: fixedClass?.classMonitorId, label: "Lớp trưởng", className: "bg-blue-200" },
    { id: fixedClass?.unionSecretaryId, label: "Bí thư", className: "bg-green-200" },
    { id: fixedClass?.unionLeaderId, label: "Bí thư liên chi đoàn", className: "bg-yellow-200" },
    {
      id: fixedClass?.deputyUnionSecretaryId,
      label: "Phó bí thư liên chi đoàn",
      className: "bg-orange-200",
    },
  ]

  const roleByStudentId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of canBoRoles) {
      if (r.id) map[r.id] = r.className
    }
    return map
  }, [
    fixedClass?.classMonitorId,
    fixedClass?.unionSecretaryId,
    fixedClass?.unionLeaderId,
    fixedClass?.deputyUnionSecretaryId,
  ])

  const { data = [] } = useFindManyStudent(
    {
      where: {
        fixedClassId,
        userProfile: {
          ...(filters.code
            ? {
                code: {
                  contains: filters.code,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.name
            ? {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.rank
            ? {
                rank: {
                  sTen: {
                    contains: filters.rank,
                    mode: "insensitive",
                  },
                },
              }
            : {}),
          ...(filters.phone
            ? {
                phoneNumber: {
                  contains: filters.phone,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.gender
            ? {
                genderId: {
                  in: filters.gender,
                },
              }
            : {}),
          ...(filters.dateOfBirth?.length === 2
            ? {
                dateOfBirth: {
                  gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                  lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                },
              }
            : {}),
        },
        ...(filters.curriculumVersion
          ? {
              curriculumVersionId: {
                in: filters.curriculumVersion,
              },
            }
          : {}),
        ...(filters.statusStudent
          ? {
              status: {
                in: filters.statusStudent,
              },
            }
          : {}),
        ...(filters.curriculumVersionParallel
          ? {
              curriculumVersionParallelId: {
                in: filters.curriculumVersionParallel,
              },
            }
          : {}),
      },
      include: {
        userProfile: {
          include: {
            rank: true,
            gender: true,
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                scoreConverts: true,
                trainingObjectType: {
                  include: {
                    trainingFields: {
                      include: {
                        trainingField: true,
                      },
                    },
                    trainingMajors: {
                      include: {
                        trainingMajor: true,
                      },
                    },
                  },
                },
              },
            },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingObjectType: {},
                    trainingMajor: {
                      include: {
                        trainingField: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        curriculumVersion: {
          include: {
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
            trainingTime: true,
            trainingLanguage: true,
          },
        },
        curriculumVersionParallel: true,
        subjectClassStudent: {
          include: {
            subjectVersion: {
              include: {
                subject: true,
              },
            },
          },
        },
        studentSemesterResult: {
          orderBy: { semester: { startDate: "desc" } },
          include: {
            semester: {
              include: {
                schoolYear: true,
              },
            },
          },
        },
        thesisRegistrations: {
          include: {
            thesisProject: {
              include: {
                defenseRecord: true,
              },
            },
          },
        },
      },
      orderBy: {
        userProfile: {
          firstName: "asc",
        },
      },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const { onOpen } = useDisclosure<{
    id: string
  }>({
    tag: "AddStudentToFixedClassModal",
  })

  const { onOpen: onOpenPrint } = useDisclosure<{
    dataTable: Student[]
    dataFixedClass: any
  }>({
    tag: "ModalPrintToDSHV",
  })

  const { onOpen: onOpenStandardOutput } = useDisclosure<{
    id: string
  }>({
    tag: "PutChuanDauRaModal",
  })

  const { onOpen: onOpenGanCanBo } = useDisclosure<{
    id: string
  }>({
    tag: "GanCanBoLopModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen({ id: fixedClassId })
  }

  const handleModalPrint = () => {
    onOpenPrint({ dataFixedClass: fixedClass, dataTable: data })
  }

  const { mutateAsync: updateUserProfile } = useUpdateStudent()
  const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateUserProfile({
        where: { id },
        data: { fixedClassId: null },
      })
      setSelectedRowKeys([])
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

  async function handleDeleteMulti() {
    try {
      showSpinner()
      if (selectedRowKeys?.length > 0) {
        await updateManyUserProfile({
          where: { id: { in: selectedRowKeys } },
          data: { fixedClassId: null },
        })
      }
      setOpen(false)
      setSelectedRowKeys([])
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

  const handleCancel = () => {
    setOpen(false)
  }

  const showPopconfirm = () => {
    setOpen(true)
  }

  const handleExportCtdt = async (
    mau: "cttk-dai-han" | "cttk-ngan-han" | "khtk-nghien-cuu" | "khtk-ung-dung"
  ) => {
    if (!fixedClassId) {
      message.warning("Không tìm thấy lớp quản lý")
      return
    }
    const filePrefix: Record<typeof mau, string> = {
      "cttk-dai-han": "CTTK-dai-han",
      "cttk-ngan-han": "CTTK-ngan-han",
      "khtk-nghien-cuu": "KHTK-ding-huong-nghien-cuu",
      "khtk-ung-dung": "KHTK-ding-huong-ung-dung",
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/fixed-class/export-chuong-trinh-dao-tao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixedClassId, mau }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        saveAs(res.data, `${filePrefix[mau]}.${dayjs().format("DDMMYY")}.docx`)
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleExportDiemLop = async () => {
    const trainingCourseId = fixedClass?.trainingCourseId
    if (!trainingCourseId) {
      message.error("Không xác định được khóa học")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-theo-lop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingCourseId }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        const fileName = `BangDiemToanKhoa-${fixedClass?.trainingCourse?.name ?? "KhoaHoc"}.xlsx`
        saveAs(res.data, fileName)
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Xuất file thất bại, vui lòng thử lại!")
    } finally {
      hideSpinner()
    }
  }

  const handleExportCaNhan = async () => {
    if (!data.length) {
      message.warning("Không có học viên để xuất")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-ca-nhan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: data.map((item) => item.id) }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        saveAs(res.data, "BDCN.xlsx")
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  const handleExportQuaTrinh = async () => {
    if (!data.length) {
      message.warning("Không có học viên để xuất")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-qua-trinh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: data.map((item) => item.id) }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        saveAs(res.data, "BDQT.xlsx")
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleExportBangDiem = async () => {
    if (!data.length) {
      message.warning("Không có học viên để xuất")
      return
    }
    showSpinner()
    try {
      const res = await customTrainingFetch<{
        status: number
        data: Blob & { message?: string }
      }>("/api/student-result/export-bang-diem-ngan-dai-han", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: data.map((item) => item.id) }),
      })
      if (res.status === 200 && res.data instanceof Blob) {
        saveAs(res.data, "BangDiemNganHan,DaiHan.xlsx")
      } else {
        message.error(res.data?.message || "Xuất file thất bại")
      }
    } catch {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        {[
          fixedClass?.trainingCourse?.trainingObjectType?.name,
          fixedClass?.trainingCourse?.name,
          fixedClass?.curriculumVersion?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name,
        ]
          .filter(Boolean)
          .join(" - ")}
      </Divider>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[16, 0]} align="middle" justify="space-between">
            {/* Chú thích màu cán bộ lớp */}
            <Col flex="auto">
              <Flex gap={24} wrap align="center" className="px-1">
                {canBoRoles.map((r) => (
                  <span key={r.label} className="inline-flex items-center gap-1.5">
                    <span className={cn("inline-block h-4 w-4 shrink-0 rounded", r.className)} />
                    <span className="leading-4">{r.label}</span>
                  </span>
                ))}
              </Flex>
            </Col>

            {/* Hàng chứa các button */}
            <Col flex="none">
              <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: "CTTK dài hạn",
                        key: "CTTK-dai-han",
                        onClick: async () => await handleExportCtdt("cttk-dai-han"),
                      },
                      {
                        label: "CTTK ngắn hạn",
                        key: "CTTK-ngan-han",
                        onClick: async () => await handleExportCtdt("cttk-ngan-han"),
                      },
                      {
                        label: "KHTK định hướng nghiên cứu",
                        key: "KHTK-ding-huong-nghien-cuu",
                        onClick: async () => await handleExportCtdt("khtk-nghien-cuu"),
                      },
                      {
                        label: "KHTK định hướng ứng dụng",
                        key: "KHTK-ding-huong-ung-dung",
                        onClick: async () => await handleExportCtdt("khtk-ung-dung"),
                      },
                    ],
                  }}
                >
                  <Button type="primary">Xuất mẫu</Button>
                </Dropdown>
                <Popconfirm
                  title="Xác nhận xóa dữ liệu?"
                  description="Bạn có chắc chắn muốn xoá những sinh viên đã chọn ra khỏi lớp này không?"
                  open={open}
                  onConfirm={handleDeleteMulti}
                  onCancel={handleCancel}
                >
                  <Button
                    disabled={selectedRowKeys?.length <= 0}
                    onClick={showPopconfirm}
                    type="primary"
                  >
                    {selectedRowKeys?.length > 0 && <span>({selectedRowKeys?.length})</span>}
                    Xoá SV khỏi lớp
                  </Button>
                </Popconfirm>
                <ExportStudentInFixedClass
                  data={data}
                  fixedClassName={`${fixedClass?.name}_${fixedClass?.trainingCourse?.name}`}
                />

                <Button onClick={handleModalPrint} type="primary">
                  In danh sách
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: "Bảng điểm quá trình",
                        key: "export-bang-diem-qua-trinh",
                        onClick: async () => await handleExportQuaTrinh(),
                      },
                      {
                        label: "Bảng điểm cá nhân",
                        key: "export-bang-diem-ca-nhan",
                        onClick: async () => await handleExportCaNhan(),
                      },
                      {
                        label: "Bảng điểm ngắn hạn, dài hạn",
                        key: "export-bang-diem-ngan-han-dai-han",
                        onClick: async () => await handleExportBangDiem(),
                      },
                      {
                        label: "Bảng điểm theo lớp, kết quả đào tạo toàn khoá",
                        key: "export-bang-diem-theo-lop-ket-qua-dao-tao-toan-khoa",
                        onClick: async () => await handleExportDiemLop(),
                      },
                    ],
                  }}
                >
                  <Button type="primary" icon={<DownloadOutlined />}>
                    Xuất bảng điểm
                  </Button>
                </Dropdown>

                <Button onClick={() => onOpenGanCanBo({ id: fixedClassId })} type="primary">
                  Cán bộ lớp
                </Button>

                <Tooltip title="Thêm Học viên/Sinh viên">
                  <Button onClick={handleModal} type="primary">
                    Thêm HV/SV
                  </Button>
                </Tooltip>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            rowClassName={(record: any) => roleByStudentId[record.id] ?? ""}
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
            }}
            filters={filters}
            setFilters={setFilters}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã định danh",
                dataIndex: "code",
                fixed: "left",
                width: 100,
                align: "center",
                type: "input",
                render: (__, record) => record.userProfile?.code ?? "",
              },
              {
                title: "Họ và tên",
                width: 150,
                fixed: "left",
                align: "left",
                type: "input",
                dataIndex: "name",
                render: (__, record) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 100,
                dataIndex: "dateOfBirth",
                type: "date",
                render: (__, record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 100,
                type: "select",
                dataIndex: "gender",
                options: genderData.map((i) => ({
                  label: i.sTen,
                  value: i.Id,
                })),
                render: (__, record) => record?.userProfile?.gender?.sTen,
              },
              {
                title: "CCCD",
                align: "center",
                width: 100,
                dataIndex: "idCardNumber",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.idCardNumber ? record.userProfile?.idCardNumber : "",
              },
              {
                title: "SĐT",
                align: "center",
                width: 100,
                dataIndex: "phone",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.phoneNumber ? record.userProfile?.phoneNumber : "",
              },
              {
                title: "Cấp bậc",
                align: "center",
                width: 120,
                dataIndex: "rank",
                type: "input",
                render: (__, record) => {
                  return record.userProfile?.rank?.sTen
                },
              },
              {
                title: "Ngành",
                width: 150,
                align: "center",
                type: "select",
                dataIndex: "trainingField",
                options: trainingFieldData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name ||
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                      ?.name ||
                    ""
                  )
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                type: "select",
                dataIndex: "trainingMajors",
                options: trainingMajorData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                    ""
                  )
                },
              },
              {
                title: "Chương trình đào tạo",
                width: 250,
                align: "center",
                dataIndex: "curriculumVersion",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum =
                    record.curriculumVersion || record.fixedClass?.curriculumVersion
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "CTĐT song song",
                width: 200,
                align: "center",
                dataIndex: "curriculumVersionParallel",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum = record.curriculumVersionParallel
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "KQHT (TBHK - TBTL)",
                width: 140,
                align: "center",
                dataIndex: "studentSemesterResult",
                render: (__, record) => {
                  return record.studentSemesterResult?.length ? (
                    <TextTruncate
                      arr={record.studentSemesterResult.map(
                        (
                          r: StudentSemesterResult & {
                            semester: Semester
                          }
                        ) => {
                          return {
                            key: r?.id,
                            label: `${r.semester.code}: ${r.gpaBase10} - ${r.cumulativeGpaBase10}`,
                          }
                        }
                      )}
                      key="studentSemesterResult"
                    />
                  ) : (
                    ""
                  )
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                type: "select",
                dataIndex: "status",
                options: Object.entries(FIXED_CLASS_STUDENT_STATUS).map(([value, item]) => ({
                  label: item.label,
                  value,
                })),
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ]
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Kết quả học tập">
                      <BookCheckIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                              "[id]",
                              id
                            )
                          )
                        }}
                        size={16}
                      />
                    </Tooltip>
                    <Tooltip title="Chuẩn đầu ra">
                      <SafetyCertificateOutlined onClick={() => onOpenStandardOutput(id)} />
                    </Tooltip>
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDelete(id),
                      }}
                    />
                  </Row>
                ),
              },
            ]}
            data={data}
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

StudentFixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục" },
        {
          title: "Lớp quản lý",
          href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
        },
        { title: "Chi tiết lớp quản lý" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
