import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import TreeSelect from "@components/commons/tree-select"
import EditIcon from "@components/icons/edit"
import { DownloadOutlined } from "@ant-design/icons"
import { exportStudentList } from "../../utils/export-student-list"
import { SUBJECT_CLASS_SCHEDULE_TYPE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import {
  layGiangVienPhanCongThayDoi,
  thongBaoHanNhapDiemQuaTrinh,
  thongBaoHanNhapDiemThi,
  thongBaoPhanCongGiangDay,
} from "@lib/thong-bao-giang-vien"
import type { SubjectClass, ClassSchedule, Room } from "@workspace/db/client"
import { createId } from "@workspace/db"
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
  useUpdateClassSchedule,
  useCreateClassSchedule,
  useDeleteClassSchedule,
  useFindManyRoom,
  useUpdateManyStudentSubjectScore,
} from "@workspace/db/hooks"
import { calcFinalScore } from "@workspace/libs/utils"
import { toVnDayjs, toVnEndOfDay, toVnStartOfDay } from "@workspace/libs/timezone"
import { PERIOD } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import {
  Checkbox,
  Col,
  Flex,
  Form,
  InputNumber,
  message,
  Row,
  Tabs,
  Modal,
  DatePicker as AntDatePicker,
  Select as AntSelect,
  Input,
  Button,
} from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState, useMemo } from "react"
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

export interface RescheduleScheduleItem {
  id: string
  classDate: Date | string | null
  roomId: string | null
  startPeriod: number
  endPeriod: number
  notes?: string | null
  isNew?: boolean
  room?: { name: string } | null
  subjectClass?: {
    id: string
    code: string | null
    name: string | null
    examDate: Date | string | null
  } | null
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
  const { mutateAsync: updateClassSchedule } = useUpdateClassSchedule()
  const { mutateAsync: createClassSchedule } = useCreateClassSchedule()
  const { mutateAsync: deleteClassSchedule } = useDeleteClassSchedule()
  const { mutateAsync: updateManyStudentSubjectScore } = useUpdateManyStudentSubjectScore()

