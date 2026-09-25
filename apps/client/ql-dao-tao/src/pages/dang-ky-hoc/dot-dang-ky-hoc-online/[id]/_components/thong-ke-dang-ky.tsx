import { Column, Pie } from "@ant-design/plots"
import { useClassRegisterStatus } from "@hooks/classRegisterStatus"
import useSpinner from "@hooks/spinner"
import { ClassRegisterStatus } from "@workspace/db"
import {
  useFindManyClassRegisterLogs,
  useFindManyStudent,
  useFindUniqueClassRegisterSession,
} from "@workspace/db/hooks"
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Flex,
  Progress,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import {
  BookOpen,
  ClipboardList,
  Download,
  Layers,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"

type Props = {
  sessionId: string
}

type LogRow = {
  id: string
  status: ClassRegisterStatus
  createdAt: Date | string
  studentId: string
  subjectClassId: string
  student?: {
    id: string
    fixedClass?: {
      id: string
      code: string
      name: string
    } | null
    userProfile?: {
      code?: string | null
      fullname?: string | null
      lastName?: string | null
      firstName?: string | null
      dateOfBirth?: Date | string | null
    } | null
  } | null
  subjectClass?: {
    id: string
    code: string
    name: string
    maxStudent: number
    subjectId: string
    subject?: {
      id: string
      code: string | null
      name: string
      credit?: number
    } | null
  } | null
}

function studentName(s?: {
  userProfile?: {
    fullname?: string | null
    lastName?: string | null
    firstName?: string | null
  } | null
} | null) {
  if (!s?.userProfile) return ""
  return (
    s.userProfile.fullname ||
    [s.userProfile.lastName, s.userProfile.firstName].filter(Boolean).join(" ") ||
    ""
  )
}

function StatCard({
  title,
  value,
  sub,
  icon,
  accent = "#028850",
}: {
  title: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <Card size="small" className="h-full shadow-sm" bodyStyle={{ padding: 16 }}>
      <Flex justify="space-between" align="flex-start" gap={12}>
        <div className="min-w-0">
          <div className="text-gray-500 text-sm mb-1">{title}</div>
          <div className="text-2xl font-semibold" style={{ color: accent }}>
            {value}
          </div>
          {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
        </div>
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      </Flex>
    </Card>
  )
}

export default function ThongKeDangKy({ sessionId }: Props) {
  const { showSpinner, hideSpinner } = useSpinner()
  const { getClassRegisterStatusLabel, getClassRegisterStatusColor, classRegisterStatusOptions } =
    useClassRegisterStatus()
  const [detailTab, setDetailTab] = useState("sv-da-dk")

  const { data: session } = useFindUniqueClassRegisterSession(
    {
      where: { id: sessionId },
      include: {
        trainingCourses: true,
        semester: { include: { schoolYear: true } },
      },
    },
    { enabled: !!sessionId }
  )

  const trainingCourseIds = useMemo(
    () => session?.trainingCourses?.map((c) => c.id) || [],
    [session?.trainingCourses]
  )

  const { data: logs = [], isLoading: loadingLogs } = useFindManyClassRegisterLogs(
    {
      where: {
        classRegisterSessionId: sessionId,
        deletedAt: null,
      },
      include: {
        student: { include: { userProfile: true, fixedClass: true } },
        subjectClass: { include: { subject: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20000,
    },
    { enabled: !!sessionId }
  )

  const { data: courseStudents = [], isLoading: loadingStudents } = useFindManyStudent(
    {
      where: {
        deletedAt: null,
        fixedClass: {
          trainingCourseId: { in: trainingCourseIds },
        },
      },
      include: {
        userProfile: true,
        fixedClass: true,
      },
      orderBy: { userProfile: { code: "asc" } },
      take: 20000,
    },
    { enabled: trainingCourseIds.length > 0 }
  )

  const typedLogs = logs as unknown as LogRow[]

  const stats = useMemo(() => {
    const registeredStudentIds = new Set(typedLogs.map((l) => l.studentId))
    const subjectClassMap = new Map<
      string,
      {
        id: string
        code: string
        name: string
        maxStudent: number
        subjectId: string
        subjectCode: string
        subjectName: string
        count: number
        studentIds: Set<string>
      }
    >()
    const subjectMap = new Map<
      string,
      {
        id: string
        code: string
        name: string
        classIds: Set<string>
        count: number
        studentIds: Set<string>
      }
    >()
    const statusCount = new Map<ClassRegisterStatus, number>()
    const studentRegMap = new Map<
      string,
      {
        studentId: string
        code: string
        name: string
        dateOfBirth: Date | string | null
        fixedClassCode: string
        totalCredits: number
        classes: { code: string; name: string }[]
        logCount: number
      }
    >()

    for (const log of typedLogs) {
      statusCount.set(log.status, (statusCount.get(log.status) || 0) + 1)

      const sc = log.subjectClass
      if (sc) {
        const existing = subjectClassMap.get(sc.id)
        if (existing) {
          existing.count += 1
          existing.studentIds.add(log.studentId)
        } else {
          subjectClassMap.set(sc.id, {
            id: sc.id,
            code: sc.code,
            name: sc.name,
            maxStudent: sc.maxStudent,
            subjectId: sc.subjectId,
            subjectCode: sc.subject?.code || "",
            subjectName: sc.subject?.name || "",
            count: 1,
            studentIds: new Set([log.studentId]),
          })
        }

        const subjectId = sc.subject?.id || sc.subjectId
        const subjectExisting = subjectMap.get(subjectId)
        if (subjectExisting) {
          subjectExisting.count += 1
          subjectExisting.classIds.add(sc.id)
          subjectExisting.studentIds.add(log.studentId)
        } else {
          subjectMap.set(subjectId, {
            id: subjectId,
            code: sc.subject?.code || "",
            name: sc.subject?.name || sc.name,
            classIds: new Set([sc.id]),
            count: 1,
            studentIds: new Set([log.studentId]),
          })
        }
      }

      const st = log.student
      if (st) {
        const existingSt = studentRegMap.get(st.id)
        const classInfo = {
          code: sc?.code || "",
          name: sc?.name || "",
        }
        const credit = sc?.subject?.credit || 0
        if (existingSt) {
          existingSt.logCount += 1
          if (!existingSt.classes.some((c) => c.code === classInfo.code && c.name === classInfo.name)) {
            existingSt.classes.push(classInfo)
            existingSt.totalCredits += credit
          }
        } else {
          studentRegMap.set(st.id, {
            studentId: st.id,
            code: st.userProfile?.code || "",
            name: studentName(st),
            dateOfBirth: st.userProfile?.dateOfBirth || null,
            fixedClassCode: st.fixedClass?.code || "",
            totalCredits: credit,
            classes: [classInfo],
            logCount: 1,
          })
        }
      }
    }

    const registeredStudents = Array.from(studentRegMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    )
    const registeredIdSet = new Set(registeredStudents.map((s) => s.studentId))
    const notRegisteredStudents = courseStudents
      .filter((s) => !registeredIdSet.has(s.id))
      .map((s) => ({
        studentId: s.id,
        code: s.userProfile?.code || "",
        name: studentName(s),
        fixedClassCode: s.fixedClass?.code || "",
      }))
      .sort((a, b) => a.code.localeCompare(b.code))

    // Also include registered students not in courseStudents list (edge cases)
    const totalCourseStudents = courseStudents.length
    const registeredInCourse = courseStudents.filter((s) => registeredStudentIds.has(s.id)).length

    const subjectClassRows = Array.from(subjectClassMap.values())
      .map((r) => ({
        ...r,
        studentCount: r.studentIds.size,
        fillRate: r.maxStudent > 0 ? Math.round((r.studentIds.size / r.maxStudent) * 100) : 0,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)

    const subjectRows = Array.from(subjectMap.values())
      .map((r) => ({
        ...r,
        classCount: r.classIds.size,
        studentCount: r.studentIds.size,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)

    const statusRows = classRegisterStatusOptions.map((opt) => ({
      type: opt.label,
      value: statusCount.get(opt.value) || 0,
      status: opt.value,
    }))

    return {
      totalLogs: typedLogs.length,
      totalSubjects: subjectMap.size,
      totalSubjectClasses: subjectClassMap.size,
      totalCourseStudents,
      registeredStudentsCount: registeredStudentIds.size,
      registeredInCourse,
      notRegisteredCount: Math.max(totalCourseStudents - registeredInCourse, 0),
      registeredRate:
        totalCourseStudents > 0
          ? Math.round((registeredInCourse / totalCourseStudents) * 100)
          : 0,
      registeredStudents,
      notRegisteredStudents,
      subjectClassRows,
      subjectRows,
      statusRows,
      pieRegisterData: [
        { type: "Đã đăng ký", value: registeredInCourse },
        { type: "Chưa đăng ký", value: Math.max(totalCourseStudents - registeredInCourse, 0) },
      ],
      barClassData: subjectClassRows.slice(0, 15).map((r) => ({
        label: r.code,
        value: r.studentCount,
        fullName: `${r.code} - ${r.name}`,
      })),
      barSubjectData: subjectRows.slice(0, 15).map((r) => ({
        label: r.code || r.name.slice(0, 12),
        value: r.studentCount,
        fullName: `${r.code || ""} - ${r.name}`.replace(/^\s-\s/, ""),
      })),
    }
  }, [typedLogs, courseStudents, classRegisterStatusOptions])

  const loading = loadingLogs || loadingStudents

  async function exportExcel(kind: "full" | "registered" | "not-registered" | "classes" | "subjects") {
    try {
      showSpinner()
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "QL Đào tạo"
      const sessionTitle = [session?.name, session?.semester?.name, session?.semester?.schoolYear?.name]
        .filter(Boolean)
        .join(" - ")

      const styleHeader = (ws: ExcelJS.Worksheet, colCount: number) => {
        const row = ws.getRow(1)
        for (let i = 1; i <= colCount; i++) {
          const cell = row.getCell(i)
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF028850" },
          }
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        }
        row.height = 24
      }

      if (kind === "full" || kind === "registered" || kind === "not-registered") {
        if (kind === "full") {
          const wsSummary = workbook.addWorksheet("Tong hop")
          wsSummary.addRows([
            ["Thống kê đăng ký học"],
            ["Đợt", sessionTitle],
            ["Khóa", session?.trainingCourses?.map((c) => c.name).join(", ") || ""],
            [],
            ["Chỉ số", "Giá trị"],
            ["Tổng SV khóa", stats.totalCourseStudents],
            ["SV đã đăng ký", stats.registeredInCourse],
            ["SV chưa đăng ký", stats.notRegisteredCount],
            ["Tỷ lệ đăng ký (%)", stats.registeredRate],
            ["Tổng môn học có ĐK", stats.totalSubjects],
            ["Tổng lớp môn học có ĐK", stats.totalSubjectClasses],
            ["Tổng đơn đăng ký", stats.totalLogs],
          ])
          wsSummary.getColumn(1).width = 28
          wsSummary.getColumn(2).width = 50
        }

        if (kind === "full" || kind === "registered") {
          const ws = workbook.addWorksheet("SV da dang ky")
          ws.addRow([
            "STT",
            "Mã SV",
            "Họ và tên",
            "Ngày sinh",
            "Lớp quản lý",
            "Số đơn ĐK",
            "Số lớp ĐK",
            "Tổng số tín chỉ",
            "Danh sách lớp môn học",
          ])
          styleHeader(ws, 9)
          stats.registeredStudents.forEach((s, idx) => {
            ws.addRow([
              idx + 1,
              s.code,
              s.name,
              s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("vi-VN") : "",
              s.fixedClassCode,
              s.logCount,
              s.classes.length,
              s.totalCredits,
              s.classes.map((c) => `${c.code} - ${c.name}`).join("; "),
            ])
          })
          ;[8, 14, 28, 14, 16, 12, 12, 16, 80].forEach((w, i) => {
            ws.getColumn(i + 1).width = w
          })
        }

        if (kind === "full" || kind === "not-registered") {
          const ws = workbook.addWorksheet("SV chua dang ky")
          ws.addRow(["STT", "Mã SV", "Họ và tên", "Lớp quản lý"])
          styleHeader(ws, 4)
          stats.notRegisteredStudents.forEach((s, idx) => {
            ws.addRow([idx + 1, s.code, s.name, s.fixedClassCode])
          })
          ;[8, 14, 28, 16].forEach((w, i) => {
            ws.getColumn(i + 1).width = w
          })
        }
      }

      if (kind === "full" || kind === "subjects") {
        const ws = workbook.addWorksheet("Theo mon hoc")
        ws.addRow([
          "STT",
          "Mã MH",
          "Tên môn học",
          "Số lớp MH",
          "Số đơn ĐK",
          "Số SV ĐK",
        ])
        styleHeader(ws, 6)
        stats.subjectRows.forEach((r, idx) => {
          ws.addRow([idx + 1, r.code, r.name, r.classCount, r.count, r.studentCount])
        })
        ;[8, 12, 40, 12, 12, 12].forEach((w, i) => {
          ws.getColumn(i + 1).width = w
        })
      }

      if (kind === "full" || kind === "classes") {
        const ws = workbook.addWorksheet("Theo lop mon hoc")
        ws.addRow([
          "STT",
          "Mã LMH",
          "Tên lớp môn học",
          "Mã MH",
          "Tên môn học",
          "Sĩ số max",
          "Số đơn ĐK",
          "Số SV ĐK",
          "Tỷ lệ (%)",
        ])
        styleHeader(ws, 9)
        stats.subjectClassRows.forEach((r, idx) => {
          ws.addRow([
            idx + 1,
            r.code,
            r.name,
            r.subjectCode,
            r.subjectName,
            r.maxStudent,
            r.count,
            r.studentCount,
            r.fillRate,
          ])
        })
        ;[8, 12, 36, 12, 36, 12, 12, 12, 12].forEach((w, i) => {
          ws.getColumn(i + 1).width = w
        })
      }

      if (kind === "full") {
        const ws = workbook.addWorksheet("Chi tiet don")
        ws.addRow([
          "STT",
          "Mã SV",
          "Họ và tên",
          "Mã LMH",
          "Lớp môn học",
          "Môn học",
          "Trạng thái",
          "Thời gian ĐK",
        ])
        styleHeader(ws, 8)
        typedLogs.forEach((l, idx) => {
          ws.addRow([
            idx + 1,
            l.student?.userProfile?.code || "",
            studentName(l.student),
            l.subjectClass?.code || "",
            l.subjectClass?.name || "",
            l.subjectClass?.subject?.name || "",
            getClassRegisterStatusLabel(l.status),
            l.createdAt ? new Date(l.createdAt).toLocaleString("vi-VN") : "",
          ])
        })
        ;[8, 14, 28, 12, 36, 36, 16, 20].forEach((w, i) => {
          ws.getColumn(i + 1).width = w
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const suffix =
        kind === "full"
          ? "tong_hop"
          : kind === "registered"
            ? "sv_da_dang_ky"
            : kind === "not-registered"
              ? "sv_chua_dang_ky"
              : kind === "subjects"
                ? "theo_mon_hoc"
                : "theo_lop_mon_hoc"
      saveAs(
        new Blob([buffer]),
        `Thong_ke_dang_ky_hoc_${suffix}_${session?.code || sessionId}.xlsx`
      )
      message.success("Đã xuất file thống kê")
    } catch (error: any) {
      message.error(error?.message || "Xuất file thất bại")
    } finally {
      hideSpinner()
    }
  }

  if (!sessionId) return <Empty description="Không tìm thấy đợt đăng ký" />

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Flex justify="space-between" align="center" wrap gap={8}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Thống kê đăng ký học
            </Typography.Title>
            <Typography.Text type="secondary">
              Khóa: {session?.trainingCourses?.map((c) => c.name).join(", ") || "—"}
            </Typography.Text>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: "full",
                  label: "Xuất thống kê tổng hợp (đầy đủ)",
                  onClick: () => exportExcel("full"),
                },
                {
                  key: "registered",
                  label: "Xuất SV đã đăng ký",
                  onClick: () => exportExcel("registered"),
                },
                {
                  key: "not-registered",
                  label: "Xuất SV chưa đăng ký",
                  onClick: () => exportExcel("not-registered"),
                },
                {
                  key: "subjects",
                  label: "Xuất theo môn học",
                  onClick: () => exportExcel("subjects"),
                },
                {
                  key: "classes",
                  label: "Xuất theo lớp môn học",
                  onClick: () => exportExcel("classes"),
                },
              ],
            }}
          >
            <Button type="primary" icon={<Download size={14} />}>
              Xuất file thống kê
            </Button>
          </Dropdown>
        </Flex>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="SV đăng ký / Tổng SV khóa"
          value={`${stats.registeredInCourse}/${stats.totalCourseStudents}`}
          sub={
            <Progress
              percent={stats.registeredRate}
              size="small"
              strokeColor="#028850"
              format={(p) => `${p}%`}
            />
          }
          icon={<Users size={20} />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Tổng môn học"
          value={stats.totalSubjects}
          sub={`${stats.totalSubjectClasses} lớp môn học`}
          icon={<BookOpen size={20} />}
          accent="#1677ff"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Tổng lớp môn học"
          value={stats.totalSubjectClasses}
          sub="Có phát sinh đăng ký"
          icon={<Layers size={20} />}
          accent="#722ed1"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Tổng đơn đăng ký"
          value={stats.totalLogs}
          sub={
            <Space size={4} wrap>
              <Tag color="success" icon={<UserCheck size={12} />}>
                Đã ĐK: {stats.registeredInCourse}
              </Tag>
              <Tag color="default" icon={<UserX size={12} />}>
                Chưa ĐK: {stats.notRegisteredCount}
              </Tag>
            </Space>
          }
          icon={<ClipboardList size={20} />}
          accent="#d48806"
        />
      </Col>

      <Col xs={24} lg={14}>
        <Card
          size="small"
          title="Top lớp môn học theo số SV đăng ký"
          loading={loading}
          styles={{ body: { paddingBottom: 8 } }}
        >
          {stats.barClassData.length ? (
            <div className="thong-ke-chart-wrap w-full min-h-[320px]">
              <Column
                autoFit
                height={320}
                data={stats.barClassData}
                xField="label"
                yField="value"
                padding={[24, 12, 64, 40]}
                columnWidthRatio={0.6}
                label={{
                  text: "value",
                  style: { fontSize: 11, fill: "#1f1f1f" },
                  position: "top",
                }}
                axis={{
                  x: {
                    labelAutoRotate: true,
                    labelAutoHide: false,
                    size: 56,
                  },
                  y: {
                    title: false,
                    grid: true,
                  },
                }}
                style={{
                  fill: "#028850",
                  maxWidth: 56,
                  radiusTopLeft: 4,
                  radiusTopRight: 4,
                }}
                tooltip={{
                  title: (d: { fullName?: string; label?: string }) => d.fullName || d.label,
                }}
              />
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu đăng ký" />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card size="small" title="Tỷ lệ SV đăng ký" loading={loading}>
          {stats.totalCourseStudents > 0 ? (
            <Pie
              height={320}
              data={stats.pieRegisterData}
              angleField="value"
              colorField="type"
              scale={{
                color: {
                  range: ["#028850", "#8c8c8c"],
                },
              }}
              label={{
                text: (d: { type: string; value: number }) =>
                  `${d.type}: ${d.value} (${Math.round(
                    (d.value / Math.max(stats.totalCourseStudents, 1)) * 100
                  )}%)`,
                position: "outside",
                connector: true,
                style: {
                  fill: "#1f1f1f",
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
              legend={{ position: "bottom" }}
              innerRadius={0.55}
            />
          ) : (
            <Empty description="Chưa có dữ liệu khóa" />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          size="small"
          title="Top môn học theo số SV"
          loading={loading}
          styles={{ body: { paddingBottom: 8 } }}
        >
          {stats.barSubjectData.length ? (
            <div className="thong-ke-chart-wrap w-full min-h-[280px]">
              <Column
                autoFit
                height={280}
                data={stats.barSubjectData}
                xField="label"
                yField="value"
                padding={[24, 12, 56, 40]}
                columnWidthRatio={0.6}
                label={{
                  text: "value",
                  style: { fontSize: 11, fill: "#1f1f1f" },
                  position: "top",
                }}
                axis={{
                  x: {
                    labelAutoRotate: true,
                    labelAutoHide: false,
                    size: 48,
                  },
                }}
                style={{
                  fill: "#1677ff",
                  maxWidth: 56,
                  radiusTopLeft: 4,
                  radiusTopRight: 4,
                }}
                tooltip={{
                  title: (d: { fullName?: string; label?: string }) => d.fullName || d.label,
                }}
              />
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu" />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title="Trạng thái đơn đăng ký" loading={loading}>
          {stats.totalLogs > 0 ? (
            <Pie
              height={280}
              data={stats.statusRows.filter((r) => r.value > 0)}
              angleField="value"
              colorField="type"
              label={{
                text: (d: { type: string; value: number }) => `${d.type}: ${d.value}`,
                position: "outside",
                connector: true,
                style: {
                  fill: "#1f1f1f",
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
              legend={{ position: "bottom" }}
            />
          ) : (
            <Empty description="Chưa có đơn đăng ký" />
          )}
        </Card>
      </Col>

      <Col span={24}>
        <Card size="small" title="Thống kê chi tiết" loading={loading}>
          <Tabs
            activeKey={detailTab}
            onChange={setDetailTab}
            items={[
              {
                key: "sv-da-dk",
                label: `SV đã đăng ký (${stats.registeredStudents.length})`,
                children: (
                  <Table
                    size="small"
                    rowKey="studentId"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    dataSource={stats.registeredStudents}
                    scroll={{ x: 900 }}
                    columns={[
                      {
                        title: "STT",
                        width: 60,
                        align: "center",
                        render: (_, __, i) => i + 1,
                      },
                      { title: "Mã SV", dataIndex: "code", width: 120 },
                      { title: "Họ và tên", dataIndex: "name", width: 200 },
                      {
                        title: "Số lớp ĐK",
                        dataIndex: "classes",
                        width: 100,
                        align: "center",
                        render: (classes: { length: number }) => classes.length,
                      },
                      {
                        title: "Lớp môn học đã đăng ký",
                        dataIndex: "classes",
                        render: (classes: { code: string; name: string }[]) =>
                          classes.map((c) => (
                            <Tag key={`${c.code}-${c.name}`} className="mb-1">
                              {c.code} - {c.name}
                            </Tag>
                          )),
                      },
                    ]}
                  />
                ),
              },
              {
                key: "sv-chua-dk",
                label: `SV chưa đăng ký (${stats.notRegisteredStudents.length})`,
                children: (
                  <Table
                    size="small"
                    rowKey="studentId"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    dataSource={stats.notRegisteredStudents}
                    columns={[
                      {
                        title: "STT",
                        width: 60,
                        align: "center",
                        render: (_, __, i) => i + 1,
                      },
                      { title: "Mã SV", dataIndex: "code", width: 120 },
                      { title: "Họ và tên", dataIndex: "name" },
                      { title: "Lớp quản lý", dataIndex: "fixedClassCode", width: 140 },
                    ]}
                  />
                ),
              },
              {
                key: "mon-hoc",
                label: `Theo môn học (${stats.subjectRows.length})`,
                children: (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    dataSource={stats.subjectRows}
                    columns={[
                      {
                        title: "STT",
                        width: 60,
                        align: "center",
                        render: (_, __, i) => i + 1,
                      },
                      { title: "Mã MH", dataIndex: "code", width: 100 },
                      { title: "Tên môn học", dataIndex: "name" },
                      {
                        title: "Số lớp",
                        dataIndex: "classCount",
                        width: 90,
                        align: "center",
                      },
                      {
                        title: "Số đơn ĐK",
                        dataIndex: "count",
                        width: 110,
                        align: "center",
                      },
                      {
                        title: "Số SV ĐK",
                        dataIndex: "studentCount",
                        width: 100,
                        align: "center",
                      },
                    ]}
                  />
                ),
              },
              {
                key: "lop-mh",
                label: `Theo lớp MH (${stats.subjectClassRows.length})`,
                children: (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    dataSource={stats.subjectClassRows}
                    scroll={{ x: 1000 }}
                    columns={[
                      {
                        title: "STT",
                        width: 60,
                        align: "center",
                        render: (_, __, i) => i + 1,
                      },
                      { title: "Mã LMH", dataIndex: "code", width: 110 },
                      { title: "Tên lớp môn học", dataIndex: "name", width: 220 },
                      {
                        title: "Môn học",
                        width: 220,
                        render: (_, r) =>
                          [r.subjectCode, r.subjectName].filter(Boolean).join(" - "),
                      },
                      {
                        title: "Max",
                        dataIndex: "maxStudent",
                        width: 80,
                        align: "center",
                      },
                      {
                        title: "SV ĐK",
                        dataIndex: "studentCount",
                        width: 90,
                        align: "center",
                      },
                      {
                        title: "Tỷ lệ",
                        dataIndex: "fillRate",
                        width: 140,
                        render: (v: number) => (
                          <Progress
                            percent={v}
                            size="small"
                            strokeColor={v >= 90 ? "#cf1322" : "#028850"}
                          />
                        ),
                      },
                    ]}
                  />
                ),
              },
              {
                key: "trang-thai",
                label: "Theo trạng thái",
                children: (
                  <Table
                    size="small"
                    rowKey="status"
                    pagination={false}
                    dataSource={stats.statusRows}
                    columns={[
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        render: (status: ClassRegisterStatus) => (
                          <Tag color={getClassRegisterStatusColor(status)}>
                            {getClassRegisterStatusLabel(status)}
                          </Tag>
                        ),
                      },
                      {
                        title: "Số đơn",
                        dataIndex: "value",
                        align: "center",
                        width: 120,
                      },
                      {
                        title: "Tỷ lệ",
                        align: "center",
                        width: 160,
                        render: (_, r) =>
                          `${
                            stats.totalLogs
                              ? Math.round((r.value / stats.totalLogs) * 100)
                              : 0
                          }%`,
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  )
}
