import React, { useState, useMemo, useEffect } from "react"
import { DatePicker, Tabs, Tag, Input } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { dayjs } from "@workspace/ui"
import { useFindManyClassSchedule, useFindManyRoom } from "@workspace/db/hooks"
import { PERIOD } from "@workspace/ui"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"

import type {
  ClassSchedule,
  Room,
  Lecturer,
  UserProfile,
  SubjectClass,
  Subject,
  FixedClass,
} from "@workspace/db/client"

const { TabPane } = Tabs

export default function ThongKeBuoiHoc() {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [now, setNow] = useState<dayjs.Dayjs>(dayjs())
  const [searchRoom, setSearchRoom] = useState<string>("")
  const [searchClass, setSearchClass] = useState<string>("")
  const [searchLecturer, setSearchLecturer] = useState<string>("")

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const startOfDay = selectedDate.startOf("day").toDate()
  const endOfDay = selectedDate.endOf("day").toDate()

  const { data: classSchedules = [] } = useFindManyClassSchedule({
    where: {
      classDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      active: true,
      deletedAt: null,
    },
    include: {
      room: true,
      lecturer: {
        include: {
          organization: true,
          userProfile: true,
        },
      },
      subjectClass: {
        include: {
          room: true,
          mainLecturer: {
            include: {
              organization: true,
              userProfile: true,
            },
          },
          subject: {
            include: {
              managementOrganization: true,
            },
          },
          fixedClasses: true,
        },
      },
    },
  })

  type ClassScheduleData = (typeof classSchedules)[number]

  const { data: rooms = [] } = useFindManyRoom({
    where: {
      active: true,
      deletedAt: null,
    },
  })

  const getScheduleStatus = (schedule: ClassScheduleData) => {
    const startPeriodObj = PERIOD[schedule.startPeriod as keyof typeof PERIOD]
    const endPeriodObj = PERIOD[schedule.endPeriod as keyof typeof PERIOD]

    if (!startPeriodObj || !endPeriodObj)
      return { code: "UNKNOWN", label: "Không xác định", color: "gray" }

    const todayStr = dayjs(schedule.classDate).format("YYYY-MM-DD")
    const startTime = dayjs(`${todayStr} ${dayjs(startPeriodObj.startTime).format("HH:mm:ss")}`)
    const endTime = dayjs(`${todayStr} ${dayjs(endPeriodObj.endTime).format("HH:mm:ss")}`)

    if (now.isBefore(startTime)) {
      return { code: "UPCOMING", label: "Sắp diễn ra", color: "blue" }
    } else if (now.isAfter(endTime)) {
      return { code: "FINISHED", label: "Đã kết thúc", color: "default" }
    } else {
      return { code: "ONGOING", label: "Đang diễn ra", color: "success" }
    }
  }

  const getShift = (startPeriod: number) => {
    if (startPeriod <= 6) return "Sáng"
    if (startPeriod <= 12) return "Chiều"
    return "Tối"
  }

  const getSharedClasses = (fixedClasses: FixedClass[] = []) => {
    if (fixedClasses.length <= 1) return ""
    return fixedClasses.map((fc) => fc.code || fc.name).join(", ")
  }

  const colStt = {
    title: "STT",
    width: 50,
    align: "center" as const,
    render: (_: unknown, __: unknown, index: number) => index + 1,
  }

  const colMaPhong = {
    title: "Mã phòng",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.room?.name || item.subjectClass?.room?.name || "-"
    },
  }

  const colTenPhong = {
    title: "Tên phòng",
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      const pName = item.room?.name || item.subjectClass?.room?.name
      return pName ? `Phòng ${pName}` : "-"
    },
  }

  const colMaMon = {
    title: "Mã môn",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.subjectClass?.subject?.code || "-"
    },
  }

  const colTenMon = {
    title: "Tên môn",
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.subjectClass?.subject?.name || "-"
    },
  }

  const colMaLop = {
    title: "Mã lớp",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.subjectClass?.fixedClasses?.map((fc: FixedClass) => fc.code).join(", ") || "-"
    },
  }

  const colTenLop = {
    title: "Tên lớp",
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.subjectClass?.fixedClasses?.map((fc: FixedClass) => fc.name).join(", ") || "-"
    },
  }

  const colQuanSo = {
    title: "Quân số",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.subjectClass?.maxStudent ?? "-"
    },
  }

  const colMaGv = {
    title: "Mã GV",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return (
        item.lecturer?.userProfile?.code ||
        item.subjectClass?.mainLecturer?.userProfile?.code ||
        "-"
      )
    },
  }

  const colTenGv = {
    title: "Tên GV",
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return (
        item.lecturer?.userProfile?.fullname ||
        item.subjectClass?.mainLecturer?.userProfile?.fullname ||
        "-"
      )
    },
  }

  const colHtHoc = {
    title: "HT học",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return item.periodType || "-"
    },
  }

  const colNgay = {
    title: "Ngày",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return dayjs(item.classDate).format("DD/MM/YYYY")
    },
  }

  const colCaHoc = {
    title: "Ca học",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return getShift(item.startPeriod)
    },
  }

  const colHocTu = {
    title: "Học từ",
    align: "center" as const,
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return `${item.startPeriod}-${item.endPeriod}`
    },
  }

  const colHocChung = {
    title: "Học chung với lớp",
    render: (_: unknown, record: unknown) => {
      const item = record as ClassScheduleData
      return getSharedClasses(item.subjectClass?.fixedClasses)
    },
  }

  const classesColumns = [
    colStt,
    colMaLop,
    colTenLop,
    colQuanSo,
    colMaMon,
    colTenMon,
    colMaGv,
    colTenGv,
    colMaPhong,
    colTenPhong,
    colHtHoc,
    colNgay,
    colCaHoc,
    colHocTu,
    colHocChung,
  ]

  const lecturersColumns = [
    colStt,
    colMaGv,
    colTenGv,
    colMaMon,
    colTenMon,
    colMaLop,
    colTenLop,
    colQuanSo,
    colMaPhong,
    colTenPhong,
    colHtHoc,
    colNgay,
    colCaHoc,
    colHocTu,
    colHocChung,
  ]

  const roomsColumns = [
    colStt,
    colMaPhong,
    colTenPhong,
    colMaMon,
    colTenMon,
    colMaLop,
    colTenLop,
    colQuanSo,
    colMaGv,
    colTenGv,
    colHtHoc,
    colNgay,
    colCaHoc,
    colHocTu,
    colHocChung,
  ]

  const schedulesData = classSchedules as unknown as ClassScheduleData[]

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-semibold text-gray-500 text-sm">Chọn thời gian</span>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          format="DD/MM/YYYY"
          allowClear={false}
          className="w-64"
        />
      </div>
      <Tabs defaultActiveKey="classes">
        <TabPane tab="Lớp đang có lịch học" key="classes">
          <div className="mb-3">
            <Input
              placeholder="Tìm kiếm lớp môn học, mã lớp, giảng viên, môn học..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
          <Table
            data={schedulesData
              .filter((s: ClassScheduleData) => {
                if (!searchClass.trim()) return true
                const kw = searchClass.toLowerCase()
                const className = s.subjectClass?.name?.toLowerCase() || ""
                const classCode = s.subjectClass?.code?.toLowerCase() || ""
                const subjectName = s.subjectClass?.subject?.name?.toLowerCase() || ""
                const lecturerName = (
                  s.lecturer?.userProfile?.fullname ||
                  s.subjectClass?.mainLecturer?.userProfile?.fullname ||
                  ""
                ).toLowerCase()
                const roomName = (s.room?.name || s.subjectClass?.room?.name || "").toLowerCase()
                const orgName = (
                  s.subjectClass?.subject?.managementOrganization?.sTen || ""
                ).toLowerCase()
                const period = `tiết ${s.startPeriod} - ${s.endPeriod}`.toLowerCase()
                return (
                  className.includes(kw) ||
                  classCode.includes(kw) ||
                  subjectName.includes(kw) ||
                  lecturerName.includes(kw) ||
                  roomName.includes(kw) ||
                  orgName.includes(kw) ||
                  period.includes(kw)
                )
              })
              .map((s: ClassScheduleData, idx: number) => ({ ...s, key: s.id || idx.toString() }))}
            pagination={false}
            columns={classesColumns}
          />
        </TabPane>
        <TabPane tab="Giảng viên đang có lịch dạy" key="lecturers">
          <div className="mb-3">
            <Input
              placeholder="Tìm kiếm giảng viên, lớp môn học, địa điểm..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={searchLecturer}
              onChange={(e) => setSearchLecturer(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
          <Table
            data={schedulesData
              .filter((s: ClassScheduleData) => {
                if (!searchLecturer.trim()) return true
                const kw = searchLecturer.toLowerCase()
                const lecturerName = (
                  s.lecturer?.userProfile?.fullname ||
                  s.subjectClass?.mainLecturer?.userProfile?.fullname ||
                  ""
                ).toLowerCase()
                const orgName = (
                  s.lecturer?.organization?.sTen ||
                  s.subjectClass?.mainLecturer?.organization?.sTen ||
                  ""
                ).toLowerCase()
                const className = s.subjectClass?.name?.toLowerCase() || ""
                const classCode = s.subjectClass?.code?.toLowerCase() || ""
                const roomName = (s.room?.name || s.subjectClass?.room?.name || "").toLowerCase()
                const period = `tiết ${s.startPeriod} - ${s.endPeriod}`.toLowerCase()
                return (
                  lecturerName.includes(kw) ||
                  orgName.includes(kw) ||
                  className.includes(kw) ||
                  classCode.includes(kw) ||
                  roomName.includes(kw) ||
                  period.includes(kw)
                )
              })
              .map((s: ClassScheduleData, idx: number) => ({ ...s, key: s.id || idx.toString() }))}
            pagination={false}
            columns={lecturersColumns}
          />
        </TabPane>
        <TabPane tab="Phòng học đang có lịch sử dụng" key="rooms">
          <div className="mb-3">
            <Input
              placeholder="Tìm kiếm phòng học, lớp môn học, giảng viên..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
          <Table
            data={schedulesData
              .filter((s: ClassScheduleData) => {
                // Chỉ lấy các phòng đang có lịch dạy hoạt động
                const rId = s.roomId || s.subjectClass?.roomId
                return !!rId
              })
              .filter((s: ClassScheduleData) => {
                if (!searchRoom.trim()) return true
                const kw = searchRoom.toLowerCase()
                const roomName = (s.room?.name || s.subjectClass?.room?.name || "").toLowerCase()
                const className = s.subjectClass?.name?.toLowerCase() || ""
                const lecturerName = (
                  s.lecturer?.userProfile?.fullname ||
                  s.subjectClass?.mainLecturer?.userProfile?.fullname ||
                  ""
                ).toLowerCase()
                return roomName.includes(kw) || className.includes(kw) || lecturerName.includes(kw)
              })
              .map((s: ClassScheduleData, idx: number) => ({ ...s, key: s.id || idx.toString() }))
              .sort((a: ClassScheduleData, b: ClassScheduleData) => {
                const aName = a.room?.name || a.subjectClass?.room?.name || ""
                const bName = b.room?.name || b.subjectClass?.room?.name || ""
                return aName.localeCompare(bName)
              })}
            pagination={false}
            columns={roomsColumns}
          />
        </TabPane>
      </Tabs>
    </div>
  )
}