  const lecturerId = Form.useWatch("lecturerId", form)
  const extraLecturerId = Form.useWatch("extraLecturerId", form)
  async function onOk(output?: PutOneSubjectClassType) {
    if (!output) return
    try {
      showSpinner()

      const invalidNew = localSchedules.find((s) => s.isNew && !s.classDate)
      if (invalidNew) {
        message.warning("Vui lòng chọn ngày học cho các buổi mới thêm")
        hideSpinner()
        return
      }

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
          examDate: output?.examDate ? toVnStartOfDay(output.examDate) : null,
          scoreDeadline: output?.scoreDeadline ? toVnEndOfDay(output.scoreDeadline) : null,
          examScoreDeadline: output?.examScoreDeadline
            ? toVnEndOfDay(output.examScoreDeadline)
            : null,
          scoreDeadLineStart: output?.scoreDeadLineStart
            ? toVnStartOfDay(output.scoreDeadLineStart)
            : null,
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

      if (input?.id && output.subjectId) {
        await updateManyStudentSubjectScore({
          where: { subjectClassId: input.id, deletedAt: null },
          data: { subjectVersionId: output.subjectId },
        })
      }

      // Xóa buổi đã bỏ khỏi danh sách local
      for (const removedId of removedScheduleIds) {
        await deleteClassSchedule({ where: { id: removedId } })
      }

      // Lưu lịch học: tạo mới / cập nhật
      for (const sched of localSchedules) {
        if (sched.isNew) {
          if (!input?.id || !sched.classDate) continue
          await createClassSchedule({
            data: {
              subjectClassId: input.id,
              classDate: dayjs(sched.classDate)
                .hour(12)
                .minute(0)
                .second(0)
                .millisecond(0)
                .toDate(),
              roomId: sched.roomId,
              startPeriod: sched.startPeriod,
              endPeriod: sched.endPeriod,
              lecturerId: output.lecturerId || subjectClassData?.lecturerId || undefined,
              extraLecturerId:
                output.extraLecturerId || subjectClassData?.extraLecturerId || undefined,
            },
          })
          continue
        }

        const original = classSchedules.find((c) => c.id === sched.id)
        if (
          original &&
          (original.roomId !== sched.roomId ||
            original.startPeriod !== sched.startPeriod ||
            original.endPeriod !== sched.endPeriod ||
            !dayjs(original.classDate).isSame(sched.classDate, "day"))
        ) {
          await updateClassSchedule({
            where: { id: sched.id },
            data: {
              classDate: sched.classDate
                ? dayjs(sched.classDate).hour(12).minute(0).second(0).millisecond(0).toDate()
                : undefined,
              roomId: sched.roomId,
              startPeriod: sched.startPeriod,
              endPeriod: sched.endPeriod,
              isReplacement: true,
            },
          })
        }
      }

      if (input?.id) {
        const gvMoi = layGiangVienPhanCongThayDoi(
          {
            lecturerId: subjectClassData?.lecturerId,
            extraLecturerId: subjectClassData?.extraLecturerId,
          },
          { lecturerId: output.lecturerId, extraLecturerId: output.extraLecturerId }
        )
        if (gvMoi.length) {
          await thongBaoPhanCongGiangDay([input.id], gvMoi)
        }
        const hanQtMoi = output.scoreDeadline ? dayjs(output.scoreDeadline) : null
        const hanQtCu = subjectClassData?.scoreDeadline
          ? dayjs(subjectClassData.scoreDeadline)
          : null
        if (hanQtMoi && (!hanQtCu || !hanQtMoi.isSame(hanQtCu, "day"))) {
          await thongBaoHanNhapDiemQuaTrinh([input.id])
        }

        const hanThiMoi = output.examScoreDeadline ? dayjs(output.examScoreDeadline) : null
        const hanThiCu = subjectClassData?.examScoreDeadline
          ? dayjs(subjectClassData.examScoreDeadline)
          : null
        if (hanThiMoi && (!hanThiCu || !hanThiMoi.isSame(hanThiCu, "day"))) {
          await thongBaoHanNhapDiemThi([input.id])
        }
      }

      queryClient.invalidateQueries({
        queryKey: ["SubjectClass"],
      })
      queryClient.invalidateQueries({
        queryKey: ["ClassSchedule"],
      })
      queryClient.invalidateQueries({
        queryKey: ["StudentSubjectScore"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "StudentSubjectScore"],
      })
      setRemovedScheduleIds([])
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

  const handleExportExcel = async () => {
    if (!subjectClassData) return
    const hideLoading = message.loading("Đang xuất Excel...", 0)
    try {
      const scheduleText =
        subjectClassData.subjectClassTimes
          ?.map((t: any) => `${t.dayOfWeek}, ${t.startPeriod} - ${t.endPeriod}`)
          .join("; ") || ""
      const roomName = subjectClassData.room?.name || ""

      await exportStudentList({
        subjectName: subjectClassData.subject?.name || "",
        subjectClassCode: subjectClassData.code || "",
        credits: subjectClassData.subject?.credit || 0,
        scheduleText,
        roomName,
        students: dataTable,
      })
      message.success("Xuất Excel thành công")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi khi xuất Excel")
    } finally {
      hideLoading()
    }
  }

  const { data: rooms = [] } = useFindManyRoom({
    where: { active: true, deletedAt: null },
  })
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a: Room, b: Room) => (a.name || "").localeCompare(b.name || ""))
  }, [rooms])

  const { data: lecturerData = [] } = useFindManyLecturer({
    include: {
      userProfile: true,
    },
  })

  const { data: subjectClassData } = useFindUniqueSubjectClass(
    {
      where: { id: input?.id },
      include: {
        subject: true,
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
                    trainingObjectType: { include: { trainingLevel: true } },
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

  const [localSchedules, setLocalSchedules] = useState<RescheduleScheduleItem[]>([])
  const [removedScheduleIds, setRemovedScheduleIds] = useState<string[]>([])

  useEffect(() => {
    if (classSchedules) {
      setLocalSchedules(
        classSchedules.map(
          (c) =>
            ({
              id: c.id,
              classDate: c.classDate,
              roomId: c.roomId,
              startPeriod: c.startPeriod,
              endPeriod: c.endPeriod,
              room: c.room,
              subjectClass: c.subjectClass,
              isNew: false,
            }) as RescheduleScheduleItem
        )
      )
      setRemovedScheduleIds([])
    }
  }, [classSchedules])

  const [activeTab, setActiveTab] = useState("lop-mon-hoc")

  useEffect(() => {
    if (isOpen) {
      if (input?.mode === "edit") {
        setActiveTab("lich-hoc")
      } else {
        setActiveTab("lop-mon-hoc")
      }
    }
  }, [isOpen, input])

  const handleUpdateLocal = (id: string, updated: Partial<RescheduleScheduleItem>) => {
    setLocalSchedules((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updated,
            }
          : item
      )
    )
  }

  const handleAddSchedule = () => {
    const defaultTime = times?.[0]
    const roomId = form.getFieldValue("roomId") || subjectClassData?.roomId || null
    const roomObj = rooms.find((r) => r.id === roomId)
    setLocalSchedules((prev) => [
      ...prev,
      {
        id: createId(),
        classDate: null,
        roomId,
        startPeriod: defaultTime?.startPeriod ?? 1,
        endPeriod: defaultTime?.endPeriod ?? 1,
        isNew: true,
        room: roomObj ? { name: roomObj.name } : null,
        subjectClass: subjectClassData
          ? {
              id: subjectClassData.id,
              code: subjectClassData.code,
              name: subjectClassData.name,
              examDate: subjectClassData.examDate,
            }
          : null,
      },
    ])
    setActiveTab("lich-hoc")
  }

  const handleRemoveSchedule = (id: string, isNew?: boolean) => {
    setLocalSchedules((prev) => prev.filter((item) => item.id !== id))
    if (!isNew) {
      setRemovedScheduleIds((prev) => [...prev, id])
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (subjectClassData) {
      form.setFieldsValue({
        ...subjectClassData,
        trainingLocationId: subjectClassData.room?.building?.trainingLocation?.id,
        lecturerAssignmentDeadline: toVnDayjs(subjectClassData.lecturerAssignmentDeadline),
        examDate: toVnDayjs(subjectClassData.examDate),
        scoreDeadline: toVnDayjs(subjectClassData.scoreDeadline),
        examScoreDeadline: toVnDayjs(subjectClassData.examScoreDeadline),
        scoreDeadLineStart: toVnDayjs(subjectClassData.scoreDeadLineStart),
        dayOfWeeks: [...new Set(subjectClassData.subjectClassTimes?.map((item) => item.dayOfWeek))],
        times: subjectClassData.subjectClassTimes
          ?.uniqueByKeys(["dayOfWeek", "startPeriod", "endPeriod"])
          ?.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startPeriod - b.startPeriod)
          ?.map((item) => ({
            dayOfWeek: item.dayOfWeek,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
          })),
      })
    }
  }, [subjectClassData])

  return (
    <>
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
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
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
                        const room = buildingData
                          .flatMap((b) => b.rooms)
                          .find((r) => r.id === roomId)
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
                      disabled={subjectClassData?.isLockLecturer ?? true}
                    />
                  </FormItem>
                </Col>
                <Col span={6}>
                  <FormItem form={form} name="extraLecturerId" label="Giảng viên 2">
                    <LectureTreeSelect
                      placeholder="Chọn giảng viên 2"
                      ignoreLectureIds={[lecturerId].filter(Boolean) as string[]}
                      disabled={subjectClassData?.isLockLecturer ?? true}
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
                      disabled={subjectClassData?.isLockLecturer ?? true}
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
                  <FormItem
                    form={form}
                    name="scoreDeadLineStart"
                    label="Hạn bắt đầu nhập điểm TX/ĐK"
                  >
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
                        render: (value, _record, index) => (
                          <Select
                            defaultValue={value}
                            options={Object.entries(PERIOD).map(([key, val]) => ({
                              label: `${key} - ${val.startTime.format("HH:mm")}`,
                              value: Number(key),
                            }))}
                            onChange={(val) => {
                              const newTimes = times.map((time, i) =>
                                i === index ? { ...time, startPeriod: val } : time
                              )
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
                        render: (value, record, index) => (
                          <Select
                            defaultValue={value}
                            options={Object.entries(PERIOD)
                              .map(([key, val]) => ({
                                label: `${key} - ${val.endTime.format("HH:mm")}`,
                                value: Number(key),
                              }))
                              .filter((item) => Number(item.value) >= record.startPeriod)}
                            onChange={(val) => {
                              const newTimes = times.map((time, i) =>
                                i === index ? { ...time, endPeriod: val } : time
                              )
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
              <Flex justify="end" className="mb-2">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                  disabled={!dataTable?.length}
                >
                  Xuất Excel
                </Button>
              </Flex>
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
                    render: (_, record) => record.student?.userProfile?.code || "",
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
              {input?.mode !== "view" && (
                <Flex justify="end" className="mb-2">
                  <Button type="primary" onClick={handleAddSchedule}>
                    Thêm buổi học
                  </Button>
                </Flex>
              )}
              <Table
                data={localSchedules}
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
                      const isDisabled = input?.mode === "view"
                      return (
                        <AntDatePicker
                          value={record.classDate ? dayjs(record.classDate) : null}
                          format="DD/MM/YYYY"
                          className="w-full"
                          disabled={isDisabled}
                          status={record.isNew && !record.classDate ? "error" : undefined}
                          onChange={(date) => {
                            handleUpdateLocal(record.id, {
                              classDate: date ? date.toDate() : null,
                            })
                          }}
                        />
                      )
                    },
                  },
                  {
                    title: "Tiết học",
                    align: "center",
                    width: 180,
                    render: (_, record) => {
                      const isDisabled = input?.mode === "view"
                      return (
                        <div className="flex gap-1 items-center justify-center">
                          <InputNumber
                            min={1}
                            max={16}
                            value={record.startPeriod}
                            disabled={isDisabled}
                            onChange={(val) => {
                              handleUpdateLocal(record.id, { startPeriod: val ?? 1 })
                            }}
                            style={{ width: 65 }}
                          />
                          <span>-</span>
                          <InputNumber
                            min={1}
                            max={16}
                            value={record.endPeriod}
                            disabled={isDisabled}
                            onChange={(val) => {
                              handleUpdateLocal(record.id, { endPeriod: val ?? 1 })
                            }}
                            style={{ width: 65 }}
                          />
                        </div>
                      )
                    },
                  },
                  {
                    title: "Phòng học",
                    align: "center",
                    render: (_, record) => {
                      const isDisabled = input?.mode === "view"
                      return (
                        <AntSelect
                          showSearch
                          value={record.roomId}
                          placeholder="Chọn phòng học"
                          optionFilterProp="children"
                          disabled={isDisabled}
                          allowClear
                          options={sortedRooms.map((r) => ({ label: r.name, value: r.id }))}
                          onChange={(val) => {
                            const roomObj = rooms.find((r) => r.id === val)
                            handleUpdateLocal(record.id, {
                              roomId: val ?? null,
                              room: roomObj ? { name: roomObj.name } : null,
                            })
                          }}
                          className="w-full"
                        />
                      )
                    },
                  },
                  ...(input?.mode !== "view"
                    ? [
                        {
                          title: "Thao tác",
                          width: 80,
                          align: "center" as const,
                          render: (record: RescheduleScheduleItem) => (
                            <Button
                              type="link"
                              danger
                              onClick={() => handleRemoveSchedule(record.id, record.isNew)}
                            >
                              Xóa
                            </Button>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Tabs.TabPane>
          </Tabs>
        </Col>
      </PutFormModal>
    </>
  )
}

const ModalChangeClassSchedule = ({
  visible,
  onClose,
  schedule,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  schedule: RescheduleScheduleItem | null
  onSuccess: (id: string, updated: Partial<RescheduleScheduleItem>) => void
}) => {
  const [form] = Form.useForm()
  const { data: rooms = [] } = useFindManyRoom({
    where: { active: true, deletedAt: null },
  })
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a: Room, b: Room) => (a.name || "").localeCompare(b.name || ""))
  }, [rooms])
  const { mutateAsync: updateClassSchedule } = useUpdateClassSchedule()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && schedule) {
      form.setFieldsValue({
        classDate: schedule.classDate ? dayjs(schedule.classDate) : null,
        roomId: schedule.roomId,
        startPeriod: schedule.startPeriod,
        endPeriod: schedule.endPeriod,
      })
    }
  }, [visible, schedule, form])

  const handleOk = async () => {
    if (!schedule) return
    try {
      const values = await form.validateFields()
      onSuccess(schedule.id, {
        classDate: values.classDate.toDate(),
        roomId: values.roomId,
        startPeriod: values.startPeriod,
        endPeriod: values.endPeriod,
      })
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal
      title="Thay đổi lịch học buổi học"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      cancelText="Đóng"
      okText="Xác nhận"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="classDate"
          label="Ngày học mới"
          rules={[{ required: true, message: "Vui lòng chọn ngày học mới" }]}
        >
          <AntDatePicker format="DD/MM/YYYY" className="w-full" />
        </Form.Item>
        <Form.Item
          name="roomId"
          label="Phòng học mới"
          rules={[{ required: true, message: "Vui lòng chọn phòng học mới" }]}
        >
          <AntSelect
            showSearch
            placeholder="Chọn phòng học"
            optionFilterProp="children"
            options={sortedRooms.map((r: Room) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startPeriod"
              label="Tiết bắt đầu"
              rules={[{ required: true, message: "Vui lòng nhập tiết bắt đầu" }]}
            >
              <InputNumber min={1} max={16} className="w-full" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endPeriod"
              label="Tiết kết thúc"
              rules={[{ required: true, message: "Vui lòng nhập tiết kết thúc" }]}
            >
              <InputNumber min={1} max={16} className="w-full" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default PutOneSubjectClassModal
