import React, { useState, useMemo, useEffect } from "react"
import { DatePicker, Tabs, Tag, Input } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import { dayjs } from "@workspace/ui"
import { useFindManyClassSchedule, useFindManyRoom } from "@workspace/db/hooks"
import { PERIOD } from "@workspace/ui"
import Table from "@components/commons/table"
import TableCollapse from "@components/commons/tableCollapse"

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
        },
      },
    },
  })

  const { data: rooms = [] } = useFindManyRoom({
    where: {
      active: true,
      deletedAt: null,
    },
  })

  const getScheduleStatus = (schedule: any) => {
    const startPeriodObj = PERIOD[schedule.startPeriod as keyof typeof PERIOD]
    const endPeriodObj = PERIOD[schedule.endPeriod as keyof typeof PERIOD]

    if (!startPeriodObj || !endPeriodObj) return { code: "UNKNOWN", label: "Không xác định", color: "gray" }

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

  const groupedByOrg = useMemo(() => {
    const groups: Record<string, { id: string; name: string; schedules: any[] }> = {}
    
    for (const schedule of classSchedules) {
      const org = schedule.subjectClass?.subject?.managementOrganization
      const orgId = org?.Id || "unknown"
      const orgName = org?.sTen || "Khoa/Bộ môn khác"

      if (!groups[orgId]) {
        groups[orgId] = { id: orgId, name: orgName, schedules: [] }
      }
      groups[orgId].schedules.push({
        ...schedule,
        id: schedule.id,
      })
    }

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
  }, [classSchedules])

  const stats = useMemo(() => {
    let ongoing = 0
    let upcoming = 0
    let finished = 0
    const activeLecturerIds = new Set<string>()
    const activeRoomIds = new Set<string>()

    for (const schedule of classSchedules) {
      const status = getScheduleStatus(schedule).code
      const rId = schedule.roomId || schedule.subjectClass?.roomId
      const lId = schedule.lecturerId || schedule.subjectClass?.lecturerId
      if (status === "ONGOING") {
        ongoing++
        if (lId) activeLecturerIds.add(lId)
        if (rId) activeRoomIds.add(rId)
      } else if (status === "UPCOMING") {
        upcoming++
      } else if (status === "FINISHED") {
        finished++
      }
    }

    return {
      total: classSchedules.length,
      ongoing,
      upcoming,
      finished,
      activeRooms: activeRoomIds.size,
      activeLecturers: activeLecturerIds.size,
    }
  }, [classSchedules, now])

  const roomStatusList = useMemo(() => {
    return rooms.map((room, idx) => {
      const schedulesForRoom = classSchedules.filter((s) => {
        const rId = s.roomId || s.subjectClass?.roomId
        return rId === room.id
      })
      const currentActive = schedulesForRoom.find((s) => getScheduleStatus(s).code === "ONGOING")

      let status = "FREE"
      let statusLabel = "Trống"
      let tagColor = "default"

      if (currentActive) {
        status = "BUSY"
        statusLabel = "Đang sử dụng"
        tagColor = "error"
      } else if (schedulesForRoom.length > 0) {
        status = "OCCUPIED_LATER"
        statusLabel = "Sử dụng trong ngày"
        tagColor = "warning"
      }

      return {
        id: room.id,
        key: room.id || idx.toString(),
        name: room.name,
        status,
        statusLabel,
        tagColor,
        activeClass: currentActive,
        schedules: schedulesForRoom,
      }
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [rooms, classSchedules, now])

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
          <TableCollapse
            data={groupedByOrg.map((org) => ({
              ...org,
              schedules: org.schedules.filter((s: any) => {
                if (!searchClass.trim()) return true
                const kw = searchClass.toLowerCase()
                const className = s.subjectClass?.name?.toLowerCase() || ""
                const classCode = s.subjectClass?.code?.toLowerCase() || ""
                const subjectName = s.subjectClass?.subject?.name?.toLowerCase() || ""
                const lecturerName = (s.lecturer?.userProfile?.fullname || s.subjectClass?.mainLecturer?.userProfile?.fullname || "").toLowerCase()
                const roomName = (s.room?.name || s.subjectClass?.room?.name || "").toLowerCase()
                const orgName = (s.subjectClass?.managementOrganization?.sTen || "").toLowerCase()
                const period = `tiết ${s.startPeriod} - ${s.endPeriod}`.toLowerCase()
                return className.includes(kw) || classCode.includes(kw) || subjectName.includes(kw)
                  || lecturerName.includes(kw) || roomName.includes(kw) || orgName.includes(kw) || period.includes(kw)
              }),
            })).filter((org) => !searchClass.trim() || org.schedules.length > 0)}
            childrenFieldName="schedules"
            headerTitleKey="name"
            pagination={false}
            columns={[
              {
                title: "Mã lớp",
                dataIndex: ["subjectClass", "code"],
                width: 120,
                render: (code) => <span className="font-semibold">{code}</span>,
              },
              {
                title: "Tên lớp môn học",
                dataIndex: ["subjectClass", "name"],
              },
              {
                title: "Môn học",
                dataIndex: ["subjectClass", "subject", "name"],
              },
              {
                title: "Giảng viên",
                render: (_, record) => record.lecturer?.userProfile?.fullname || record.subjectClass?.mainLecturer?.userProfile?.fullname || "-",
              },
              {
                title: "Tiết học",
                render: (_, record) => `Tiết ${record.startPeriod} - ${record.endPeriod}`,
              },
              {
                title: "Phòng học",
                render: (_, record) => record.room?.name || record.subjectClass?.room?.name || "-",
              },
            ]}
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
            data={classSchedules
              .filter((s) => {
                if (!searchLecturer.trim()) return true
                const kw = searchLecturer.toLowerCase()
                const lecturerName = (s.lecturer?.userProfile?.fullname || (s as any).subjectClass?.mainLecturer?.userProfile?.fullname || "").toLowerCase()
                const orgName = (s.lecturer?.organization?.sTen || (s as any).subjectClass?.mainLecturer?.organization?.sTen || "").toLowerCase()
                const className = (s as any).subjectClass?.name?.toLowerCase() || ""
                const classCode = (s as any).subjectClass?.code?.toLowerCase() || ""
                const roomName = ((s as any).room?.name || (s as any).subjectClass?.room?.name || "").toLowerCase()
                const period = `tiết ${s.startPeriod} - ${s.endPeriod}`.toLowerCase()
                return lecturerName.includes(kw) || orgName.includes(kw) || className.includes(kw)
                  || classCode.includes(kw) || roomName.includes(kw) || period.includes(kw)
              })
              .map((s, idx) => ({ ...s, key: idx.toString() }))}
            pagination={false}
            columns={[
              {
                title: "Giảng viên",
                render: (_, record) => {
                  const name = record.lecturer?.userProfile?.fullname || record.subjectClass?.mainLecturer?.userProfile?.fullname
                  return <span className="font-semibold">{name || "-"}</span>
                },
              },
              {
                title: "Khoa/Bộ môn",
                render: (_, record) =>
                  record.lecturer?.organization?.sTen || record.subjectClass?.mainLecturer?.organization?.sTen || "-",
              },
              {
                title: "Lớp môn học",
                dataIndex: ["subjectClass", "name"],
              },
              {
                title: "Thời gian",
                render: (_, record) => `Tiết ${record.startPeriod} - ${record.endPeriod}`,
              },
              {
                title: "Địa điểm",
                render: (_, record) => record.room?.name || record.subjectClass?.room?.name || "-",
              },
            ]}
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
            data={roomStatusList
              .filter((r) => r.status !== "FREE")
              .filter((r) => {
                if (!searchRoom.trim()) return true
                const kw = searchRoom.toLowerCase()
                const roomName = r.name?.toLowerCase() || ""
                const allSchedules = r.activeClass ? [r.activeClass, ...r.schedules] : r.schedules
                const classMatch = allSchedules.some((s: any) =>
                  s.subjectClass?.name?.toLowerCase().includes(kw)
                )
                const lecturerMatch = allSchedules.some((s: any) => {
                  const name = s.lecturer?.userProfile?.fullname || s.subjectClass?.mainLecturer?.userProfile?.fullname || ""
                  return name.toLowerCase().includes(kw)
                })
                return roomName.includes(kw) || classMatch || lecturerMatch
              })}
            pagination={false}
            columns={[
              {
                title: "Tên phòng học",
                dataIndex: "name",
                width: 150,
                render: (name) => <span className="font-bold text-gray-800">{name}</span>,
              },
              {
                title: "Lớp môn học sử dụng trong ngày",
                render: (_, record) => {
                  if (record.activeClass) {
                    return <span className="font-semibold text-red-600">{record.activeClass.subjectClass?.name}</span>
                  }
                  if (record.schedules.length > 0) {
                    return (
                      <div className="flex flex-col gap-1">
                        {record.schedules.map((s: any, i: number) => (
                          <span key={i} className="text-orange-600 font-medium">{s.subjectClass?.name || "-"}</span>
                        ))}
                      </div>
                    )
                  }
                  return "-"
                },
              },
              {
                title: "Giảng viên giảng dạy",
                render: (_, record) => {
                  if (record.activeClass) {
                    return record.activeClass.lecturer?.userProfile?.fullname
                      || record.activeClass.subjectClass?.mainLecturer?.userProfile?.fullname
                      || "-"
                  }
                  if (record.schedules.length > 0) {
                    return (
                      <div className="flex flex-col gap-1">
                        {record.schedules.map((s: any, i: number) => (
                          <span key={i}>
                            {s.lecturer?.userProfile?.fullname || s.subjectClass?.mainLecturer?.userProfile?.fullname || "-"}
                          </span>
                        ))}
                      </div>
                    )
                  }
                  return "-"
                },
              },
              {
                title: "Thời gian sử dụng",
                render: (_, record) => {
                  if (record.activeClass) {
                    return <span className="font-semibold text-green-600">{`Tiết ${record.activeClass.startPeriod} - ${record.activeClass.endPeriod} (Đang học)`}</span>
                  }
                  if (record.schedules.length > 0) {
                    return record.schedules
                      .map((s: any) => `Tiết ${s.startPeriod} - ${s.endPeriod}`)
                      .join(", ")
                  }
                  return "-"
                },
              },
            ]}
          />
        </TabPane>
      </Tabs>
    </div>
  )
}
