import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TreeSelect from "@components/commons/tree-select"
import { SUBJECT_CLASS_SCHEDULE_TYPE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import type { SubjectClass } from "@workspace/db/client"
import LectureTreeSelect from "@components/commons/lecture-select-multi/TreeSelectLecture"
import {
  useFindManyBuilding,
  useFindManyClassSchedule,
  useFindManyLecturer,
  useFindManySemester,
  useFindManyStudentSubjectScore,
  useFindManySubjectVersion,
  useFindManyTrainingLocation,
  useFindUniqueSubjectClass,
  useUpdateSubjectClass,
} from "@workspace/db/hooks"
import { calcFinalScore } from "@workspace/libs/utils"
import { PERIOD } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox, Col, Form, InputNumber, message, Row, Tabs } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

dayjs.locale("vi")
type FilterTable = FilterProps & {
  fullname?: string
  fixedClassName?: string
  attendanceScore?: "asc" | "desc"
  midtermScore?: "asc" | "desc"
  examScore?: "asc" | "desc"
}
export type PutOneSubjectClassType = SubjectClass & {
  trainingLocationId: string
  dayOfWeeks?: number[]
  times?: { dayOfWeek: number; startPeriod: number; endPeriod: number }[]
}

const PutOneSubjectClassModal = () => {
  const [form] = Form.useForm<PutOneSubjectClassType>()
  const [filterTable, setFilterTable] = useState<FilterTable>({
    fullname: "",
    fixedClassName: "",
    dateOfBirth: undefined,
    attendanceScore: undefined,
    midtermScore: undefined,
    examScore: undefined,
  })
  const times = Form.useWatch("times", form) ?? []
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    mode: "edit" | "view"
    schedules?: Date[]
  }>({
    tag: "PutOneSubjectClassModal",
    onClose: form.resetFields,
  })
  const { onOpen: onOpenDetailStudent } = useDisclosure<string>({
    tag: "ModalChiTietSinhVien",
  })
  const { options } = useExamTypeOptions()
  const { showSpinner, hideSpinner } = useSpinner()
  const [_dataSubmit, _setDataSubmit] = useState<(SubjectClass & { key: number })[]>([])

  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
  // const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

  const lecturerId = Form.useWatch("lecturerId", form)
  const extraLecturerId = Form.useWatch("extraLecturerId", form)
  async function onOk(output?: PutOneSubjectClassType) {
    if (!output) return
    try {
      showSpinner()
      await updateSubjectClass({
        data: { subjectClassTimes: { deleteMany: {} } },
        where: { id: input?.id },
      })
      await updateSubjectClass({
        data: {
          startDate: output.startDate,
          subjectId: output.subjectId,
          schedule: output.schedule,
          semesterId: output.semesterId,
          code: output?.code,
          roomId: output?.roomId,
          maxStudent: output.maxStudent,
          examType: output?.examType,
          lecturerId: output?.lecturerId,
          extraLecturerId: output.extraLecturerId,
          enterGradeLecturerId: output?.enterGradeLecturerId,
          examDate: output?.examDate,
          scoreDeadline: output?.scoreDeadline,
          examScoreDeadline: output.examScoreDeadline,
          lecturerAssignmentDeadline: output.lecturerAssignmentDeadline,
          subjectClassTimes: {
            create: output.times?.map((time) => ({
              dayOfWeek: time.dayOfWeek,
              startPeriod: Number(time.startPeriod),
              endPeriod: Number(time.endPeriod),
            })),
          },
        },
        where: {
          id: input?.id,
        },
      })
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["SubjectClass"],
      })
      onClose()
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

  const handleChangeDate = () => {
    form.setFieldsValue({
      scoreDeadLineStart: form.getFieldValue("examDate").add(-14, "day"),
      scoreDeadline: form.getFieldValue("examDate").add(-7, "day"),
      examScoreDeadline: form.getFieldValue("examDate").add(10, "day"),
    })
  }

  const { data: trainingLocationData = [] } = useFindManyTrainingLocation({
    where: { active: true },
  })

  const { data: subjectVersionData = [] } = useFindManySubjectVersion({ where: { active: true } })

  const { data: semesterData = [] } = useFindManySemester({
    include: { schoolYear: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  })

  const trainingLocationId = Form.useWatch("trainingLocationId", form)

  const { data: buildingData = [] } = useFindManyBuilding({
    orderBy: { name: "asc" },
    where: { deletedAt: null, active: true, trainingLocationId },
    include: {
      rooms: {
        where: {
          deletedAt: null,
          active: true,
        },
      },
    },
  })

  const { data: lecturerData = [] } = useFindManyLecturer({
    include: {
      userProfile: true,
    },
  })

  const { data: subjectClassData } = useFindUniqueSubjectClass(
    {
      where: { id: input?.id },
      include: {
        room: {
          include: {
            building: {
              include: {
                trainingLocation: true,
              },
            },
          },
        },
        subjectClassTimes: true,
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: dataTable = [], refetch } = useFindManyStudentSubjectScore(
    {
      where: {
        subjectClassId: input?.id || "",
        ...(filterTable.fullname
          ? {
              student: {
                userProfile: {
                  fullname: {
                    contains: filterTable.fullname,
                    mode: "insensitive",
                  },
                },
              },
            }
          : {}),
        ...(filterTable.code
          ? {
              student: {
                userProfile: {
                  code: { contains: filterTable.code, mode: "insensitive" },
                },
              },
            }
          : {}),
        ...(filterTable.fixedClassName
          ? {
              student: {
                fixedClass: {
                  name: {
                    contains: filterTable.fixedClassName,
                    mode: "insensitive",
                  },
                },
              },
            }
          : {}),
        ...(filterTable.dateOfBirth?.length === 2
          ? {
              student: {
                userProfile: {
                  dateOfBirth: {
                    gte: dayjs(filterTable.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                    lte: dayjs(filterTable.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        student: {
          include: {
            userProfile: true,
            fixedClass: {
              include: {
                trainingCourse: {
                  include: {
                    scoreConverts: true,
                  },
                },
              },
            },
          },
        },
        subjectClass: {
          include: {
            subject: true,
            semester: {
              include: {
                schoolYear: true,
              },
            },
            mainLecturer: {
              include: {
                userProfile: true,
              },
            },
            extraLecturer: {
              include: {
                userProfile: true,
              },
            },
            enterGradeLecturer: {
              include: {
                userProfile: true,
              },
            },
          },
        },
        awards: {
          where: {
            status: "APPROVED",
          },
          include: {
            archivedAward: true,
          },
        },
        certificates: {
          include: {
            archivedCertificate: true,
          },
        },
      },
      orderBy: [
        ...(filterTable.attendanceScore
          ? [
              {
                attendanceScore: filterTable.attendanceScore,
              },
            ]
          : []),
        ...(filterTable.midtermScore
          ? [
              {
                midtermScore: filterTable.midtermScore,
              },
            ]
          : []),
        ...(filterTable.examScore
          ? [
              {
                examScore: filterTable.examScore,
              },
            ]
          : []),
        {
          student: {
            userProfile: {
              firstName: "asc",
            },
          },
        },
      ],
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: classSchedules = [] } = useFindManyClassSchedule(
    {
      where: {
        subjectClass: {
          id: input?.id,
        },
      },
      select: {
        id: true,
        classDate: true,
        startPeriod: true,
        endPeriod: true,
        periodType: true,
        subjectClass: {
          select: {
            id: true,
            code: true,
            name: true,
            examDate: true,
          },
        },
        roomId: true,
        room: {
          select: {
            name: true,
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (subjectClassData) {
      form.setFieldsValue({
        ...subjectClassData,
        trainingLocationId: subjectClassData.room?.building?.trainingLocation?.id,
        lecturerAssignmentDeadline: subjectClassData.lecturerAssignmentDeadline
          ? dayjs(subjectClassData.lecturerAssignmentDeadline)
          : null,
        examDate: subjectClassData.examDate ? dayjs(subjectClassData.examDate) : null,
        scoreDeadline: subjectClassData.scoreDeadline
          ? dayjs(subjectClassData.scoreDeadline)
          : null,
        examScoreDeadline: subjectClassData.examScoreDeadline
          ? dayjs(subjectClassData.examScoreDeadline)
          : null,
        scoreDeadLineStart: subjectClassData.scoreDeadLineStart
          ? dayjs(subjectClassData.scoreDeadLineStart)
          : null,
        dayOfWeeks: [...new Set(subjectClassData.subjectClassTimes?.map((item) => item.dayOfWeek))],
        times: subjectClassData.subjectClassTimes?.uniqueByKey("dayOfWeek")?.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          startPeriod: item.startPeriod,
          endPeriod: item.endPeriod,
        })),
      })
    }
  }, [subjectClassData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.mode === "view"
          ? "Xem lớp môn học"
          : input?.id
            ? "Cập nhật lớp môn học"
            : "Mở lớp môn học"
      }
      className="w-[95vw]"
      formProps={{
        disabled: input?.mode === "view",
      }}
      okButtonProps={{
        hidden: input?.mode === "view",
      }}
      cancelButtonProps={{
        hidden: input?.mode === "view",
      }}
    >
      <Col span={24}>
        <Tabs defaultActiveKey="lop-mon-hoc">
          <Tabs.TabPane tab={"Lớp môn học"} key="lop-mon-hoc">
            <Row gutter={[8, 8]}>
              <Col span={6}>
                <FormItem form={form} name="semesterId" label="Học kỳ" required>
                  <Select
                    placeholder="Chọn học kỳ"
                    showSearch
                    options={semesterData.map((item) => {
                      return {
                        ...item,
                        label: [item?.name, item?.schoolYear?.name].filter(Boolean).join(" - "),
                        value: item.id,
                      }
                    })}
                    disabled
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="subjectId" label="Môn học" required>
                  <Select
                    disabled={true}
                    placeholder="Chọn môn học"
                    options={subjectVersionData.map((item) => {
                      return {
                        ...item,
                        label: [item?.code, item?.name].filter(Boolean).join(" - "),
                        value: item.id,
                      }
                    })}
                    allowClear
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="schedule" label="Kíp học">
                  <Select
                    placeholder="Chọn kíp học"
                    options={Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(([key, value_]) => {
                      return {
                        label: value_,
                        value: key,
                      }
                    })}
                    allowClear
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="trainingLocationId" label="Địa điểm">
                  <Select
                    placeholder="Chọn địa điểm"
                    options={trainingLocationData.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      }
                    })}
                    onChange={() => {
                      form.setFieldsValue({
                        roomId: undefined,
                      })
                    }}
                    allowClear
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="roomId" label="Phòng học">
                  <TreeSelect
                    treeData={buildingData.map((e) => ({
                      title: e.name,
                      label: e.name,
                      value: e.id,
                      selectable: false,
                      children: e.rooms.map((room) => ({
                        title: (
                          <span>
                            {room.name} - Sức chứa: {room.capacity}
                          </span>
                        ),
                        label: room.name,
                        filterValue: room.name,
                        value: room.id,
                        selectable: true,
                      })),
                    }))}
                    onChange={(roomId) => {
                      const room = buildingData.flatMap((b) => b.rooms).find((r) => r.id === roomId)
                      form.setFieldsValue({ maxStudent: room?.capacity ?? undefined })
                    }}
                    showSearch
                    allowClear
                    treeNodeFilterProp="title"
                    treeNodeLabelProp="label"
                    filterTreeNode={(input, option) =>
                      ((option as any)?.filterValue ?? "")
                        .toLowerCase()
                        .includes(input?.toLowerCase())
                    }
                    multiple={false}
                    showCheckedStrategy="SHOW_CHILD"
                    dropdownStyle={{
                      width: 400,
                      maxHeight: 400,
                    }}
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="maxStudent" label="Số SV tối đa">
                  <InputNumber
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Nhập số SV tối đa"
                    className="w-full"
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="lecturerId" label="Giảng viên 1">
                  <LectureTreeSelect
                    placeholder="Chọn giảng viên 1"
                    ignoreLectureIds={[extraLecturerId].filter(Boolean) as string[]}
                    onChange={(value) => {
                      form.setFieldsValue({ enterGradeLecturerId: value })
                    }}
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="extraLecturerId" label="Giảng viên 2">
                  <LectureTreeSelect
                    placeholder="Chọn giảng viên 2"
                    ignoreLectureIds={[lecturerId].filter(Boolean) as string[]}
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="enterGradeLecturerId" label="Giảng viên chấm điểm">
                  <LectureTreeSelect
                    placeholder="Chọn giảng viên"
                    onChange={(value) => {
                      form.setFieldsValue({ lecturerId: value })
                    }}
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="lecturerAssignmentDeadline" label="Hạn PCGD">
                  <DatePicker
                    placeholder="DD/MM/YYYY"
                    format={{
                      format: "DD/MM/YYYY",
                      type: "mask",
                    }}
                    className="w-full"
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="examDate" label="Ngày thi">
                  <DatePicker
                    onChange={handleChangeDate}
                    placeholder="DD/MM/YYYY"
                    format={{
                      format: "DD/MM/YYYY",
                      type: "mask",
                    }}
                    className="w-full"
                  />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="scoreDeadLineStart" label="Hạn bắt đầu nhập điểm TX/ĐK">
                  <DatePicker disabled placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="scoreDeadline" label="Hạn kết thúc nhập điểm TX/ĐK">
                  <DatePicker disabled placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="examScoreDeadline" label="Hạn nhập điểm thi">
                  <DatePicker disabled placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem form={form} name="examType" label="Hình thức thi">
                  <Select placeholder="Chọn hình thức thi" options={options} />
                </FormItem>
              </Col>
              <Col span={24}>
                <FormItem form={form} name="dayOfWeeks" label="Ngày học trong tuần">
                  <Select
                    placeholder="Chọn ngày trong tuần"
                    mode="multiple"
                    allowClear
                    options={[
                      { label: "Thứ 2", value: 2 },
                      { label: "Thứ 3", value: 3 },
                      { label: "Thứ 4", value: 4 },
                      { label: "Thứ 5", value: 5 },
                      { label: "Thứ 6", value: 6 },
                      { label: "Thứ 7", value: 7 },
                      { label: "Chủ nhật", value: 8 },
                    ]}
                    onChange={(value) => {
                      form.setFieldsValue({
                        times: value.map((dayOfWeek: number) => ({
                          dayOfWeek,
                          startPeriod: 1,
                          endPeriod: 1,
                        })),
                      })
                    }}
                  />
                </FormItem>
              </Col>
              <FormItem form={form} name="times" hidden />
              <Col span={24}>
                <Table
                  pagination={false}
                  columns={[
                    {
                      title: "Thứ",
                      dataIndex: "dayOfWeek",
                      key: "dayOfWeek",
                      align: "center",
                      render: (value) => {
                        if (value === 2) return "Thứ 2"
                        if (value === 3) return "Thứ 3"
                        if (value === 4) return "Thứ 4"
                        if (value === 5) return "Thứ 5"
                        if (value === 6) return "Thứ 6"
                        if (value === 7) return "Thứ 7"
                        if (value === 8) return "Chủ nhật"
                        return ""
                      },
                    },
                    {
                      title: "Tiết bắt đầu",
                      dataIndex: "startPeriod",
                      key: "startPeriod",
                      align: "center",
                      render: (value) => (
                        <Select
                          defaultValue={value}
                          options={Object.entries(PERIOD).map(([key, val]) => ({
                            label: `${key} - ${val.startTime.format("HH:mm")}`,
                            value: Number(key),
                          }))}
                          onChange={(val) => {
                            const newTimes = times.map((time) => {
                              if (time.startPeriod === value) {
                                return { ...time, startPeriod: val }
                              }
                              return time
                            })
                            form.setFieldsValue({
                              times: newTimes,
                            })
                          }}
                          className="w-full"
                        />
                      ),
                    },
                    {
                      title: "Tiết kết thúc",
                      dataIndex: "endPeriod",
                      key: "endPeriod",
                      align: "center",
                      render: (value, record) => (
                        <Select
                          defaultValue={value}
                          options={Object.entries(PERIOD)
                            .map(([key, val]) => ({
                              label: `${key} - ${val.endTime.format("HH:mm")}`,
                              value: Number(key),
                            }))
                            .filter((item) => Number(item.value) >= record.startPeriod)}
                          onChange={(val) => {
                            const newTimes = times.map((time) => {
                              if (time.endPeriod === value) {
                                return { ...time, endPeriod: val }
                              }
                              return time
                            })
                            form.setFieldsValue({
                              times: newTimes,
                            })
                          }}
                          className="w-full"
                        />
                      ),
                    },
                  ]}
                  data={times}
                />
              </Col>
            </Row>
          </Tabs.TabPane>
          <Tabs.TabPane tab={"Danh sách sinh viên"} key="danh-sach-sinh-vien">
            <Table
              filters={filterTable}
              setFilters={setFilterTable}
              rowKey="id"
              className="m-0"
              onRow={(record) => ({
                onClick: (e) => {
                  e.preventDefault()
                  onOpenDetailStudent(record.student?.id || "")
                },
                className: "cursor-pointer hover:text-primary",
              })}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã sinh viên",
                  dataIndex: "code",
                  align: "center",
                  width: 150,
                  type: "input",
                  render: (_, record) => record.student?.code || "",
                },
                {
                  title: "Họ và tên",
                  dataIndex: "fullname",
                  width: 150,
                  type: "input",
                  render: (_, record) => record?.student?.userProfile?.fullname || "",
                },
                {
                  title: "Ngày sinh",
                  dataIndex: "dateOfBirth",
                  width: 125,
                  type: "date",
                  align: "center",
                  render: (_, record) =>
                    record?.student?.userProfile.dateOfBirth
                      ? dayjs(record?.student?.userProfile.dateOfBirth).format("DD/MM/YYYY")
                      : "",
                },
                {
                  title: "Lớp",
                  dataIndex: "fixedClassName",
                  width: 120,
                  align: "center",
                  type: "input",
                  render: (_, record) => record.student?.fixedClass?.code || "",
                },
                // #region Điểm TX
                {
                  title: "Điểm TX",
                  dataIndex: "attendanceScore",
                  width: 100,
                  align: "center",
                  type: "order",
                  render: (_, record) => record.attendanceScore ?? "",
                },
                // #region Điểm ĐK
                {
                  title: "Điểm ĐK",
                  dataIndex: "midtermScore",
                  width: 100,
                  align: "center",
                  type: "order",
                  render: (_, record) => record.midtermScore ?? "",
                },
                // #region Điểm Thi
                {
                  title: "Điểm thi",
                  dataIndex: "examScore",
                  width: 100,
                  type: "order",
                  align: "center",
                  render: (_, record) => record.examScore ?? "",
                },
                {
                  title: "Điểm HP",
                  width: 80,
                  align: "center",
                  render: (_, record: any) => {
                    const finalScore = calcFinalScore(
                      record?.student?.fixedClass?.trainingCourse,
                      {
                        ...record,
                        attendanceScore: record?.attendanceScore,
                        midtermScore: record?.midtermScore,
                        examScore: record?.examScore,
                      },
                      record.subjectClass?.type || "NORMAL"
                    )?.toNumber()
                    return <div>{finalScore}</div>
                  },
                },
                {
                  title: "Cấm thi",
                  width: 80,
                  align: "center",
                  render: (_, record) => {
                    return <Checkbox disabled checked={record.examBanned} />
                  },
                },
                {
                  title: "Lý do cấm thi",
                  width: 150,
                  render: (_, record) => record.examBannedReason || "",
                },
                {
                  title: "Hoãn thi",
                  width: 80,
                  align: "center",
                  render: (_, record) => {
                    return <Checkbox disabled checked={record.examPostponed} />
                  },
                },
                {
                  title: "Lý do hoãn thi",
                  width: 200,
                  render: (_, record) => record.examPostponedReason || "",
                },
                {
                  title: "Đình chỉ",
                  width: 80,
                  align: "center",
                  render: (_, record) => {
                    return <Checkbox disabled checked={record.suspended} />
                  },
                },
                {
                  title: "Lý do đình chỉ",
                  width: 140,
                  render: (_, record) => record.suspendedReason || "",
                },
                {
                  title: "Ghi chú",
                  dataIndex: "description",
                  width: 150,
                  align: "center",
                  render: (_, record) => record.description || "",
                },
              ]}
              data={dataTable}
              pagination={false}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab={"Lịch học"} key="lich-hoc">
            <Table
              data={classSchedules}
              className="m-0"
              pagination={false}
              columns={[
                {
                  title: "TT",
                  width: 35,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Ngày học",
                  render: (_, record) => {
                    return (
                      <p
                        className={cn(
                          input?.schedules?.some((date) =>
                            dayjs(record.classDate).isSame(date, "day")
                          ) && "text-primary font-semibold",
                          record.subjectClass?.examDate &&
                            dayjs(record.classDate).isSame(record.subjectClass.examDate, "day")
                            ? "text-red-600"
                            : ""
                        )}
                      >
                        {record.subjectClass?.examDate &&
                        dayjs(record.classDate).isSame(record.subjectClass.examDate, "day")
                          ? "Ngày thi:"
                          : ""}{" "}
                        {dayjs(record.classDate).format("dddd DD/MM/YYYY").titleCase()}
                      </p>
                    )
                  },
                },
                {
                  title: "Tiết học",
                  align: "center",
                  render: (_, record) => {
                    return (
                      <>
                        {record.startPeriod} - {record.endPeriod}
                      </>
                    )
                  },
                },
              ]}
            />
          </Tabs.TabPane>
        </Tabs>
      </Col>
    </PutFormModal>
  )
}

export default PutOneSubjectClassModal
